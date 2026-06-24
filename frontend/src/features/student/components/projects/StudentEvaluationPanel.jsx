import { useEffect, useState } from "react";
import { FiAward, FiLoader, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import studentApi from "../../api/studentApi.js";
import EvaluationStatusBadge from "../../../projects/components/EvaluationStatusBadge.jsx";
import getErrorMessage from "../../../../utils/error.js";
import { showError } from "../../../../components/ui/toast.jsx";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const StudentEvaluationPanel = ({ projectId, currentUserId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await studentApi.fetchEvaluation(projectId);
        if (active) setEvaluation(res.evaluation);
      } catch (err) {
        if (active)
          showError(getErrorMessage(err, "Failed to load evaluation."));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="rounded-2xl border-l-4 border-l-slate-100 border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <LoadingSkeleton className="h-4 w-32 rounded" />
            <LoadingSkeleton className="h-3 w-48 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return;
  }

  const myGrade = evaluation.memberGrades?.find(
    (m) => String(m.student?._id || m.student) === String(currentUserId),
  );

  return (
    <div className="rounded-2xl border-l-4 border-l-amber-500 border border-amber-200/60 bg-amber-50/50 p-6 shadow-sm backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg transform rotate-2">
          <FiAward className="text-white" size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-tight text-amber-900 font-mono">
              Performance Pulse
            </h3>
            <EvaluationStatusBadge status={evaluation.status} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80 mt-0.5">
            Tactical Objective Evaluation Summary
          </p>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            Your final project evaluation is available. Your score is{" "}
            <span className="font-black tracking-wider text-amber-700 ml-1">
              {myGrade?.score || "N/A"}
            </span>
            .
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/student/projects/evaluation")}
        className="shrink-0 flex items-center gap-2 rounded-lg border border-slate-950 bg-slate-900 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md hover:bg-slate-800 transition-all active:scale-[0.98]"
      >
        Access Final Report
        <FiChevronRight size={14} />
      </button>
    </div>
  );
};

export default StudentEvaluationPanel;
