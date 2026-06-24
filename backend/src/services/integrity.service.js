import Signal from "../models/signal.model.js";
import Task from "../models/task.model.js";
import Group from "../models/group.model.js";

/**
 * Service for autonomous integrity monitoring and signal generation.
 */
class IntegrityService {
  /**
   * Scan for authorship anomalies.
   * Logic: If a user completes more than X legacy tasks within a short window, flag it.
   */
  async scanAuthorshipAnomalies(groupId, windowInMinutes = 60, threshold = 5) {
    const windowStart = new Date(Date.now() - windowInMinutes * 60 * 1000);
    
    // Find tasks completed by any user in this group within the window
    const recentCompletions = await Task.aggregate([
      { 
        $match: { 
          group: groupId, 
          status: "completed", 
          updatedAt: { $gte: windowStart } 
        } 
      },
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 },
          tasks: { $push: "$title" }
        }
      },
      { $match: { count: { $gt: threshold } } }
    ]);

    for (const anomaly of recentCompletions) {
      if (!anomaly._id) continue;

      await Signal.create({
        type: "integrity",
        category: "authorship_anomaly",
        severity: "medium",
        message: `High-velocity task completion detected for user. ${anomaly.count} tasks finalized in under ${windowInMinutes} minutes.`,
        group: groupId,
        metadata: {
          userId: anomaly._id,
          taskCount: anomaly.count,
          tasks: anomaly.tasks
        }
      });
    }

    return recentCompletions.length > 0;
  }

  /**
   * Monitor for SLA breaches in evaluations.
   */
  async checkEvaluationSLAs() {
    // Placeholder for future SLA logic
    // e.g. Find projects in 'completed' status without a published evaluation for > 7 days
    return [];
  }
}

export default new IntegrityService();
