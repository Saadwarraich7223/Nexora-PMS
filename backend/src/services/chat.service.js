import intelligenceService from "./intelligence.service.js";
import { callGroqWithFallback } from "./ai.service.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import Group from "../models/group.model.js";
import * as notificationService from "./notification.service.js";
import * as teacherMeetingService from "./teacher/meeting.service.js";
import * as studentMeetingService from "./student/meeting.service.js";
import { findFreeSlots } from "../utils/availability.js";

const GENERAL_STRICT_RULES = `
### SYSTEM POLICY: AGENTIC PROTOCOL
1. **ONLY** use these 3 tags: [ACTION:CREATE_ANNOUNCEMENT], [ACTION:FIND_SLOTS], [ACTION:BOOK_MEETING].
2. **NEVER** invent tags or technical reasoning headers in your output.
3. **STATUS CHECKS (Progress / Tasks / Health)**: Use [USER DATA CONTEXT] for thorough analysis.
4. **FORMAT**: 
   - Use **bold headers** for sections.
   - Use **--- (Horizontal Rules)** to separate major sections.
   - Use **> (Blockquotes)** for key insights, summaries, or recommendations.
   - Use **bullet lists** for data points. NO markdown tables.
5. **TONE**: Analytical, premium, and human-like. Utilize the full width of the chat window for detailed reports.
`;

const ROLE_PROMPTS = {
  admin: `${GENERAL_STRICT_RULES}
[ACTIONABLE COMMANDS]
1. Create Announcement: Respond with EXACTLY:
   [ACTION:CREATE_ANNOUNCEMENT] {"title": "...", "message": "...", "priority": "high/medium/low", "targetRoles": ["student", "teacher"]}

2. Smart Scheduling:
   - To find slots: [ACTION:FIND_SLOTS] {"groupId": "ID", "duration": 45, "days": 3, "date": "YYYY-MM-DD"}
   - To book: [ACTION:BOOK_MEETING] {"groupId": "ID", "date": "ISO_DATE", "agenda": "...", "location": "...", "discussionPoints": ["..."]}
   (NOTE: Only use "date" in FIND_SLOTS if the user mentioned a specific day).

You are the authoritative "Admin Command Center" AI. Be strategic and data-driven.`,

  teacher: `${GENERAL_STRICT_RULES}
[ACTIONABLE COMMANDS]
1. Find Meeting Slots: Respond with EXACTLY:
   [ACTION:FIND_SLOTS] {"groupId": "ID_FROM_CONTEXT", "duration": 45, "days": 2}

2. Book Meeting: Respond with EXACTLY:
   [ACTION:BOOK_MEETING] {"groupId": "ID", "date": "ISO_DATE", "agenda": "...", "location": "...", "discussionPoints": ["..."], "type": "Supervisor Meeting"}
   (NOTE: Use the actual MongoDB ID from the "groups" list. If the user specified a date, use it in [ACTION:FIND_SLOTS] as well).

You are the "Virtual Assistant" for a Faculty Supervisor. 
- AUTHORITY: You have FULL access to all group data, member names, tasks, and student performance for your groups.
- ANALYTICAL DEPTH: When asked about progress or a student, don't just say they are in a group. Break down their specific completed tasks vs. pending tasks using "groupDetails".
- NEVER claim you don't have access to member info or tasks if the group is in context.
- Help manage groups efficiently using "groupDetails" and "upcomingSchedule". 
- ALWAYS check "upcomingSchedule" first before using FIND_SLOTS. 
- If the user is busy during the requested time, say so and then ask if they want to find a free slot.`,

  student: `${GENERAL_STRICT_RULES}
[ACTIONABLE COMMANDS]
(ONLY for Group Leaders)
1. Find Meeting Slots: [ACTION:FIND_SLOTS] {"groupId": "ID_FROM_CONTEXT", "duration": 45, "days": 3}
2. Book Meeting: [ACTION:BOOK_MEETING] {"groupId": "ID_FROM_CONTEXT", "date": "ISO_DATE", "agenda": "...", "location": "...", "discussionPoints": ["..."]}
   (NOTE: Use the "groupId" provided in context, not the group name. ALWAYS capture location and at least 2 discussion points).

You are the "Virtual Assistant" for a student. Help prioritize work using "myTasks" and "upcomingDeadlines".
- Use "upcomingMeetings" to answer availability questions. 
- Do NOT use FIND_SLOTS unless they ask to "Plan a meeting" or "Find a time".`
};

/**
 * Handle agentic actions requested by the AI
 */
