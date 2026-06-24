import { useState, useEffect } from "react";
import { FiLoader } from "react-icons/fi";
import teacherApi from "../../api/teacherApi.js";
import getErrorMessage from "../../../../utils/error.js";
import { showError, showSuccess } from "../../../../components/ui/toast.jsx";
import EvaluationStatusBadge from "../../../projects/components/EvaluationStatusBadge.jsx";
import EvaluationLifecycle from "../../../projects/components/EvaluationLifecycle.jsx";

const breakdownLabels = {
  deadlinePerformance: "Deadline Performance",
  featureCompletion: "Feature Completion",
  taskCompletion: "Task Completion",
  meetingEngagement: "Meeting Engagement",
  codeContribution: "Code Contribution",
  proposalQuality: "Proposal Quality",
};

const breakdownColors = {
  deadlinePerformance: "bg-violet-500",
  featureCompletion: "bg-emerald-500",
  taskCompletion: "bg-blue-500",
  meetingEngagement: "bg-amber-500",
  codeContribution: "bg-slate-700",
  proposalQuality: "bg-teal-500",
};

const memberBreakdownLabels = {
  featuresImplemented: "Features Built",
  tasksCompleted: "Tasks Done",
  meetingAttendance: "Meetings",
  githubCommits: "Commits",
};

