import {
  FiUsers,
  FiSettings,
  FiTrash2,
  FiUserMinus,
  FiLogOut,
  FiCheckCircle,
  FiCheckSquare,
  FiLayout,
  FiFileText,
  FiShield,
  FiGrid,
} from "react-icons/fi";
import { useEffect, useState, useMemo } from "react";
import studentApi from "../../api/studentApi.js";

const groupStatusClass = (status) => {
  if (["active", "approved"].includes(String(status).toLowerCase())) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (["pending", "submitted"].includes(String(status).toLowerCase())) return "bg-amber-50 text-amber-600 border-amber-100";
  if (["rejected", "failed"].includes(String(status).toLowerCase())) return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
};

const MyGroupPanel = ({
  group,
  isLeader,
  actionLoading,
  onSubmitApproval,
  onLeave,
  onDelete,
  onTransferLeadership,
  onRemoveMember,
  isMe,
}) => {
  const minMembersForApproval = 2;
  const [metricsData, setMetricsData] = useState({
    tasks: [],
    features: [],
    resources: [],
  });
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!group?._id || group.status !== "active") return;

    let active = true;
    const fetchMetrics = async () => {
      setMetricsLoading(true);

      const safeFetch = async (promiseFn, fallbackKey) => {
        try {
          const res = await promiseFn();
          return res[fallbackKey] || [];
        } catch (e) {
          return [];
        }
      };

      const [tasksList, featuresList, resourcesList] = await Promise.all([
        safeFetch(() => studentApi.fetchTasks(), "tasks"),
        safeFetch(() => studentApi.fetchFeatures(), "features"),
        safeFetch(() => studentApi.fetchResources(), "files"),
      ]);

      if (active) {
        setMetricsData({
          tasks: tasksList,
          features: featuresList,
          resources: resourcesList,
        });
        setMetricsLoading(false);
      }
    };
    fetchMetrics();

    return () => {
      active = false;
    };
  }, [group]);

  const memberMetrics = useMemo(() => {
    const stats = {};
    if (!group?.members) return stats;

    group.members.forEach((m) => {
      let uid = m.user?._id || m._id || m;
      stats[uid] = { tasks: 0, features: 0, resources: 0 };
    });

    metricsData.tasks.forEach((t) => {
      const id = t.assignedTo?._id || t.assignedTo;
      if (id && stats[id]) stats[id].tasks += 1;
    });

    metricsData.features.forEach((f) => {
      const id = f.proposedBy?._id || f.proposedBy;
      if (id && stats[id]) stats[id].features += 1;
    });

    metricsData.resources.forEach((r) => {
      const id = r.uploadedBy?._id || r.uploadedBy;
      if (id && stats[id]) stats[id].resources += 1;
    });

    return stats;
  }, [metricsData, group]);

  if (!group) return null;

  const memberCount = (group.members || []).length;
  const requiresMoreMembers = memberCount < minMembersForApproval;
  const canManageApproval = isLeader && group.status !== "active";

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-xs rounded-xl h-full transition-all group/panel">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">
              <FiGrid className="text-indigo-600" size={12} />
              <h2>Strategic Core Registry</h2>
           </div>
           <h3 className="text-base font-black text-slate-800 tracking-tight uppercase leading-none">{group.name}</h3>
        </div>
        <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${groupStatusClass(group?.status)}`}>
              {group?.status || "ALLOCATED"}
            </span>
            {isLeader && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-all border ${showSettings ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-400 hover:text-slate-800 hover:border-slate-200"}`}
              >
                <FiSettings size={14} className={showSettings ? "animate-spin-slow" : ""} />
              </button>
            )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">
         <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs transition-all hover:border-indigo-100 group/tile">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Squad Capacity</p>
               <div className="flex items-end gap-2">
                  <p className="text-lg font-black text-slate-800 tracking-tighter">{(group.members || []).length}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase mb-0.5">/ {group.maxMembers || 4} Slots</p>
               </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs transition-all hover:border-indigo-100 group/tile">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Personnel Rank</p>
               <div className="flex items-center gap-2 mt-1">
                  <FiShield size={12} className={isLeader ? "text-amber-500" : "text-sky-500"} />
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isLeader ? "text-amber-600" : "text-sky-600"}`}>
                     {isLeader ? "Command Leader" : "Field Operative"}
                  </p>
               </div>
            </div>
         </div>

         <div className="flex-1">
            <div className="flex items-center justify-between mb-3 px-1">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synergy Matrix</h3>
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">{memberCount} Personnel Active</span>
            </div>
            <div className="space-y-2">
               {group.members?.map((m) => {
                 const mobj = m.user || m;
                 const uId = String(mobj._id || mobj);
                 const uName = mobj.name || "Unknown Member";
                 const uEmail = mobj.email || "";
                 const isMemLeader = uId === String(group.leader?._id || group.leader);
                 const stats = memberMetrics[uId] || { tasks: 0, features: 0, resources: 0 };

                 return (
                   <div key={uId} className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 group/member ${showSettings && isLeader && !isMemLeader ? "bg-rose-50/50 border-rose-100" : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-indigo-100 shadow-sm hover:shadow-md"}`}>
                     <div className="flex items-center gap-3 min-w-0">
                       <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-sm group-hover/member:scale-105 transition-transform">
                         {uName.charAt(0).toUpperCase()}
                       </div>
                       <div className="min-w-0">
                         <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover/member:text-indigo-600 transition-colors leading-none">{uName}</p>
                            {isMemLeader && <FiShield className="text-amber-500" size={10} />}
                            {isMe(uId) && <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-100 text-indigo-600 uppercase tracking-widest">Self</span>}
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 truncate tracking-tight">{uEmail}</p>
                       </div>
                     </div>

                     <div className="flex items-center gap-3">
                        {group.status === "active" && !showSettings && (
                          <div className="hidden sm:flex items-center gap-4">
                             <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-800 tracking-tighter leading-none">{stats.tasks}</span>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Tasks</span>
                             </div>
                             <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-800 tracking-tighter leading-none">{stats.features}</span>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Features</span>
                             </div>
                             <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-800 tracking-tighter leading-none">{stats.resources}</span>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Assets</span>
                             </div>
                          </div>
                        )}

                        {showSettings && isLeader && !isMemLeader && (
                          <button
                            onClick={() => onRemoveMember(uId)}
                            className="bg-rose-500 text-white p-2 rounded-lg shadow-sm hover:bg-rose-600 transition-colors active:scale-95"
                            title="Decommission Personnel"
                          >
                            <FiUserMinus size={14} />
                          </button>
                        )}
                     </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </div>

      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-2">
              {group.supervisor && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                   <FiCheckCircle className="text-emerald-500" size={14} />
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                      Supervisor: <span className="text-slate-900">{group.supervisor.name}</span>
                   </p>
                </div>
              )}
           </div>

           <div className="flex items-center gap-2">
              {canManageApproval && (
                <button
                  onClick={onSubmitApproval}
                  disabled={actionLoading || requiresMoreMembers}
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Approval
                </button>
              )}

              {!isLeader && (
                <button
                  onClick={onLeave}
                  disabled={actionLoading}
                  className="bg-rose-50 text-rose-600 border border-rose-100 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Retire Squad
                </button>
              )}

              {showSettings && isLeader && (
                <button
                  onClick={onDelete}
                  disabled={actionLoading || group.status === "active"}
                  className="bg-rose-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Decommission
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MyGroupPanel;