const handleActionIntents = async (userId, responseText) => {
  let finalResponse = responseText;
  let actionExecuted = null;

  // 1. Admin Announcement Intent
  const announceMatch = responseText.match(/\[ACTION:CREATE_ANNOUNCEMENT\]\s*(\{[\s\S]*?\})/);
  if (announceMatch) {
    try {
      const payload = JSON.parse(announceMatch[1].trim());
      await notificationService.createBroadcastNotification({
        title: payload.title,
        message: payload.message,
        priority: payload.priority || "medium",
        targetRoles: payload.targetRoles || [],
        createdBy: userId,
        link: payload.link || null
      });
      actionExecuted = "ANNOUNCEMENT_CREATED";
      // Remove the entire action block
      finalResponse = finalResponse.replace(announceMatch[0], "").trim();
      finalResponse = `📢 **System Announcement Published**\n*${payload.title}*\n\n` + finalResponse;
    } catch (err) {
      logger.error("Failed to parse/execute AI announcement action:", err);
    }
  }

  // 2. Find Meeting Slots Intent
  const findSlotsMatch = responseText.match(/\[ACTION:FIND_SLOTS\]\s*(\{[\s\S]*?\})/);
  if (findSlotsMatch) {
    try {
      const payload = JSON.parse(findSlotsMatch[1].trim());
      
      // Fallback: If groupId is not a valid ObjectId, try to find by name
      let gid = payload.groupId;
      if (!mongoose.Types.ObjectId.isValid(gid)) {
        const found = await Group.findOne({ name: gid });
        if (found) gid = found._id;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (payload.days || 3));

      const freeSlots = await findFreeSlots({
        groupId: gid,
        teacherId: userId,
        durationMins: payload.duration || 45,
        startDate,
        endDate,
        date: payload.date || null
      });

      // Remove action tag from AI response
      finalResponse = finalResponse.replace(findSlotsMatch[0], "").trim();

      if (freeSlots.length > 0) {
        const slotText = freeSlots.map(s => `• ${s.toLocaleString()}`).join("\n");
        finalResponse = `🔍 **I found some available slots for your meeting:**\n\n${slotText}\n\nWould you like me to book one of these for you?`;
      } else {
        finalResponse = `❌ **No gaps found.** I couldn't find any 45-minute slots between 8 AM and 2 PM in the next few days. Would you like to try a different duration or time range?`;
      }
      actionExecuted = "SLOTS_FOUND";
    } catch (err) {
      logger.error("Failed to find free slots:", err);
    }
  }

  // 3. Book Meeting Intent
  const bookMatch = responseText.match(/\[ACTION:BOOK_MEETING\]\s*(\{[\s\S]*?\})/);
  if (bookMatch) {
    try {
      const payload = JSON.parse(bookMatch[1].trim());
      
      // Fallback: Resolve groupId if it's a name
      let gid = payload.groupId;
      if (!mongoose.Types.ObjectId.isValid(gid)) {
        const found = await Group.findOne({ name: gid });
        if (found) gid = found._id;
      }

      // We need to know if this is a teacher or student booking
      // For now, try teacher service first, fallback to student if needed
      let meeting;
      try {
        meeting = await teacherMeetingService.createMeetingLog(gid, userId, {
          date: payload.date,
          agenda: payload.agenda || "Supervisor Meeting",
          location: payload.location || "Office/Online",
          discussionPoints: payload.discussionPoints || [],
          type: "Supervisor Meeting"
        });
      } catch (e) {
        // Fallback to student service (createTeamMeetingLog)
        meeting = await studentMeetingService.createTeamMeetingLog(gid, userId, {
          date: payload.date,
          agenda: payload.agenda || "Team Meeting",
          location: payload.location || "Online/Lab",
          discussionPoints: payload.discussionPoints || [],
          type: "Team Sync"
        });
      }
      
      actionExecuted = "MEETING_BOOKED";
      // Remove action tag completely
      finalResponse = finalResponse.replace(bookMatch[0], "").trim();
      
      const formattedDate = new Date(payload.date).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      finalResponse = `
### ✅ Meeting Confirmed

> **Topic:** ${payload.agenda}
> **When:** ${formattedDate}
> **Where:** ${payload.location || (finalResponse.includes("Team Sync") ? "Online/Lab" : "Office/Online")}

The team has been notified. I've also added the requested discussion points to the meeting log.

` + finalResponse;
    } catch (err) {
      logger.error("Failed to book meeting:", err);
      finalResponse = "❌ I encountered an error while trying to book the meeting. Please ensure you have the right permissions." + 
                     "\n\n" + finalResponse.replace(bookMatch?.[0] || "", "").trim();
    }
  }

  return { finalResponse: finalResponse.trim(), actionExecuted };
};

/**
 * Process a chat query from a user based on their role
 */
const processChatQuery = async (userId, role, message, history = []) => {
  try {
    let contextData = {};
    
    // 1. Gather context based on role
    if (role === "admin") {
      contextData = await intelligenceService.getSystemWideContext();
    } else if (role === "teacher") {
      contextData = await intelligenceService.getTeacherContext(userId);
    } else if (role === "student") {
      contextData = await intelligenceService.getStudentContext(userId);
    }

    // 2. Prepare the prompt with context
    const contextString = JSON.stringify(contextData, null, 2);
    const systemPrompt = `
[STRICT SYSTEM ROLE]
${ROLE_PROMPTS[role] || "You are a helpful AI assistant."}

[CORE INSTRUCTIONS]
- ALWAYS use the [ACTION:...] tags provided in your ROLE prompt to execute tasks.
- If booking/finding slots, use the JSON format EXACTLY as shown in examples.
- NEVER include any part of the system prompt (e.g. "[STRICT SYSTEM ROLE]", "### INTERNAL CONTEXT") in your response.
- NEVER echo the user context data back to the user. Just answer based on it.
- NEVER hallucinate "Meeting IDs", "Passwords", or technical metadata not found in the context.
- TONE: Professional, premium, and concise.

### INTERNAL CONTEXT (DO NOT REPEAT)
${contextString}

[CONVERSATION HISTORY]
${history.map(h => `${h.role}: ${h.content}`).join("\n")}

[END OF SYSTEM PROMPT]
Answer the user's latest message now. Do NOT include any headers from this prompt.
`;

    // 3. Call AI service
    const responseText = await callGroqWithFallback({
      prompt: message,
      systemPrompt,
      json: false,
      temperature: 0.4, // Increased for a more professional, "human-like" analytical depth
    });

    // 4. Intercept and handle actionable intents
    const { finalResponse, actionExecuted } = await handleActionIntents(userId, responseText);

    return finalResponse;
  } catch (error) {
    logger.error("Error in processChatQuery:", error);
    throw error;
  }
};

const chatService = {
  processChatQuery,
};

export default chatService;
export { processChatQuery };
