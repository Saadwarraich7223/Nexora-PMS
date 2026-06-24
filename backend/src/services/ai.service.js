import Groq from "groq-sdk";
import ApiError from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

let groq;
try {
  // Gracefully handle missing API key
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (e) {
  groq = null;
}

const checkGroqKey = () => {
  if (!groq) {
    throw new ApiError(
      503,
      "AI services are currently unavailable. Please configure GROQ_API_KEY.",
    );
  }
};

/**
 * Centralized Groq Caller with Automated Model Fallback
 * Primary: llama-3.3-70b-versatile (Current high-fidelity standard)
 * Fallback: llama-3.1-8b-instant (Fast, resilient backup)
 */
const callGroqWithFallback = async ({
  prompt,
  systemPrompt,
  temperature = 0.2,
  json = true,
}) => {
  checkGroqKey();

  const PRIMARY_MODEL = "llama-3.3-70b-versatile";
  const FALLBACK_MODEL = "llama-3.1-8b-instant";

  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const options = {
    messages,
    temperature,
  };
  if (json) options.response_format = { type: "json_object" };

  try {
    const chatCompletion = await groq.chat.completions.create({
      ...options,
      model: PRIMARY_MODEL,
    });
    return chatCompletion.choices[0]?.message?.content || (json ? "{}" : "");
  } catch (error) {
    console.warn(`AI Primary Model (${PRIMARY_MODEL}) failed:`, error.message);

    // Attempt fallback
    try {
      const fallbackCompletion = await groq.chat.completions.create({
        ...options,
        model: FALLBACK_MODEL,
      });
      return (
        fallbackCompletion.choices[0]?.message?.content || (json ? "{}" : "")
      );
    } catch (fallbackError) {
      logger.error("AI Fallback Model Failed:", fallbackError);
      throw new ApiError(500, `AI service failure: ${fallbackError.message}`);
    }
  }
};

/**
 * Generate structured tasks from a feature description
 */
const generateTaskBreakdown = async (featureDescription, taskCount = 5) => {
  const prompt = `You are an expert agile project manager. The user will provide a feature description. 
Break this feature down into exactly ${taskCount} specific, actionable tasks.
Make sure the tasks are clear and cover both frontend and backend work if applicable.

Return ONLY a valid JSON array of objects.
Each object should have the exact following shape:
{
  "title": "Short descriptive title (max 50 chars)",
  "priority": "one of: low, medium, high",
  "status": "todo",
  "description": "Longer description (max 200 chars)",
 
}

Feature Description:
"${featureDescription}"`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt:
      "You are a specialized Tasks Architect. Output MUST be valid JSON.",
    json: true,
  });

  try {
    const parsed = JSON.parse(responseText);
    const result = Array.isArray(parsed)
      ? parsed
      : parsed.tasks || parsed.data || Object.values(parsed)[0] || [];
    return Array.isArray(result) ? result : [];
  } catch (e) {
    return [];
  }
};

/**
 * Strategic AI meeting summarizer for high-fidelity intelligence narratives.
 */
const generateMeetingSummaryAI = async ({
  agenda,
  discussionPoints,
  isFuture = false,
}) => {
  const points = (discussionPoints || []).filter(Boolean);

  // If data is too sparse, return a placeholder instead of calling AI
  if (!agenda && points.length === 0) {
    return {
      executiveSummary:
        "Not enough meeting data to generate a strategic narrative. Please provide an agenda or discussion points.",
      keyDecisions: ["Awaiting data synchronization."],
      actionItems: [],
      nextMeetingFocus: "Define next objectives in the upcoming session.",
    };
  }

  const pointsText = points.join("\n- ");
  const tenseHint = isFuture
    ? "NOTE: This is an UPCOMING session. Use FUTURE tense (e.g. 'The team will...', 'Objectives will include...')."
    : "NOTE: This is a COMPLETED session. Use PAST tense (e.g. 'The team discussed...', 'Key outcomes included...').";

  const prompt = `${tenseHint}
You are a high-level strategic analyst. Summarize this meeting session.
Agenda: ${agenda || "No specific agenda provided."}
Key Points:
${points.length > 0 ? `- ${pointsText}` : "No specific points recorded."}

Return ONLY JSON:
{
  "executiveSummary": "A concise, high-impact paragraph of the session's core value in the correct tense.",
  "keyDecisions": [string],
  "actionItems": [{ "title": string, "description": string, "assignee": string, "deadline": string }],
  "nextMeetingFocus": "What should the next sync prioritize?"
}`;

  try {
    const responseText = await callGroqWithFallback({
      prompt,
      systemPrompt: "Senior Strategic Auditor. Strict JSON output.",
      json: true,
    });

    const parsed = JSON.parse(responseText || "{}");

    return {
      executiveSummary: parsed.executiveSummary || "Summary pending.",
      keyDecisions: Array.isArray(parsed.keyDecisions)
        ? parsed.keyDecisions
        : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      nextMeetingFocus: parsed.nextMeetingFocus || "Continuous iteration.",
    };
  } catch (error) {
    logger.error("AI Meeting Summary Error:", error);
    return {
      executiveSummary:
        "The AI Narrator encountered a processing anomaly. Manual review recommended.",
      keyDecisions: [],
      actionItems: [],
      nextMeetingFocus: "Retry synchronization after protocol update.",
    };
  }
};

