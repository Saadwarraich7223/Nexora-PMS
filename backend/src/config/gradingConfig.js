/**
 * ─── Grading Configuration ────────────────────────────────────────────────────
 *
 * Centralized weights for final evaluation calculation.
 * Hardcoded for now — structured for future per-department/teacher config.
 *
 * All weights must sum to 1.0 (100%).
 */

const GRADING_CONFIG = {
  // ─── Group-Level Weights ─────────────────────────────────────────────────
  groupWeights: {
    deadlinePerformance: 0.30,  // 30% — avg of deadline grades
    featureCompletion:   0.25,  // 25% — features completed / total
    taskCompletion:      0.15,  // 15% — tasks completed / total
    meetingEngagement:   0.10,  // 10% — meetings held vs expected
    codeContribution:    0.10,  // 10% — GitHub commit regularity
    proposalQuality:     0.10,  // 10% — Project.analysis.score
  },

  // ─── Individual Member Weights ───────────────────────────────────────────
  memberWeights: {
    featuresImplemented: 0.35,  // 35% — features built by member
    tasksCompleted:      0.25,  // 25% — tasks done by member
    meetingAttendance:   0.20,  // 20% — meetings attended
    githubCommits:       0.20,  // 20% — commits pushed
  },

  // ─── Completion Criteria ─────────────────────────────────────────────────
  completionCriteria: {
    minTaskCompletionPercent: 80,       // ≥80% tasks must be completed
    allFeaturesCompleted:    true,      // every feature must be completed
    allDeadlinesResolved:    true,      // no pending deadlines past due
    minFilesUploaded:        1,         // at least 1 file uploaded
  },

  // ─── Expectations ────────────────────────────────────────────────────────
  expectations: {
    meetingsPerMonth: 2,               // expected supervisor meetings / month
    maxTeacherAdjustment: 20,          // ±20 points max manual adjustment
  },

  // ─── Deadline Grade Penalty ──────────────────────────────────────────────
  deadlinePenalty: {
    percentPerOverdueDay: 5,           // -5% per overdue day
  },
};

export default GRADING_CONFIG;
