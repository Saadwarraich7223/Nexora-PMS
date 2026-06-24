import { useState } from "react";
import { FiZap, FiRefreshCw } from "react-icons/fi";

const ProjectReviewSection = ({
  visible,
  feedbackText,
  setFeedbackText,
  actionStatus,
  onApprove,
  onReject,
  projectId,
  onGenerateReview,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState(null); // 'approve' or 'reject'

  if (!visible) return null;

  const handleGenerate = async (decision) => {
    if (!onGenerateReview || !projectId || isGenerating) return;
    setIsGenerating(true);
    setGeneratingType(decision);
    try {
      await onGenerateReview(projectId, decision);
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
    }
  };

  return (
    <div className="glass-card bg-white border border-indigo-100 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
         <FiZap size={60} className="text-indigo-500" />
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
           <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">Decision Terminal</h3>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lifecycle State Validation</p>
        </div>
        
        {onGenerateReview && (
          <div className="flex gap-2">
            {[
              { type: "approve", label: "Intel Draft Approval", color: "emerald" },
              { type: "reject", label: "Intel Draft Rejection", color: "rose" }
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleGenerate(btn.type)}
                disabled={isGenerating || actionStatus === "loading"}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                  btn.color === "emerald" 
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" 
                    : "border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                }`}
              >
                {isGenerating && generatingType === btn.type ? (
                  <FiRefreshCw className="animate-spin" size={10} />
                ) : (
                  <FiZap size={10} className="opacity-60" />
                )}
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <textarea
          rows={6}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="ENTER_PROTOCOL_FEEDBACK_DATA..."
          className="w-full min-h-[160px] rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-[12px] font-bold uppercase tracking-tight text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none shadow-inner"
          disabled={actionStatus === "loading" || isGenerating}
        />
        
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={onApprove}
            disabled={actionStatus === "loading" || isGenerating}
            className="flex-1 sm:flex-none rounded-xl bg-slate-950 hover:bg-emerald-600 transition-all px-8 py-3.5 text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-xl hover:shadow-emerald-200 disabled:opacity-60 active:scale-[0.98]"
          >
            {actionStatus === "loading" ? "SYNCHRONIZING..." : "EXECUTE_APPROVAL"}
          </button>
          <button
            onClick={onReject}
            disabled={actionStatus === "loading" || isGenerating}
            className="flex-1 sm:flex-none rounded-xl bg-white border border-slate-200 hover:border-rose-500 hover:text-rose-600 transition-all px-8 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm disabled:opacity-60 active:scale-[0.98]"
          >
            {actionStatus === "loading" ? "TERMINATING..." : "EXECUTE_REJECTION"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectReviewSection;