const summarizeMeeting = generateMeetingSummaryAI;

/**
 * AI-powered project proposal analysis.
 */
const analyzeProposalAI = async (title, description, context = []) => {
  if (!description || description.trim() === "") {
    throw new ApiError(400, "Project description is required for analysis");
  }

  const wordCount = description.trim().split(/\s+/).length;
  const contextSnippet =
    context && context.length > 0
      ? context
          .map(
            (p) => `- TITLE: "${p.title}" | SUMMARY:
      ${p.summary}`,
          )
          .join("\n")
      : "NONE (No similar projects found in database)";

  const prompt = `Senior Academic Auditor.
    
     [ARCHIVE OF PREVIOUS PROJECTS]
     ${contextSnippet}
  
     [CURRENT SUBMISSION TO ANALYZE]
     Target Title: "${title}"
    Target Description: "${description}"
   
    CRITICAL PLAGIARISM RULES:
    1. ONLY flag as a duplicate if the CORE TOPIC or DOMAIN
      matches a project in the ARCHIVE.
    2. DO NOT flag for "Structural Similarity." Most projects
      use the same headers (Problem Statement, Tech Stack, etc.)
      - this is NOT plagiarism.
    3. A "Smart Parking" system is NOT a duplicate of a "Smart
      Waste" system or a "Task Management" system. They solve
      different problems.
    4. Only set "score" to 0 if the actual IDEA is stolen
      (e.g., another Parking system with the same logic),Than :
         Set "score" to 0.
       - Set "isDuplicate" to true.
       - Set "contextObservation" to "This proposal is a
      duplicate of the existing project: [Insert Title from
      ARCHIVE]".
    5. If the Target is unique, evaluate its quality normally
      (80-100 score).
Evaluate and return ONLY JSON:
{
  "score": 0-100,
  "hasProblemStatement": boolean,
  "hasSolution": boolean,
  "hasTechStack": boolean,
  "hasArchitecture": boolean,
  "hasOutcomes": boolean,
  "strengths": [string],
  "weaknesses": [string],
  "suggestions": [string],
  "riskFlags": [string],
  "recommendation": "string",
  "contextObservation": "string"
}`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Elite Academic Advisor. Strict JSON.",
    json: true,
  });

  const parsed = JSON.parse(responseText);
  return {
    wordCount,
    score: Math.max(0, Math.min(100, parsed.score || 0)),
    hasProblemStatement: Boolean(parsed.hasProblemStatement),
    hasSolution: Boolean(parsed.hasSolution),
    hasTechStack: Boolean(parsed.hasTechStack),
    hasArchitecture: Boolean(parsed.hasArchitecture),
    hasOutcomes: Boolean(parsed.hasOutcomes),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.slice(0, 4)
      : [],
    weaknesses: Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.slice(0, 4)
      : [],
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.slice(0, 4)
      : [],
    riskFlags: Array.isArray(parsed.riskFlags)
      ? parsed.riskFlags.slice(0, 3)
      : [],
    recommendation: parsed.recommendation || "No recommendation generated.",
    contextObservation: parsed.contextObservation || "Standard analysis.",
    analyzedByAI: true,
    aiAnalyzedAt: new Date(),
  };
};

/**
 * Auto-generates a proposal review for approval or rejection.
 */
const generateProposalReview = async (
  title,
  description,
  analysis,
  decision,
) => {
  const isApproval = decision === "approve";

  const prompt = `
You are an academic supervisor reviewing a student project proposal.

Decision: ${isApproval ? "APPROVE" : "REJECT"}

Project Title: "${title || "Untitled"}"

Project Description:
${description || "No description provided."}

Evaluation Analysis:
${JSON.stringify(analysis, null, 2)}

Task:
Write a concise, professional, and constructive review feedback message addressed to the student group.

Requirements:
- Use 2 short paragraphs maximum.
- Maintain a natural academic tone.
- Avoid bullet points.
- Be specific and practical.
- Reference important strengths and weaknesses from the analysis.
- Do not mention JSON, scoring systems, or AI analysis.

If APPROVED:
- Briefly highlight the proposal's strengths.
- Mention minor improvements or considerations moving forward.

If REJECTED:
- Clearly explain the major weaknesses or risks.
- State what must be improved before resubmission.
- Keep the tone encouraging but firm.

Return ONLY the review text.
`;

  return await callGroqWithFallback({
    prompt,
    systemPrompt:
      "You are a professional university professor writing authentic academic proposal feedback. Plain text only.",
    json: false,
    temperature: 0.4,
  });
};

