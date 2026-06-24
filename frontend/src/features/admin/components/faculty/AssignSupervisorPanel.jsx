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
  supervisorsRanked,
  assignGroupId,
  setAssignGroupId,
  assignSupervisorId,
  setAssignSupervisorId,
  onAssign,
  assignStatus,
  assignError,
  assignDepartment,
  setAssignDepartment,
  departments,
}) => (
  <div className="glass-card p-6 flex flex-col h-full bg-indigo-50/10">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-base font-black text-slate-800 tracking-tight">Assignment Engine</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource Optimization Matrix</p>
      </div>
      <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <select
          value={assignDepartment}
          onChange={(e) => setAssignDepartment(e.target.value)}
          className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
        >
          {departments?.map((department) => (
            <option key={department} value={department}>
              {department === 'all' ? 'All Departments' : department}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid gap-6 flex-1">
      {/* Unassigned Groups Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unassigned Projects</h4>
           <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-black">{unassignedGroups?.length || 0}</span>
        </div>
        <div className="space-y-2 max-h-[180px] overflow-auto custom-scrollbar pr-1">
          {groupsStatus === "loading" ? (
            Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={`unassigned-${index}`} className="h-10 w-full rounded-xl" />
            ))
          ) : unassignedGroups.length > 0 ? (
            unassignedGroups.slice(0, 5).map((group) => (
              <button
                key={group._id || group.name}
                onClick={() => {
                  setAssignGroupId(group._id || "");
                  setAssignDepartment(group.department || "all");
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-all rounded-xl border ${
                  assignGroupId === (group._id || group.id)
                    ? "bg-white border-indigo-200 shadow-md ring-2 ring-indigo-500/10"
                    : "bg-white/50 border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <p className={`text-[11px] font-bold ${assignGroupId === (group._id || group.id) ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {group.name}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
                    {group.department} | SEM {group.semester}
                  </p>
                </div>
                {assignGroupId === (group._id || group.id) && <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />}
              </button>
            ))
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Clear Backlog</p>
            </div>
          )}
        </div>
      </div>

      {/* Supervisors Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Supervisors</h4>
           <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-black">{supervisorsRanked?.length || 0}</span>
        </div>
        <div className="space-y-2 max-h-[180px] overflow-auto custom-scrollbar pr-1">
          {supervisorsStatus === "loading" ? (
            Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={`sup-${index}`} className="h-12 w-full rounded-xl" />
            ))
          ) : supervisorsRanked.length > 0 ? (
            supervisorsRanked.slice(0, 5).map((sup) => {
              const { assigned, capacity, percent } = getCapacityMeta(sup);
              const sid = sup._id || sup.supervisorId;
              const isSelected = assignSupervisorId === sid;
              return (
                <button
                  key={sid}
                  onClick={() => setAssignSupervisorId(sid)}
                  className={`flex w-full flex-col gap-2 p-3 text-left transition-all rounded-xl border ${
                    isSelected
                      ? "bg-white border-indigo-200 shadow-md ring-2 ring-indigo-500/10"
                      : "bg-white/50 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex w-full items-center justify-between mb-1">
                    <div>
                      <p className={`text-[11px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {sup.name}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium tracking-tight uppercase">
                        {sup.department} | {sup.availability} Slots Left
                      </p>
                    </div>
                    <span className="text-[9px] font-black text-slate-400">
                      {assigned}/{capacity}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: percent > 80 ? 'var(--bar-supervisor)' : 'var(--bar-group)',
                      }}
                    />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
               <p className="text-[10px] font-bold text-slate-400 uppercase">No Resources</p>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
        <button
          onClick={onAssign}
          className="w-full h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
          disabled={assignStatus === "loading" || !assignGroupId || !assignSupervisorId}
        >
          {assignStatus === "loading" ? "Optimizing Allocation..." : "Establish Official Assignment"}
        </button>
        {assignError && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight text-center">{assignError}</p>}
    </div>
  </div>
);

export default AssignSupervisorPanel;

