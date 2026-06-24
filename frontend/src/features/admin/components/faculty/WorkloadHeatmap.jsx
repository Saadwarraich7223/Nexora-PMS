import React, { useMemo, useState, useEffect } from "react";
import { 
  FiTarget, 
  FiZap, 
  FiActivity, 
  FiAlertTriangle, 
  FiUserCheck, 
  FiArrowRight,
  FiTrendingUp,
  FiLayers,
  FiServer
} from "react-icons/fi";
import { HiLightningBolt } from "react-icons/hi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";
import adminApi from "../../api/adminApi";

const WorkloadHeatmap = ({ faculty = [], status }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);

  const { departments, globalStats } = useMemo(() => {
    const map = {};
    let totalAssigned = 0;
    let totalCapacity = 0;

    faculty.forEach((t) => {
      if (!t.department) return;
      if (!map[t.department]) map[t.department] = { assigned: 0, capacity: 0 };
      const assigned = Array.isArray(t.assignedGroups) ? t.assignedGroups.length : 0;
      const capacity = t.supervisorCapacity ?? 0;
      map[t.department].assigned += assigned;
      map[t.department].capacity += capacity;
      totalAssigned += assigned;
      totalCapacity += capacity;
    });

    const deptInsights = Object.entries(map).map(([name, data]) => ({
      name,
      load: data.capacity > 0 ? (data.assigned / data.capacity) * 100 : 0,
      ...data
    })).sort((a, b) => b.load - a.load);

    const systemLoad = totalCapacity > 0 ? (totalAssigned / totalCapacity) * 100 : 0;

    return { 
      departments: deptInsights.slice(0, 3), // Top 3 departments
      globalStats: { systemLoad, totalAssigned, totalCapacity }
    };
  }, [faculty]);

  const runAudit = async () => {
    setIsAnalyzing(true);
    try {
      const response = await adminApi.fetchStrategicCapacityAnalysis();
      if (response.success) {
        setAnalysis(response.data);
        setLastAnalyzed(new Date());
      }
    } catch (error) {
      console.error("Capacity Audit Failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (faculty.length > 0 && !analysis && !isAnalyzing) {
      runAudit();
    }
  }, [faculty.length]);

  if (status === "loading") {
    return <LoadingSkeleton className="h-80 w-full rounded-2xl" />;
  }

  if (!faculty.length) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-500">
      <div className="glass-card border border-white/40 shadow-sm bg-white/30 backdrop-blur-2xl overflow-hidden rounded-2xl">
        
        {/* Header - Technical & Precise */}
        <div className="px-5 py-3 border-b border-slate-100/50 flex items-center justify-between bg-white/10">
          <div className="flex items-center gap-3">
             <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
                <FiLayers size={14} />
             </div>
             <div>
                <h3 className="text-[10px] font-black text-slate-900 tracking-tight uppercase">Capacity Intelligence</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${isAnalyzing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Resource Distribution Matrix</p>
                </div>
             </div>
          </div>

          <button 
            onClick={runAudit}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${
              isAnalyzing 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-100'
            }`}
          >
            {isAnalyzing ? (
              <FiActivity size={10} className="animate-spin" />
            ) : (
              <HiLightningBolt size={10} className="text-amber-300" />
            )}
            {isAnalyzing ? 'Analyzing' : 'Sync Matrix'}
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Metrics Core (Denser) */}
            <div className="lg:col-span-5 space-y-4">
               <div className="bg-slate-900/[0.03] border border-slate-100 rounded-2xl p-5 flex items-center justify-between gap-6">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                      <circle 
                        cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={220}
                        strokeDashoffset={220 - (220 * globalStats.systemLoad) / 100}
                        className={`transition-all duration-1000 ${
                          globalStats.systemLoad > 85 ? 'text-rose-500' : 'text-indigo-600'
                        }`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-black text-slate-900 tracking-tighter">{Math.round(globalStats.systemLoad)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                     <div>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">System Health</p>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Global Load Index</h4>
                     </div>
                     <div className="flex gap-4 border-t border-slate-100 pt-3">
                        <div>
                           <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Assigned</p>
                           <p className="text-[11px] font-black text-slate-800">{globalStats.totalAssigned}</p>
                        </div>
                        <div>
                           <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                           <p className="text-[11px] font-black text-indigo-600">{globalStats.totalCapacity - globalStats.totalAssigned}</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Departmental Micro-List to fill space */}
               <div className="bg-white/40 border border-white/60 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Departmental Pulse</span>
                     <FiServer size={8} className="text-slate-300" />
                  </div>
                  <div className="space-y-2.5">
                     {departments.map((d, i) => (
                       <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="h-1 w-1 rounded-full bg-slate-300" />
                             <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${d.load}%` }} />
                             </div>
                             <span className="text-[8px] font-black text-slate-900 tabular-nums">{Math.round(d.load)}%</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Column: AI Operational Layer */}
            <div className="lg:col-span-7 flex flex-col gap-4">
               {analysis ? (
                 <div className="space-y-4 flex flex-col h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {/* Hotspots */}
                       {analysis.hotspots?.slice(0, 1).map((h, i) => (
                         <div key={i} className="p-3 bg-rose-50/40 border border-rose-100/40 rounded-xl flex items-start gap-3">
                            <FiAlertTriangle className="text-rose-500 shrink-0" size={12} />
                            <div>
                               <span className="text-[7px] font-black text-rose-600 uppercase tracking-widest">{h.dept} Anomalies</span>
                               <p className="text-[10px] font-bold text-slate-700 leading-tight mt-1 truncate w-32">{h.issue}</p>
                            </div>
                         </div>
                       ))}
                       {/* Talent */}
                       {analysis.underutilizationSpotlight?.slice(0, 1).map((s, i) => (
                          <div key={i} className="p-3 bg-emerald-50/40 border border-emerald-100/40 rounded-xl flex items-start gap-3">
                            <FiUserCheck className="text-emerald-500 shrink-0" size={12} />
                            <div>
                               <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">{s.name}</span>
                               <p className="text-[10px] font-bold text-slate-700 leading-tight mt-1">Available capacity detected</p>
                            </div>
                          </div>
                       ))}
                    </div>

                    {/* AI Command Strip */}
                    <div className="flex-1 p-5 bg-slate-900 rounded-2xl text-white relative overflow-hidden flex flex-col justify-center">
                       <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                          <FiZap size={64} />
                       </div>
                       <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                             <div className="h-5 w-5 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg">
                                <FiTarget size={12} />
                             </div>
                             <span className="text-[7px] font-black uppercase tracking-[0.2em] text-indigo-300">Command Directive</span>
                          </div>
                          <p className="text-[12px] font-bold leading-relaxed text-slate-100 italic">
                            "{analysis.structuralAdvice}"
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                             <div className="flex items-center gap-2">
                                <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">Audit Score</span>
                                <span className="text-[10px] font-black text-indigo-400">{analysis.strategicScore}/100</span>
                             </div>
                             <span className="text-[7px] font-black text-slate-500 flex items-center gap-1 uppercase tracking-widest">Actionable Intel <FiArrowRight size={8} /></span>
                          </div>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <FiActivity size={24} className="text-slate-200 mb-3" />
                    <h4 className="text-[10px] font-black text-slate-900 uppercase mb-1">Matrix Standby</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Run the systemic audit to generate insights</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[6px] font-black text-slate-400 uppercase tracking-[0.3em]">
           <div className="flex items-center gap-6">
              <span>{faculty.length} Node Profiles Captured</span>
              <span>{lastAnalyzed ? `Last Auth: ${lastAnalyzed.toLocaleTimeString()}` : 'Sync Pending'}</span>
           </div>
           <div className="flex items-center gap-1.5 group cursor-pointer hover:text-indigo-600 transition-colors">
              <FiTrendingUp size={10} className="text-indigo-400" />
              <span>Real-time Operations</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadHeatmap;
