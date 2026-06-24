import MeetingLog from "../models/meetingLog.model.js";

/**
 * Finds available meeting slots for a group/teacher within a time range.
 * @param {string} groupId - The group ID to check
 * @param {string} teacherId - The teacher ID to check
 * @param {number} durationMins - Desired meeting duration
 * @param {Date} startDate - Start of the search range
 * @param {Date} endDate - End of the search range
 * @param {number} dayStartHour - e.g., 8 (8 AM)
 * @param {number} dayEndHour - e.g., 14 (2 PM)
 */
export const findFreeSlots = async ({
  groupId,
  teacherId,
  durationMins = 45,
  startDate,
  endDate,
  date = null, // Specific date to search
  dayStartHour = 8,
  dayEndHour = 14
}) => {
  let actualStart = startDate;
  let actualEnd = endDate;

  if (date) {
    actualStart = new Date(date);
    actualStart.setHours(0, 0, 0, 0);
    actualEnd = new Date(date);
    actualEnd.setHours(23, 59, 59, 999);
  }

  // 1. Get all meetings for this group OR teacher in the range
  const existingMeetings = await MeetingLog.find({
    $or: [{ group: groupId }, { createdBy: teacherId }],
    date: { $gte: actualStart, $lte: actualEnd }
  }).sort({ date: 1 }).lean();

  const slots = [];
  const durationMs = durationMins * 60 * 1000;

  // 2. Iterate through each day in the range
  let currentDay = new Date(actualStart);
  currentDay.setHours(0, 0, 0, 0);

  const endDay = new Date(actualEnd);
  endDay.setHours(0, 0, 0, 0);

  while (currentDay <= endDay) {
    // Define the working window for this day
    const windowStart = new Date(currentDay);
    windowStart.setHours(dayStartHour, 0, 0, 0);

    const windowEnd = new Date(currentDay);
    windowEnd.setHours(dayEndHour, 0, 0, 0);

    // Filter meetings for THIS specific window
    const dayMeetings = existingMeetings.filter(m => {
      const d = new Date(m.date);
      return d >= windowStart && d <= windowEnd;
    });

    // Simple slot finding logic
    let potentialStart = new Date(windowStart);
    
    // Ensure we don't suggest past times if today
    if (potentialStart < new Date()) {
        potentialStart = new Date();
        potentialStart.setMinutes(Math.ceil(potentialStart.getMinutes() / 15) * 15, 0, 0); // Round to next 15m
    }

    while (new Date(potentialStart.getTime() + durationMs) <= windowEnd) {
      const potentialEnd = new Date(potentialStart.getTime() + durationMs);
      
      // Check for overlap with any meeting
      const hasOverlap = dayMeetings.some(m => {
        const mStart = new Date(m.date);
        const mEnd = new Date(mStart.getTime() + 60 * 60 * 1000); // Assume 1 hour if not specified? 
        // Actually, let's just check if start of potential slot is inside a meeting
        return (potentialStart < mEnd && potentialEnd > mStart);
      });

      if (!hasOverlap) {
        slots.push(new Date(potentialStart));
        if (slots.length >= 5) break; // Return top 5 slots
      }

      // Increment by 30 mins to check next slot
      potentialStart = new Date(potentialStart.getTime() + 30 * 60 * 1000);
    }

    if (slots.length >= 5) break;
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return slots;
};
