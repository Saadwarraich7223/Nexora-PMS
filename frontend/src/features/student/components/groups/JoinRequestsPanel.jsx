import { FiUserPlus, FiCheck, FiX } from "react-icons/fi";

const JoinRequestsPanel = ({
  requests,
  isLeader,
  actionLoading,
  onRespondRequest,
}) => {
  if (!isLeader) return null;

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-xs rounded-xl h-full transition-all group/panel">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiUserPlus className="text-amber-600" size={12} />
          <h2>Inbound Requests</h2>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req._id}
              className="p-4 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-amber-100 transition-all group/item"
            >
              <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight group-hover/item:text-amber-600 transition-colors truncate leading-none">
                {req.sender.name || "Access Request"}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {req.sender?.email || "Academic Identity Unknown"}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onRespondRequest(req._id, true)}
                  disabled={actionLoading}
                  className="flex-1 h-8 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                >
                  <FiCheck size={12} /> Approve
                </button>
                <button
                  onClick={() => onRespondRequest(req._id, false)}
                  disabled={actionLoading}
                  className="flex-1 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <FiX size={12} /> Deny
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center flex flex-col items-center">
            <FiUserPlus size={24} className="text-slate-200 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              Clear Queue
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinRequestsPanel;
