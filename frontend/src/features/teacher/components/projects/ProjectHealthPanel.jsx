import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { FiActivity, FiAlertTriangle, FiCalendar, FiRefreshCw, FiZap, FiTarget, FiTrendingUp, FiCheckCircle } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi"; // Highlighting AI with sparkles

const ProjectHealthPanel = ({ project, onReanalyze }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  if (!project) return null;

  const health = project.healthReport;

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onReanalyze(project._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate health report");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "healthy": return { 
        text: "Healthy", 
        classes: "text-emerald-600 bg-emerald-50 border-emerald-100",
        shadow: "shadow-emerald-500/10"
      };
      case "needs-attention": return { 
        text: "Needs Attention", 
        classes: "text-amber-600 bg-amber-50 border-amber-100",
        shadow: "shadow-amber-500/10"
      };
      case "at-risk": return { 
        text: "At Risk", 
        classes: "text-rose-600 bg-rose-50 border-rose-100",
        shadow: "shadow-rose-500/10"
      };
      default: return { 
        text: "Unknown", 
        classes: "text-slate-500 bg-slate-50 border-slate-100",
        shadow: ""
      };
    }
  };

  const hasHealthData = health && health.generatedAt;
  const status = getStatusConfig(health?.status);

  return (
    <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* --- Header Bar --- */}
      <div className="px-5 py-3 border-b border-slate-100 bg-white/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <FiActivity className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Intelligence Pulse</h3>
        </div>
        
        <div className="flex items-center gap-4">
          {hasHealthData && (
            <div className="flex items-center gap-3">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic opacity-60">
                {format(new Date(health.generatedAt), "MMM d, h:mm a")}
              </p>
              <button
                onClick={handleReanalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-wait"
              >
                {isAnalyzing ? (
                  <FiRefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <HiSparkles className="w-3 h-3 text-indigo-400" />
                )}
                {isAnalyzing ? "Processing Matrix..." : "Refresh Intelligence"}
              </button>
            </div>
          )}
        </div>
      </div>

      {!hasHealthData ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-50/20">
          <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <HiSparkles className="w-8 h-8 text-indigo-200 group-hover:text-indigo-400 transition-all group-hover:scale-110 relative z-10" />
          </div>
          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2">Matrix Desynchronized</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight max-w-xs mb-8 leading-relaxed opacity-70">
            Initialize AI protocols to synthesize task velocity, meeting cadence, and repository activity into a predictive health report.
          </p>
          <button
            onClick={handleReanalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-8 py-3 bg-slate-950 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
               <HiSparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? "Synthesizing Node..." : "Initialize Analysis Protocol"}
          </button>
        </div>
      ) : (
        <div className="p-6 flex flex-col lg:flex-row gap-8">
          {/* Status Column */}
          <div className="flex flex-col gap-6 lg:w-[35%] lg:border-r lg:border-slate-100 lg:pr-8">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Node Vitality</span>
              <span className={`px-2 py-0.5 text-[8px] font-black rounded-full border uppercase tracking-widest ${status.classes}`}>
                {status.text}
              </span>
            </div>

            <div className="flex items-center gap-6 py-2 px-1">
              <div className="relative flex-shrink-0">
                <svg className="w-20 h-20 rotate-[-90deg]">
                  <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" className="stroke-slate-50" />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    strokeWidth="6"
                    strokeDasharray="226.2"
                    strokeDashoffset={226.2 - (226.2 * (health.score || 0)) / 100}
                    className={`${health.score >= 70 ? "stroke-emerald-500" : health.score >= 40 ? "stroke-amber-500" : "stroke-rose-500"} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-800 leading-none tabular-nums tracking-tighter">{health.score}</span>
                  <span className="text-[7px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Score Matrix</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FiCalendar className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Protocol ETA</span>
                  </div>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                    {health.predictedCompletionDate ? format(new Date(health.predictedCompletionDate), "MMM do, yyyy") : "Desynchronized"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Column */}
          <div className="flex-1 space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FiZap size={40} />
               </div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <FiZap className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">AI Synthesis Report</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed font-bold italic relative z-10 uppercase tracking-tight opacity-90">
                "{health.summary}"
              </p>
            </div>

            {health.riskAlerts && health.riskAlerts.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {health.riskAlerts.map((risk, index) => (
                  <div key={index} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-100 text-[9px] text-rose-700 font-black uppercase tracking-widest shadow-sm">
                    <FiAlertTriangle className="w-3 h-3 text-rose-400" />
                    {risk}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHealthPanel;
