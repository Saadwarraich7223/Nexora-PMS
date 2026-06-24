import { FiUsers, FiShield, FiBriefcase, FiLayers, FiUser, FiClock, FiCheckCircle, FiArrowRight } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";
import { useNavigate } from "react-router-dom";

const groupStatusClass = (status) => {
  if (["active", "approved"].includes(String(status).toLowerCase())) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (["pending", "submitted"].includes(String(status).toLowerCase())) return "bg-amber-50 text-amber-600 border-amber-100";
  if (["rejected", "failed"].includes(String(status).toLowerCase())) return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
};

const GroupSnapshotPanel = ({ group, isLeader, supervisorRequest, loading }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl h-full hover:shadow-md transition-all group">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiUsers className="text-indigo-600" />
          <h2>Active Team Registry</h2>
        </div>
        <div className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${groupStatusClass(group?.status)}`}>
          {group?.status || "NO REGISTRY"}
        </div>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <LoadingSkeleton className="h-full rounded-xl" />
        ) : !group ? (
          <div className="h-full flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
             <FiShield size={24} className="text-slate-300 mb-2" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Group Association</p>
          </div>
        ) : (
          <div className="space-y-3">
             <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Team Identity: <span className="text-indigo-600">{group.name}</span></h3>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{group.members?.length || 0}/4 Slots</span>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {group.members?.map((memberItem) => {
                    const m = memberItem.user;
                    if (!m) return null;
                    const isMemberLeader = String(group.leader?._id || group.leader) === String(m._id || m);
                    
                    return (
                     <div key={m._id || m} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 group/member hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs group-hover/member:bg-indigo-600 group-hover/member:text-white transition-colors">
                           {m.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover/member:text-indigo-600 transition-colors">{m.name || "Unknown Member"}</p>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <FiShield size={10} className={isMemberLeader ? "text-amber-500" : "text-slate-300"} />
                              <span className={`text-[8px] font-black uppercase tracking-widest ${isMemberLeader ? "text-amber-600" : "text-slate-400"}`}>
                                 {isMemberLeader ? "LEADER" : "MEMBER"}
                              </span>
                           </div>
                        </div>
                     </div>
                    );
                 })}
             </div>

             {/* Academic Guidance Section */}
             <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2 px-1">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Guidance</h3>
                </div>

                {group.supervisor ? (
                   <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3 group/sup transition-all shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs group-hover/sup:bg-emerald-600 group-hover/sup:text-white transition-colors">
                         <FiUser size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover/sup:text-emerald-600 transition-colors">
                            {group.supervisor.name}
                         </p>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <FiCheckCircle size={10} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Assigned Advisor</span>
                         </div>
                      </div>
                   </div>
                ) : supervisorRequest ? (
                   <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center gap-3 transition-all shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-black text-xs">
                         <FiClock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                            {supervisorRequest.supervisorId?.name || "Allocation Pending"}
                         </p>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest animate-pulse">Request Under Review</span>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 group/request transition-all shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                            <FiUser size={16} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-tight truncate">Advisor Not Assigned</p>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Awaiting Initiation</span>
                         </div>
                      </div>
                      {isLeader && (
                         <button 
                            onClick={() => navigate("/student/groups")}
                            className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-slate-900 transition-colors shadow-sm group-hover/request:scale-110"
                         >
                            <FiArrowRight size={14} />
                         </button>
                      )}
                   </div>
                )}
             </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
         <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <FiBriefcase size={12} />
            <span className="truncate">Project: {group?.project?.title || "UNASSIGNED"}</span>
         </div>
      </div>
    </div>
  );
};

export default GroupSnapshotPanel;