/**
 * AI-powered project health score generator.
 */
const analyzeProjectHealthAI = async (metrics) => {
  const prompt = `Expert supervisor evaluating project health from metrics:
${JSON.stringify(metrics, null, 2)}

Return ONLY JSON:
{
  "score": 0-100,
  "status": "healthy" | "needs-attention" | "at-risk",
  "summary": "...",
  "riskAlerts": [string],
  "predictedCompletionDate": "ISO Date"
}`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Project Health Auditor. Strict JSON.",
    json: true,
  });

  const parsed = JSON.parse(responseText);
  return {
    score: Math.max(0, Math.min(100, parsed.score || 0)),
    status: ["healthy", "needs-attention", "at-risk"].includes(parsed.status)
      ? parsed.status
      : "unknown",
    summary: parsed.summary || "No summary generated.",
    riskAlerts: Array.isArray(parsed.riskAlerts)
      ? parsed.riskAlerts.filter((s) => typeof s === "string").slice(0, 3)
      : [],
    predictedCompletionDate:
      parsed.predictedCompletionDate &&
      parsed.predictedCompletionDate !== "Unknown"
        ? new Date(parsed.predictedCompletionDate)
        : null,
    generatedAt: new Date(),
  };
};

/**
 * AI-powered feedback drafter for teachers.
 */
const generateFeedbackDraftAI = async ({
  title,
  health,
  metrics,
  tone = "professional",
}) => {
  const prompt = `Supervisor feedback draft.
Title: "${title}"
Health: ${health?.status || "Unknown"} (Score: ${health?.score || "N/A"})
Tone: ${tone}

Return ONLY plain text feedback.`;

  return await callGroqWithFallback({
    prompt,
    systemPrompt: "Empathetic Professor Persona. Plain text.",
    json: false,
    temperature: 0.6,
  });
};

/**
 * AI-powered evaluation consultant.
 */
const generateEvaluationJustificationAI = async (data) => {
  const prompt = `Grading justification for project: ${data.title}.
Metrics: ${JSON.stringify(data.metrics)}
Score: ${data.suggestedScore}/100

Return ONLY JSON with justification, rubricBreakdown, and memberSpotlights.`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Grading Consultant. Strict JSON.",
    json: true,
  });

  const parsed = JSON.parse(responseText);
  return {
    justification: parsed.justification || "Justification pending.",
    rubricBreakdown: parsed.rubricBreakdown || {},
    benchmarkingInsights: parsed.benchmarkingInsights || [],
    memberSpotlights: parsed.memberSpotlights || [],
    adjustmentAdvice: parsed.adjustmentAdvice || "No adjustment advice.",
  };
};

/**
 * AI-powered task prioritizer for students.
 */
const prioritizeTasksAI = async ({ myTasks, teamTasks, deadlines }) => {
  const prompt = `Prioritize these tasks: ${JSON.stringify(myTasks)}. Team context: ${JSON.stringify(teamTasks)}.

Return ONLY JSON:
{ "recommendations": [{ "taskId": "...", "title": "...", "priorityScore": 0-100, "reasoning": "..." }], "summary": "..." }`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Agile Coach. Strict JSON.",
    json: true,
  });

  const parsed = JSON.parse(responseText);
  return {
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 5)
      : [],
    summary: parsed.summary || "Focus on clearing blockers.",
  };
};

/**
 * AI-powered team load balancer.
 */
const analyzeTeamBalanceAI = async ({
  teamWorkload,
  deadlines,
  currentDate,
}) => {
  const prompt = `Analyze team workload: ${JSON.stringify(teamWorkload)}. 
Return ONLY JSON with healthScore, diagnostic, bottlenecks, and suggestions.`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Load Balancing Expert. Strict JSON.",
    json: true,
  });

  return JSON.parse(responseText);
};

/**
 * AI-powered system analytics narrator.
 */
