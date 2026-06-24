import { FiMessageSquare, FiPaperclip } from "react-icons/fi";

const feedbackSourceMeta = (source) => {
  const key = String(source || "").toLowerCase();
  if (key === "review_decision") {
    return {
      label: "Decision Node",
      className: "bg-amber-50 border-amber-100 text-amber-600",
    };
  }
  return {
    label: "Teacher Directive",
    className: "bg-indigo-50 border-indigo-100 text-indigo-600",
  };
};

const feedbackTypeClass = (type) => {
  const key = String(type || "").toLowerCase();
  if (key === "issue" || key === "negative") {
    return "bg-rose-50 border-rose-100 text-rose-600";
  }
  if (key === "praise" || key === "positive") {
    return "bg-emerald-50 border-emerald-100 text-emerald-600";
  }
  return "bg-slate-50 border-slate-200 text-slate-500";
};

const FeedbackHistoryPanel = ({ feedback, feedbackStatus, formatDate }) => {
  return (
    <div className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-6">
         <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
            <FiMessageSquare className="w-4 h-4 text-slate-400" />
         </div>
         <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">Feedback Registry</h2>
      </div>

      <div className="space-y-4">
        {feedbackStatus === "loading" && (
          <div className="py-12 text-center">
             <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SYNCHRONIZING_FEEDBACK_DATA...</p>
          </div>
        )}

        {feedback.map((item) => (
          <div
            key={item._id}
            className="rounded-xl border border-slate-100 bg-white p-5 hover:border-indigo-200 transition-all hover:shadow-sm group/item"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate mb-1">
                  {item.title || item.type || "DIRECTIVE_LOG"}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                   {item.createdBy?.name || "COMMAND_OFFICER"} | {formatDate(item.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span
                  className={`rounded-lg border px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                    feedbackSourceMeta(item.source).className
                  }`}
                >
                  {feedbackSourceMeta(item.source).label}
                </span>
                <span
                  className={`rounded-lg border px-2 py-1 text-[8px] font-black uppercase tracking-widest ${feedbackTypeClass(
                    item.type,
                  )}`}
                >
                  {item.type || "MANIFEST"}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 mb-4">
               <p className="text-[12px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight opacity-90 italic">
                  {item.message || "NO_MESSAGE_PAYLOAD_DETECTED"}
               </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100/50">
               {(item.relatedFeatures || []).length > 0 && (
                 <div className="flex flex-wrap gap-1.5">
                   {(item.relatedFeatures || []).map((feature) => (
                     <span
                       key={feature._id || feature}
                       className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest"
                     >
                       {feature.name || "SUBNODE"}
                     </span>
                   ))}
                 </div>
               )}

               {(item.attachments || []).length > 0 && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <FiPaperclip size={10} className="text-indigo-400" />
                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                       {item.attachments.length} ASSETS_LINKED
                    </span>
                 </div>
               )}
            </div>
          </div>
        ))}

        {feedbackStatus !== "loading" && feedback.length === 0 && (
          <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="text-slate-300" />
             </div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">NO_FEEDBACK_RECORDS_INITIALIZED</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackHistoryPanel;
