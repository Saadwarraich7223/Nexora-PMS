import { FiLink, FiCpu, FiUserPlus, FiArrowRight, FiCheck } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const getCapacityMeta = (sup) => {
  const assigned = sup.assigned ?? sup.assignedCount ?? 0;
  const capacity = sup.capacity ?? 0;
  const percent = capacity ? Math.round((assigned / capacity) * 100) : 0;
  return { assigned, capacity, percent };
};

const AssignSupervisorPanel = ({
  groupsStatus,
  supervisorsStatus,
  unassignedGroups,
  supervisorsList,
  supervisorsLabel,
  assignGroupId,
  setAssignGroupId,
  assignSupervisorId,
  setAssignSupervisorId,
  onAssign,
  assignStatus,
  assignError,
  onRecommend,
  recommendStatus,
  recommendError,
  canRecommend,
  selectedSupervisorWorkload,
}) => (
  <div className="glass-card flex flex-col overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/30">
      <div className="flex items-center gap-2">
         <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-sm">
            <FiLink size={16} />
         </div>
         <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Assignment Engine</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Strategic resource allocation</p>
         </div>
      </div>

      <button
        onClick={onRecommend}
        disabled={!canRecommend || recommendStatus === "loading"}
        className="h-8 px-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
      >
        <FiCpu size={12} className={recommendStatus === 'loading' ? 'animate-spin' : ''} />
        {recommendStatus === "loading" ? "Processing..." : "AI Recommend"}
      </button>
    </div>

    <div className="p-4 space-y-4">
      {/* Target: Unassigned Groups */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Cohorts</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {groupsStatus === "loading" ? (
            Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={`unassigned-${index}`} className="h-12 w-full rounded-xl" />
            ))
          ) : unassignedGroups.length > 0 ? (
            unassignedGroups.slice(0, 6).map((group) => (
              <button
                key={group._id || group.name}
                onClick={() => setAssignGroupId(group._id || "")}
                className={`flex flex-col p-3 text-left rounded-xl border transition-all ${
                  assignGroupId === group._id
                    ? "bg-slate-900 border-slate-900 shadow-md shadow-slate-200 ring-2 ring-slate-900 ring-offset-2"
                    : "bg-slate-50 border-slate-100 hover:border-slate-300"
                }`}
              >
                <p className={`text-[11px] font-bold truncate ${assignGroupId === group._id ? 'text-white' : 'text-slate-800'}`}>
                  {group.name}
                </p>
                <p className={`text-[9px] font-medium uppercase tracking-tighter mt-0.5 ${assignGroupId === group._id ? 'text-white/70' : 'text-slate-400'}`}>
                  {group.department} | SEM {group.semester}
                </p>
              </button>
            ))
          ) : (
            <div className="col-span-full py-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Unassigned Cohorts</p>
            </div>
          )}
        </div>
      </div>

      {/* Actor: Available Supervisors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between ml-1">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {supervisorsLabel || "Strategic Supervisors"}
           </p>
           {recommendError && <p className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter">{recommendError}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {supervisorsStatus === "loading" ? (
            Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={`sup-${index}`} className="h-16 w-full rounded-xl" />
            ))
          ) : supervisorsList.length > 0 ? (
            supervisorsList.slice(0, 8).map((sup) => {
              const { assigned, capacity, percent } = getCapacityMeta(sup);
              const isSelected = assignSupervisorId === (sup._id || sup.supervisorId);
              return (
                <button
                  key={sup._id || sup.supervisorId}
                  onClick={() => setAssignSupervisorId(sup._id || sup.supervisorId)}
                  className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100 ring-2 ring-indigo-600 ring-offset-2"
                      : "bg-white border-slate-100 hover:border-indigo-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-[10px] font-black truncate max-w-[80px] ${isSelected ? 'text-white' : 'text-slate-800'}`}>{sup.name}</p>
                    <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-white/80' : 'text-indigo-500'}`}>{assigned}/{capacity}</span>
                  </div>
                  <div className={`h-1 w-full rounded-full overflow-hidden ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full py-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Resource Capacity</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
         <div className="flex items-center gap-4">
            {selectedSupervisorWorkload && (
               <div className="flex items-baseline gap-1">
                  <span className="text-[18px] font-black text-slate-800">{selectedSupervisorWorkload.availability ?? 0}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Slots Remaining</span>
               </div>
            )}
            {assignError && <p className="text-[9px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 px-2 py-1 rounded-md">{assignError}</p>}
         </div>

         <button
           onClick={onAssign}
           disabled={assignStatus === "loading" || !assignGroupId || !assignSupervisorId}
           className="h-10 px-6 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
         >
           {assignStatus === "loading" ? (
             <>
               <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               Syncing...
             </>
           ) : (
             <>
               <FiUserPlus size={14} /> Establish Connection
             </>
           )}
         </button>
      </div>
    </div>
  </div>
);

export default AssignSupervisorPanel;