const generateAdminAnalyticsNarrativeAI = async ({ stats, riskReport }) => {
  const prompt = `Narrate system analytics. Stats: ${JSON.stringify(stats)}. Risks: ${JSON.stringify(riskReport)}.
  IMPORTANT:
- Generate EXACTLY 3 insights.
- Do not return more or less than 3.

Return ONLY JSON: {
  "velocityScore": <number>,
  "summary": "...",
  "insights": [
     { "title": "...", "description": "...", "severity": "...", "action": "..." }
  ]
}`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Analytics Narrator. Strict JSON.",
    json: true,
  });

  try {
    return JSON.parse(responseText);
  } catch (error) {
    return {
      velocityScore: 50,
      summary: "Analytics unavailable.",
      insights: [],
    };
  }
};

/**
 * AI-powered Semantic Group Matching.
 */
const matchGroupsAI = async ({ groups, supervisors }) => {
  const prompt = `Match groups: ${JSON.stringify(groups)} to supervisors: ${JSON.stringify(supervisors)}.
Return ONLY JSON array of matches with matchScore and reasoning.`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Matching Algorithm Agent. Output JSON array.",
    json: true,
  });

  const parsed = JSON.parse(responseText);
  return Array.isArray(parsed) ? parsed : parsed.matches || [];
};

/**
 * AI-powered project audit generator for supervisors.
 */
const generateProjectAuditAI = async (data) => {
  const prompt = `Perform a high-fidelity project audit. 
Project: ${data.projectTitle} (Group: ${data.groupName})
Stats: ${JSON.stringify(data.stats)}
Recent History: ${JSON.stringify(data.recentMeetings)}
AI Meeting Summaries: ${JSON.stringify(data.recentSummaries)}

Historical Pattern Context (RAG):
${data.historicalContext || "No direct historical matches found."}

Return ONLY JSON:
{
  "healthStatus": "Healthy" | "At-Risk" | "Stalled" | "Critical",
  "velocityScore": 0-100,
  "executiveDigest": "A 2-3 sentence overview of the current state, mentioning any historical parallels.",
  "criticalFlags": [string],
  "supervisorRecommendations": [string]
}`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Senior Project Auditor. Strict JSON.",
    json: true,
  });

  const parsed = JSON.parse(responseText);
  return {
    healthStatus: parsed.healthStatus || "Healthy",
    velocityScore: Math.max(0, Math.min(100, parsed.velocityScore || 0)),
    executiveDigest: parsed.executiveDigest || "Audit complete.",
    criticalFlags: Array.isArray(parsed.criticalFlags)
      ? parsed.criticalFlags
      : [],
    supervisorRecommendations: Array.isArray(parsed.supervisorRecommendations)
      ? parsed.supervisorRecommendations
      : [],
    auditedAt: new Date(),
  };
};

/**
 * AI-powered strategic capacity analysis for administrators.
 */
const generateStrategicCapacityAnalysisAI = async ({
  faculty,
  pendingGroups,
}) => {
  const prompt = `Perform a high-level strategic resource audit.
Faculty Payload: ${JSON.stringify(faculty.map((f) => ({ name: f.name, dept: f.dept, load: f.load, capacity: f.capacity })))}
Pending Groups: ${pendingGroups.length}

Return ONLY JSON:
{
  "strategicScore": 0-100,
  "intakeForecast": "How many more groups can we intake system-wide before saturation?",
  "hotspots": [{ "dept": string, "issue": string, "urgency": "High" | "Medium" | "Low" }],
  "underutilizationSpotlight": [{ "name": string, "reason": string }],
  "tacticalDirectives": [string],
  "structuralAdvice": "A 2-sentence piece of advice on long-term faculty hiring or load restructuring."
}`;

  const responseText = await callGroqWithFallback({
    prompt,
    systemPrompt: "Senior Resource Orchestrator. Strict JSON.",
    json: true,
  });

  return JSON.parse(responseText);
};

const aiService = {
  generateTaskBreakdown,
  summarizeMeeting,
  generateMeetingSummaryAI,
  analyzeProposalAI,
  generateProposalReview,
  analyzeProjectHealthAI,
  generateFeedbackDraftAI,
  generateEvaluationJustificationAI,
  prioritizeTasksAI,
  analyzeTeamBalanceAI,
  generateAdminAnalyticsNarrativeAI,
  matchGroupsAI,
  generateProjectAuditAI,
  generateStrategicCapacityAnalysisAI,
  callGroqWithFallback,
};

export {
  generateTaskBreakdown,
  summarizeMeeting,
  generateMeetingSummaryAI,
  analyzeProposalAI,
  generateProposalReview,
  analyzeProjectHealthAI,
  generateFeedbackDraftAI,
  generateEvaluationJustificationAI,
  prioritizeTasksAI,
  analyzeTeamBalanceAI,
  generateAdminAnalyticsNarrativeAI,
  matchGroupsAI,
  generateProjectAuditAI,
  generateStrategicCapacityAnalysisAI,
  callGroqWithFallback,
};

export default aiService;
