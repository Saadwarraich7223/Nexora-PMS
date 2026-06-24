import { useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiLoader, FiActivity } from "react-icons/fi";
import teacherApi from "../../api/teacherApi.js";
import getErrorMessage from "../../../../utils/error.js";
import { showError, showSuccess } from "../../../../components/ui/toast.jsx";

const criteriaLabels = {
  allFeaturesCompleted: "All Features Completed",
  taskCompletionMet: "Tasks >= 80% Complete",
  allDeadlinesResolved: "All Deadlines Resolved",
  filesUploaded: "Files Uploaded",
  meetingsHeld: "Required Meetings Held",
};

const policyCheckLabelMap = {
  projectStatusAllowed: "Project status must be approved or in progress",
  completionCriteriaSatisfied: "Base completion criteria must pass",
  evaluationPublished: "Published final evaluation is required",
  policyResolved: "Completion policy must be resolved",
};

const metricCards = [
  { key: "features", label: "Features", total: "featuresTotal", done: "featuresCompleted", color: "emerald" },
  { key: "tasks", label: "Tasks", total: "tasksTotal", done: "tasksCompleted", color: "blue" },
  { key: "deadlines", label: "On-Time Deadlines", total: "deadlinesTotal", done: "deadlinesOnTime", color: "violet" },
  { key: "meetings", label: "Meetings Held", total: null, done: "meetingsHeld", color: "amber" },
  { key: "files", label: "Files Uploaded", total: null, done: "filesUploaded", color: "teal" },
];

const ProjectCompletionPanel = ({ projectId, projectStatus, onCompleted }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [completing, setCompleting] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const result = await teacherApi.fetchCompletionMetrics(projectId);
      setData(result);
    } catch (err) {
      showError(getErrorMessage(err, "Failed to load metrics."));
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await teacherApi.markProjectCompleted(projectId);
      showSuccess("Project marked as completed!");
      if (onCompleted) onCompleted();
    } catch (err) {
      const failedChecks = err?.response?.data?.meta?.failedChecks || [];
      if (failedChecks.length > 0) {
        const blockerText = failedChecks
          .map((item) => policyCheckLabelMap[item.key] || item.message || item.key)
          .slice(0, 2)
          .join(" | ");
        showError(`Completion blocked: ${blockerText}`);
      } else {
        showError(getErrorMessage(err, "Failed to complete project."));
      }
    } finally {
      setCompleting(false);
    }
  };

  if (projectStatus === "completed") {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center border border-emerald-200">
            <FiCheckCircle className="text-emerald-600" size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Project Phase: Finalized</p>
            <p className="mt-1 text-[9px] font-bold text-emerald-600/70 uppercase tracking-tight">
              Lifecycle completed. Matrix ready for final evaluation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200/50 p-5 space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Readiness Protocol</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Lifecycle Validation Engine</p>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {loading ? "VALIDATING..." : data ? "RE-CHECK" : "INITIALIZE CHECK"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <FiLoader className="animate-spin text-slate-300" size={24} />
        </div>
      )}

      {data && !loading && (
        <>
          {data.policy && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                  Completion Policy
                </p>
                <div className="text-right">
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">
                    Readiness Score
                  </p>
                  <p className="text-sm font-black text-indigo-800">
                    {Number(data.policy.readinessScore || 0)}%
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-tight">
                <div className="rounded-lg bg-white/80 border border-indigo-100 px-2.5 py-2 text-indigo-700">
                  Policy Version: {data.policy?.policy?.version || "default"}
                </div>
                <div className="rounded-lg bg-white/80 border border-indigo-100 px-2.5 py-2 text-indigo-700">
                  Published Eval: {data.policy.hasPublishedEvaluation ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metricCards.map((mc) => {
              const total = mc.total ? data.metrics[mc.total] : null;
              const done = data.metrics[mc.done] || 0;
              const pct = total ? Math.round((done / total) * 100) : null;

              return (
                <div key={mc.key} className="group rounded-xl bg-slate-50 border border-slate-100 p-4 text-center hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{mc.label}</p>
                  <p className="text-xl font-black tabular-nums tracking-tighter text-slate-800">
                    {total !== null ? `${done}/${total}` : done}
                  </p>
                  {pct !== null && (
                    <div className="mt-3 h-1 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FiActivity className="text-slate-400" size={12} />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Security & Integrity Check</p>
            </div>
            <div className="grid gap-2">
              {Object.entries(data.checks).map(([key, passed]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                    passed ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm shadow-emerald-500/5" : "bg-white border-slate-200 text-slate-300"
                  }`}>
                    {passed && <FiCheckCircle size={10} />}
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-tight ${passed ? "text-slate-700" : "text-slate-400 opacity-60"}`}>
                    {criteriaLabels[key] || key}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {data.isReadyForCompletion ? (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-[10px] font-black text-white uppercase tracking-[0.3em] shadow-xl shadow-slate-900/10 hover:bg-slate-900 hover:shadow-indigo-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {completing ? "EXECUTING PROTOCOL..." : "FINALIZE PROJECT LIFECYCLE"}
            </button>
          ) : (
            <div className="rounded-xl bg-rose-50 p-4 border border-rose-100 space-y-3">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-rose-500 mt-0.5 shrink-0" size={14} />
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-rose-800 uppercase tracking-widest leading-none">Validation Fault</p>
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-tight opacity-70">
                    All mandatory criteria must be satisfied before phase completion.
                  </p>
                </div>
              </div>

              {Array.isArray(data?.policy?.failedChecks) && data.policy.failedChecks.length > 0 && (
                <div className="rounded-lg border border-rose-100 bg-white/70 p-3 space-y-2">
                  <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">
                    Blocking Conditions
                  </p>
                  <div className="space-y-1.5">
                    {data.policy.failedChecks.map((item) => (
                      <div key={item.key} className="text-[10px] font-black uppercase tracking-tight text-rose-700">
                        - {policyCheckLabelMap[item.key] || item.message || item.key}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectCompletionPanel;
