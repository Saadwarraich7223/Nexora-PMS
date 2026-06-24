import { useMemo, useState } from "react";
import { FiUserCheck, FiClock, FiAlertCircle, FiXCircle, FiCheckCircle, FiBookOpen, FiZap, FiSend } from "react-icons/fi";

const statusStyles = {
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rejected: "bg-rose-50 text-rose-600 border-rose-100",
  cancelled: "bg-slate-50 text-slate-600 border-slate-100",
};

const SupervisorRequestPanel = ({
  group,
  isLeader,
  supervisors,
  request,
  actionLoading,
  onSubmitRequest,
  onCancelRequest,
}) => {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [note, setNote] = useState("");

  const canRequest =
    group?.status === "active" &&
    !group?.supervisor &&
    (!request || request.status !== "pending");

  const selectedSupervisor = useMemo(
    () => supervisors.find((s) => String(s._id) === String(selectedSupervisorId)),
    [supervisors, selectedSupervisorId],
  );

  if (!group || !isLeader) {
    return null;
  }

  const requestStatusClass =
    statusStyles[request?.status] || "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-xs rounded-xl h-full transition-all group/panel">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiUserCheck className="text-indigo-600" size={12} />
          <h2>Guidance Allocation</h2>
        </div>
        {request?.status && (
          <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${requestStatusClass}`}>
            {request.status}
          </span>
        )}
      </div>

      <div className="p-5">
        {group.supervisor ? (
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
             <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                <FiCheckCircle size={16} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Active Advisor Assigned</p>
                <p className="text-[9px] font-bold text-emerald-600 mt-1">{group.supervisor?.name || "Academic Supervisor"}</p>
             </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {!request && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 border-dashed">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center italic py-2">
                  No active advisory request
                </p>
              </div>
            )}

            {request && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 relative group/request">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Transmission Sent</p>
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">{request.supervisorId?.name || "Advisor"}</p>
                    <p className="text-[9px] font-bold text-slate-400 truncate mt-1">{request.supervisorId?.email || ""}</p>
                  </div>
                  <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FiClock size={14} className="animate-pulse" />
                  </div>
                </div>
                {request.note && (
                  <div className="p-2 rounded-lg bg-white border border-amber-100 mb-3">
                    <p className="text-[9px] font-bold text-slate-600 italic leading-relaxed">"{request.note}"</p>
                  </div>
                )}
                {request.status === "pending" && (
                  <button
                    onClick={() => onCancelRequest(request._id)}
                    disabled={actionLoading}
                    className="w-full h-8 rounded-lg bg-white border border-rose-200 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <FiXCircle size={12} /> Abort Request
                  </button>
                )}
              </div>
            )}

            {canRequest && (
              <div className="space-y-3 mt-2">
                 <div className="relative group/select">
                    <FiUserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:text-indigo-500 transition-colors z-10" size={14} />
                    <select
                      value={selectedSupervisorId}
                      onChange={(e) => setSelectedSupervisorId(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-200 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Query Available Advisors</option>
                      {supervisors.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.availability ?? 0} OP_SLOTS)
                        </option>
                      ))}
                    </select>
                 </div>

                {selectedSupervisor && (
                  <div className="px-3 py-2 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                     <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Load Status</span>
                     <span className="text-[9px] font-black text-indigo-800">{selectedSupervisor.assignedCount ?? 0}/{selectedSupervisor.capacity ?? 0} UNITS</span>
                  </div>
                )}

                <div className="relative group/field">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="OPTIONAL MISSION BRIEF FOR ADMIN REVIEW"
                    className="w-full p-4 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-200 transition-all resize-none placeholder:text-slate-300"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!selectedSupervisorId) return;
                    onSubmitRequest({ supervisorId: selectedSupervisorId, note });
                    setNote("");
                  }}
                  disabled={actionLoading || !selectedSupervisorId}
                  className="w-full h-11 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiSend size={12} /> Dispatch Request
                </button>
              </div>
            )}
          </div>
        )}
        {/* Guidance Protocol & Strategic Insights */}
        <div className="mt-6 pt-5 border-t border-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <FiBookOpen className="text-indigo-500" size={14} />
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guidance Protocol</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="p-3 rounded-lg bg-indigo-50/30 border border-indigo-100/50 group/tip">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center text-indigo-500 shadow-xs border border-indigo-50 group-hover/tip:bg-indigo-600 group-hover/tip:text-white transition-all">
                  <FiZap size={12} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Alignment over Proximity</p>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5 leading-relaxed">Prioritize advisors whose technical domain matches your project core rather than department convenience.</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 group/tip">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center text-slate-400 shadow-xs border border-slate-100 group-hover/tip:bg-slate-900 group-hover/tip:text-white transition-all">
                  <FiClock size={12} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Bi-Weekly Sync Protocol</p>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5 leading-relaxed">High-performance teams maintain a 14-day feedback loop with their advisors for optimal proposal vetting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorRequestPanel;
