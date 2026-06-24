import Signal from "../models/signal.model.js";
import Milestone from "../models/milestone.model.js";
import Project from "../models/project.model.js";
import Evaluation from "../models/evaluation.model.js";

/**
 * Service for identifying lifecycle bottlenecks and SLA breaches.
 */
class EscalationService {
  /**
   * Monitor for overdue milestones.
   */
  async checkMilestoneSLA() {
    const now = new Date();
    
    // Find pending/submitted milestones that are past their due date
    const overdueMilestones = await Milestone.find({
      status: { $in: ["pending", "submitted"] },
      dueDate: { $lt: now }
    }).populate("project");

    let signalCount = 0;
    for (const m of overdueMilestones) {
      // Check if a signal already exists for this milestone/issue to avoid spam
      const exists = await Signal.findOne({
        project: m.project?._id,
        category: "milestone_miss",
        status: "open",
        metadata: { milestoneId: m._id }
      });

      if (!exists) {
        await Signal.create({
          type: "sla",
          category: "milestone_miss",
          severity: m.status === "submitted" ? "medium" : "high",
          message: `SLA Breach: Milestone "${m.name}" is overdue. Status: ${m.status}.`,
          project: m.project?._id,
          metadata: { milestoneId: m._id, dueDate: m.dueDate }
        });
        signalCount++;
      }
    }
    return signalCount;
  }

  /**
   * Monitor for evaluation publication latency.
   * Logic: If a project is 'completed' but evaluation isn't 'published' for > 72 hours.
   */
  async checkEvaluationLatency(latencyHours = 72) {
    const thresholdDate = new Date(Date.now() - latencyHours * 60 * 60 * 1000);

    const staleProjects = await Project.find({
      status: "completed",
      updatedAt: { $lt: thresholdDate }
    });

    let signalCount = 0;
    for (const p of staleProjects) {
      const evaluation = await Evaluation.findOne({ project: p._id });
      
      if (!evaluation || evaluation.status !== "published") {
        const exists = await Signal.findOne({
          project: p._id,
          category: "evaluation_delay",
          status: "open"
        });

        if (!exists) {
          await Signal.create({
            type: "sla",
            category: "evaluation_delay",
            severity: "critical",
            message: `Performance Alert: Evaluation for completed project "${p.title}" has been pending for over ${latencyHours} hours.`,
            project: p._id
          });
          signalCount++;
        }
      }
    }
    return signalCount;
  }
}

export default new EscalationService();
