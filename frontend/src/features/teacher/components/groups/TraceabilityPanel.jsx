import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiCheckCircle, FiCircle, FiFile, FiUser, FiZap, FiLayers } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const TraceabilityPanel = ({ features, status }) => {
  const [expandedFeature, setExpandedFeature] = useState(null);

  if (status === "loading") {
    return (
      <div className="glass-card bg-white/60 border-none shadow-sm rounded-3xl p-6">
        <LoadingSkeleton className="h-4 w-1/3 mb-6 rounded" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!features || features.length === 0) {
    return null;
  }

  const toggleFeature = (id) => {
    setExpandedFeature(expandedFeature === id ? null : id);
  };

  const getStatusIcon = (taskStatus) => {
    switch(taskStatus) {
      case "completed": return <FiCheckCircle className="text-emerald-500" />;
      case "in-progress": return <FiCircle className="text-blue-500 fill-blue-50" />;
      case "review": return <FiCircle className="text-amber-500 fill-amber-50" />;
      default: return <FiCircle className="text-slate-200" />;
    }
  };

  return (
    <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-5 mb-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
           <div className="h-9 w-9 rounded-xl bg-slate-50 text-indigo-500 flex items-center justify-center border border-slate-100 shadow-inner"><FiLayers size={16}/></div>
           <div>
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Feature Traceability Mapping</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Cross-referencing feature implementation with task execution</p>
           </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
           {features.length} Operational Nodes
        </span>
      </div>

      <div className="space-y-2.5">
        {features.map((feature) => {
          const isExpanded = expandedFeature === feature._id;
          
          return (
            <div key={feature._id} className={`rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? "border-indigo-100 bg-white shadow-lg shadow-indigo-100" : "border-slate-50 bg-white/40 hover:bg-white hover:border-slate-200"}`}>
              <button 
                onClick={() => toggleFeature(feature._id)}
                className={`w-full text-left flex items-center justify-between p-4 transition-colors ${isExpanded ? "bg-indigo-50/20" : "hover:bg-slate-50/50"}`}
              >
                <div className="flex items-center gap-4">
                   <div className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all ${isExpanded ? "bg-indigo-600 text-white border-indigo-500 shadow-md" : "bg-white text-slate-400 border-slate-100 shadow-sm"}`}>
                      <FiZap size={14} className={isExpanded ? "animate-pulse" : ""} />
                   </div>
                   <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isExpanded ? "text-indigo-600" : "text-slate-800"}`}>{feature.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{feature.relatedTasks?.length || 0} Tasks</span>
                       <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                       <span className={`text-[9px] font-black uppercase tracking-tight ${feature.progress === 100 ? "text-emerald-500" : "text-indigo-400"}`}>{feature.progress || 0}% Stable</span>
                    </div>
                  </div>
                </div>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isExpanded ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                   {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-1 pb-5 space-y-4">
                  {(!feature.relatedTasks || feature.relatedTasks.length === 0) ? (
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 text-center">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">No operational units linked.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pl-4 border-l-2 border-indigo-50/50 ml-4 pt-4">
                      {feature.relatedTasks.map((task) => (
                        <div key={task._id} className="relative group/task">
                          {/* Node Bullet */}
                          <div className="absolute -left-5 top-1.5 h-1.5 w-1.5 rounded-full bg-slate-200 border border-white ring-2 ring-transparent transition-all group-hover/task:bg-indigo-500 group-hover/task:ring-indigo-100"></div>

                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-2">
                               <div className="mt-0.5 scale-90">{getStatusIcon(task.status)}</div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest group-hover/task:text-indigo-600 transition-colors truncate">{task.title}</p>
                                 <div className="mt-2.5 flex flex-wrap gap-2">
                                   {/* Member attribution tree node */}
                                   <div className="flex items-center gap-1.5 h-6 px-2.5 text-[8px] font-black text-slate-500 bg-white border border-slate-100 rounded-lg shadow-sm">
                                     <FiUser className="text-orange-400 opacity-60" />
                                     <span className="uppercase tracking-widest">{task.assignedTo?.name || task.createdBy?.name || "Unassigned"}</span>
                                   </div>

                                   {/* Resources tree node */}
                                   {task.linkedResources && task.linkedResources.length > 0 ? (
                                     <div className="flex flex-wrap gap-2">
                                       {task.linkedResources.map((res) => (
                                         <div key={res._id} className="flex items-center gap-1.5 h-6 px-2.5 text-[8px] font-black text-slate-500 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-violet-200 transition-colors cursor-default">
                                           <FiFile className="text-violet-400 opacity-60 shrink-0" />
                                           <span className="truncate max-w-[120px] uppercase tracking-widest">{res.originalName}</span>
                                         </div>
                                       ))}
                                     </div>
                                   ) : (
                                     <div className="flex items-center gap-1.5 h-6 px-2.5 text-[8px] font-black text-slate-300 bg-slate-50/50 border border-transparent rounded-lg italic">
                                       <FiFile className="shrink-0" size={10} />
                                       <span className="uppercase tracking-widest">No Linked Resources</span>
                                     </div>
                                   )}
                                 </div>
                               </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TraceabilityPanel;
