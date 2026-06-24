import { FiAlertCircle, FiCheck, FiX, FiArrowRight } from "react-icons/fi";

const statusClassMap = {
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rejected: "bg-rose-50 text-rose-600 border-rose-100",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const ApprovalQueuePanel = ({ groups, groupsStatus, onApprove, onReject }) => {
  return (
    <div className="glass-card flex w-full flex-col mb-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-500 border border-indigo-400 flex items-center justify-center text-white shadow-sm shadow-indigo-100 anim-pulse-slow">
            <FiAlertCircle size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Approval Queue
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              Groups Awaiting Strategic Validation
            </p>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
              Needs Attention
            </span>
          </div>
        )}
      </div>

      <div className="p-4 w-full grid gap-4 md:grid-cols-3">
        {groupsStatus === "loading" ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`req-${index}`}
              className="rounded-2xl bg-slate-50/50 border border-slate-100 p-4 animate-pulse"
            >
              <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-40 bg-slate-100 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
            </div>
          ))
        ) : groups.length === 0 ? (
          <div className="md:col-span-3 py-10 glass-card bg-slate-50/50 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              No Active Alerts
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-bold">
              All groups requests have been processed.
            </p>
          </div>
        ) : (
          <div className="grid w-screen grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groups.map((group) => {
              const isPending = group.status === "pending";

              return (
                <div
                  key={group._id}
                  className={`relative w-full group rounded-2xl border bg-white p-4 transition-all hover:shadow-lg ${
                    isPending
                      ? "border-amber-200 ring-1 ring-amber-100 shadow-sm"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-black text-slate-800 tracking-tight">
                        {group.name || "Group"}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {group.department || "-"} | SEM {group.semester || "-"}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100">
                      Pending Approval
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <FiArrowRight size={10} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 truncate">
                        Members:{" "}
                        <span className="text-slate-400">
                          {group.members?.length || 0} / {group.maxMembers || 4}
                        </span>
                      </p>
                    </div>
                    {group.description && (
                      <p className="text-[9px] text-slate-400 line-clamp-1 italic px-1 uppercase tracking-tighter">
                        "{group.description}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                    <button
                      onClick={() => onApprove(group)}
                      className="flex-1 h-8 rounded-lg bg-slate-900 text-[9px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      <FiCheck size={10} /> Approve
                    </button>
                    <button
                      onClick={() => onReject(group)}
                      className="flex-1 h-8 rounded-lg bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <FiX size={10} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueuePanel;
