import React from "react";
import { FiUsers, FiActivity, FiAlertCircle, FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const ClassOverviewDashboard = ({ projects }) => {
  const stats = {
    total: projects.length,
    needsReview: projects.filter(p => ["submitted", "under_review"].includes(p.status)).length,
    atRisk: projects.filter(p => p.healthReport?.status === "at-risk").length,
    completed: projects.filter(p => p.status === "completed").length,
    avgHealth: Math.round(projects.reduce((acc, p) => acc + (p.healthReport?.score || 0), 0) / (projects.length || 1))
  };

  const atRiskProjects = projects.filter(p => p.healthReport?.status === "at-risk").slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="glass-card bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-8 text-white relative overflow-hidden group">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-11 w-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
              <HiSparkles size={24} className="text-indigo-300" />
            </div>
            <div>
              <h2 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none mb-1.5">Intelligence Hub</h2>
              <h1 className="text-xl font-black text-white tracking-tight">Class Strategic Overview</h1>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aggregate Cohorts</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{stats.total}</p>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Health Index</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{stats.avgHealth}</p>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">/ 100</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Critical Nodes</p>
              <p className="text-3xl font-black text-rose-500 tabular-nums tracking-tighter">{stats.atRisk}</p>
            </div>
            <div className="space-y-2">
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Finalized Units</p>
              <p className="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Action Required Card */}
        <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm" />
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Awaiting Protocol</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100/50 rounded-full text-[8px] font-black uppercase tracking-widest">
              {stats.needsReview} Pending Reviews
            </span>
          </div>

          <p className="text-[11px] font-bold text-slate-500 px-1 mb-5 leading-relaxed uppercase tracking-tight opacity-70">
            Detected {stats.needsReview} project proposals awaiting strategic assessment. Prompt resolution ensures cohort momentum.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group hover:border-indigo-200 transition-all cursor-pointer">
             <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-9 w-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                      <FiActivity className="text-indigo-500" size={14} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Protocol Registry</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 leading-none">Last ingestion: 2 hours ago</p>
                   </div>
                </div>
                <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                   <FiArrowRight size={14} />
                </div>
             </div>
          </div>
        </div>

        {/* At Risk Groups */}
        <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-6 px-1">
            <div className="h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Critical Alert Summary</h3>
          </div>

          {atRiskProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-1">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-3 border border-emerald-100">
                 <FiCheckCircle size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All managed nodes operational.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskProjects.map(p => (
                <div key={p._id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-rose-200 transition-all cursor-pointer shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-rose-600 border border-slate-200 shadow-sm uppercase">
                      {p.title?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">{p.title}</p>
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5 opacity-80">Health Matrix: {p.healthReport?.score}%</p>
                    </div>
                  </div>
                  <FiArrowRight className="text-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassOverviewDashboard;
