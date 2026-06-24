import { FiAlertCircle } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const GroupRequestsPanel = ({ groupRequests, groupsStatus, onAssign }) => (
  <div className="glass-card flex flex-col mb-6">
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/30">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-indigo-500 border border-indigo-400 flex items-center justify-center text-white shadow-sm shadow-indigo-100 anim-pulse-slow">
          <FiAlertCircle size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            Supervisor Requests
          </h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            Operational Intelligence | Real-time Alerts
          </p>
        </div>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
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
      ) : groupRequests.length > 0 ? (
        groupRequests.map((req) => (
          <div
            key={req.id}
            className="glass-card p-4 border-l-4 border-amber-400 bg-white/50 hover:shadow-md transition-all group"
          >
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">
                  Action Required
                </p>
                <h4 className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors uppercase tracking-tight">
                  {req.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">
                  {req.department} | Semester {req.semester}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Requested By
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-black shadow-sm">
                      {req.requestedBy?.charAt(0) || "S"}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">
                      {req.requestedBy}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Targeted Spv.
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-black shadow-sm">
                      {req.requestedSupervisor?.charAt(0) || "F"}
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 truncate max-w-[100px]">
                      {req.requestedSupervisor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100/50">
                <button
                  onClick={() => onAssign(req.raw || req)}
                  className="w-full h-9 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                  Review & Assign
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="md:col-span-3 py-10 glass-card bg-slate-50/50 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            No Active Alerts
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-bold">
            All supervisor requests have been processed.
          </p>
        </div>
      )}
    </div>
  </div>
);

export default GroupRequestsPanel;