const FinalEvaluationDrawer = ({
  open,
  onClose,
  projectId,
  onOpenFullPage,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggested, setSuggested] = useState(null);
  const [existing, setExisting] = useState(null);

  // Editable state
  const [groupScore, setGroupScore] = useState("");
  const [groupAdjustment, setGroupAdjustment] = useState(0);
  const [groupNote, setGroupNote] = useState("");
  const [memberEdits, setMemberEdits] = useState([]);

  useEffect(() => {
    if (open && projectId) {
      loadData();
    }
  }, [open, projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suggestedRes, existingRes] = await Promise.all([
        teacherApi.fetchSuggestedGrades(projectId),
        teacherApi.fetchEvaluation(projectId),
      ]);
      setSuggested(suggestedRes);

      if (existingRes.evaluation) {
        setExisting(existingRes.evaluation);
        const eg = existingRes.evaluation.groupGrade;
        setGroupScore(eg.score ?? "");
        setGroupAdjustment(eg.teacherAdjustment || 0);
        setGroupNote(eg.teacherNote || "");
        setMemberEdits(
          existingRes.evaluation.memberGrades.map((m) => ({
            student: m.student?._id || m.student,
            studentName: m.student?.name || "Unknown",
            studentEmail: m.student?.email || "",
            score: m.score,
            breakdown: m.breakdown,
            teacherAdjustment: m.teacherAdjustment || 0,
            teacherNote: m.teacherNote || "",
          })),
        );
      } else {
        setGroupScore(suggestedRes.groupGrade.score);
        setGroupAdjustment(0);
        setGroupNote("");
        setMemberEdits(
          suggestedRes.memberGrades.map((m) => ({
            student: m.student,
            studentName: m.studentName,
            studentEmail: m.studentEmail,
            score: m.score,
            breakdown: m.breakdown,
            teacherAdjustment: 0,
            teacherNote: "",
          })),
        );
      }
    } catch (err) {
      showError(getErrorMessage(err, "Failed to load evaluation data."));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publishStatus) => {
    setSaving(true);
    try {
      const payload = {
        groupGrade: {
          score: Number(groupScore) + Number(groupAdjustment),
          maxScore: 100,
          breakdown: suggested?.groupGrade?.breakdown || {},
          teacherAdjustment: Number(groupAdjustment),
          teacherNote: groupNote,
        },
        memberGrades: memberEdits.map((m) => ({
          student: m.student,
          score: Math.min(
            100,
            Math.max(0, Number(m.score) + Number(m.teacherAdjustment)),
          ),
          maxScore: 100,
          breakdown: m.breakdown,
          teacherAdjustment: Number(m.teacherAdjustment),
          teacherNote: m.teacherNote,
        })),
        status: publishStatus,
      };
      await teacherApi.saveEvaluation(projectId, payload);
      showSuccess(
        publishStatus === "published"
          ? "Evaluation published!"
          : "Draft saved.",
      );
      if (publishStatus === "published") onClose();
      else loadData();
    } catch (err) {
      showError(getErrorMessage(err, "Failed to save evaluation."));
    } finally {
      setSaving(false);
    }
  };

  const isPublished = existing?.status === "published";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 -top-6 flex justify-end bg-slate-900/40 p-4">
      <div className="glass-card flex h-full w-full max-w-lg flex-col overflow-hidden p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Final Evaluation
              </h2>
              {existing && <EvaluationStatusBadge status={existing.status} />}
            </div>
            <p className="text-xs text-slate-500">
              {isPublished
                ? "Published -- Read Only"
                : "Review system suggestions and finalize grades."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/60 card-surface px-3 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>

        {/* Link to Full Page */}
        {onOpenFullPage && (
          <button
            onClick={onOpenFullPage}
            className="mt-3 w-full rounded-xl bg-slate-50/80 border border-slate-200/60 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors text-center"
          >
            Open Full Evaluation Page →
          </button>
        )}

        {/* Content */}
        <div className="scrollbar-hide mt-5 flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <FiLoader className="animate-spin text-slate-400" size={24} />
            </div>
          ) : (
            <>
              {/* Group Grade Card */}
              <div className="rounded-2xl card-surface p-4">
                {suggested && (
                  <div className="mt-3 flex items-end gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500">
                        System Suggested
                      </p>
                      <p className="text-3xl font-bold text-slate-800">
                        {suggested.groupGrade.score}
                      </p>
                      <p className="text-[10px] text-slate-400">/ 100</p>
                    </div>

                    {!isPublished && (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600">
                            Final Score
                          </label>
                          <input
                            type="number"
                            value={groupScore}
                            onChange={(e) => setGroupScore(e.target.value)}
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600">
                            Adjustment (±)
                          </label>
                          <input
                            type="number"
                            value={groupAdjustment}
                            onChange={(e) => setGroupAdjustment(e.target.value)}
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 text-xs text-slate-800 outline-none"
                            min={-20}
                            max={20}
                          />
                        </div>
                      </div>
                    )}

                    {isPublished && (
                      <div className="flex-1 text-center">
                        <p className="text-[10px] text-slate-500">
                          Final Published Score
                        </p>
                        <p className="text-3xl font-bold text-emerald-700">
                          {existing.groupGrade.score}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Breakdown Bars */}
                {suggested && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                      Breakdown
                    </p>
                    {Object.entries(suggested.groupGrade.breakdown).map(
                      ([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-600">
                              {breakdownLabels[key] || key}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {value}%
                            </span>
                          </div>
                          <div className="mt-0.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${breakdownColors[key] || "bg-slate-500"} transition-all`}
                              style={{ width: `${Math.min(value, 100)}%` }}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Teacher Note */}
                {!isPublished && (
                  <div className="mt-3">
                    <label className="text-[10px] font-semibold text-slate-600">
                      Note / Justification
                    </label>
                    <textarea
                      value={groupNote}
                      onChange={(e) => setGroupNote(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 text-xs text-slate-800 outline-none resize-none min-h-[60px]"
                      placeholder="Justification for adjustment..."
                      maxLength={500}
                    />
                  </div>
                )}
                {isPublished && existing.groupGrade.teacherNote && (
                  <p className="mt-2 text-[10px] italic text-slate-500">
                    Note: {existing.groupGrade.teacherNote}
                  </p>
                )}
              </div>

              {/* Member Cards */}
              <div className="rounded-2xl card-surface p-4">
                <p className="text-xs font-semibold text-slate-700">
                  Individual Members
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Contribution-based scoring per member.
                </p>

                <div className="mt-3 space-y-3">
                  {memberEdits.map((member, idx) => (
                    <div
                      key={member.student}
                      className="rounded-xl bg-white/70 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {member.studentName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {member.studentEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">
                            {Math.min(
                              100,
                              Math.max(
                                0,
                                Number(member.score) +
                                  Number(member.teacherAdjustment),
                              ),
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">/ 100</p>
                        </div>
                      </div>

                      {/* Contribution Stats */}
                      <div className="mt-2 grid grid-cols-4 gap-1">
                        {Object.entries(member.breakdown).map(([key, val]) => (
                          <div
                            key={key}
                            className="rounded-lg bg-slate-50 p-1.5 text-center"
                          >
                            <p className="text-[9px] text-slate-500">
                              {memberBreakdownLabels[key] || key}
                            </p>
                            <p className="text-xs font-bold text-slate-700">
                              {val}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Adjustment */}
                      {!isPublished && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-semibold text-slate-600">
                              Adjustment (±)
                            </label>
                            <input
                              type="number"
                              value={member.teacherAdjustment}
                              onChange={(e) => {
                                const updated = [...memberEdits];
                                updated[idx] = {
                                  ...updated[idx],
                                  teacherAdjustment: e.target.value,
                                };
                                setMemberEdits(updated);
                              }}
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-800 outline-none"
                              min={-20}
                              max={20}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-semibold text-slate-600">
                              Note
                            </label>
                            <input
                              type="text"
                              value={member.teacherNote}
                              onChange={(e) => {
                                const updated = [...memberEdits];
                                updated[idx] = {
                                  ...updated[idx],
                                  teacherNote: e.target.value,
                                };
                                setMemberEdits(updated);
                              }}
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-800 outline-none"
                              placeholder="Optional note..."
                              maxLength={500}
                            />
                          </div>
                        </div>
                      )}
                      {isPublished && member.teacherNote && (
                        <p className="mt-1 text-[10px] italic text-slate-500">
                          {member.teacherNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lifecycle History */}
              {existing && existing.activities && (
                <div className="rounded-2xl card-surface p-4">
                  <p className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    Evaluation Lifecycle
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[8px] font-bold uppercase">
                      History
                    </span>
                  </p>
                  <EvaluationLifecycle activities={existing.activities} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && !isPublished && (
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex gap-2">
            <button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white/50 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="flex-1 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Publishing..." : "Publish Evaluation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalEvaluationDrawer;
