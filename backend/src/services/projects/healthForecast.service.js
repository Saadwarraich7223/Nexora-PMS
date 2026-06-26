import Task from '../../models/task.model.js';
import Meeting from '../../models/meetingLog.model.js';
import Group from '../../models/group.model.js';

/**
 * HealthForecastService
 * Orchestrates weighted scoring for project health forecasting.
 */
class HealthForecastService {
  /**
   * Calculate group health metrics.
   * @param {string} groupId 
   */
  async calculateGroupHealth(groupId) {
    const group = await Group.findById(groupId).populate('members.user');
    if (!group) throw new Error('Group not found');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Velocity Score (Completed vs Total)
    const taskVelocity = await this._calculateVelocity(groupId);

    // 2. Engagement Score (Meetings & Attendance)
    const engagement = await this._calculateEngagement(groupId, sevenDaysAgo);

    // 3. Telemetry Score (GitHub Activity)
    const telemetry = await this._calculateTelemetry(group);

    // Weighted Synthesis
    // Velocity: 40%, Engagement: 30%, Telemetry: 30%
    const rawScore = 
      (taskVelocity.score * 0.4) + 
      (engagement.score * 0.3) + 
      (telemetry.score * 0.3);

    const healthScore = Math.min(100, Math.round(rawScore));

    return {
      groupId,
      healthScore,
      breakdown: {
        velocity: taskVelocity,
        engagement,
        telemetry
      },
      stamp: new Date(),
      status: this._getHealthStatus(healthScore)
    };
  }

  async _calculateVelocity(groupId) {
    const tasks = await Task.find({ group: groupId });
    if (tasks.length === 0) return { score: 100, label: 'N/A' };

    const completed = tasks.filter(t => t.status === 'completed').length;
    const velocity = (completed / tasks.length) * 100;

    // Penalty for overdue tasks
    const now = new Date();
    const overdueCount = tasks.filter(t => 
      t.status !== 'completed' && 
      t.deadline && 
      new Date(t.deadline) < now
    ).length;

    const penalty = overdueCount * 5;
    const score = Math.max(0, velocity - penalty);

    return {
      score,
      totalTasks: tasks.length,
      completedTasks: completed,
      overdueTasks: overdueCount
    };
  }

  async _calculateEngagement(groupId, since) {
    const meetings = await Meeting.find({
      group: groupId,
      date: { $gte: since }
    });

    if (meetings.length === 0) return { score: 50, label: 'Low Activity' };

    let totalAttendanceRatio = 0;
    meetings.forEach(m => {
      const attendance = m.attendance?.length || 0;
      totalAttendanceRatio += attendance > 0 ? 1 : 0.5;
    });

    const meetingVelocity = meetings.length / 2; // Target 2 meetings/week
    const score = Math.min(100, (meetingVelocity * 50) * (totalAttendanceRatio / meetings.length));

    return {
      score,
      meetingCount: meetings.length,
      trend: meetings.length >= 2 ? 'Stable' : 'Declining'
    };
  }

  async _calculateTelemetry(group) {
    const hasGithub = !!group.githubRepo;
    if (!hasGithub) return { score: 50, label: 'No Repository Linked' };

    const score = group.lastGithubSync ? 90 : 60;
    
    return {
      score,
      repositoryLinked: true,
      lastSync: group.lastGithubSync
    };
  }

  _getHealthStatus(score) {
    if (score >= 80) return 'Stellar';
    if (score >= 60) return 'Stable';
    if (score >= 40) return 'At Risk';
    return 'Critical';
  }
}

export default new HealthForecastService();
