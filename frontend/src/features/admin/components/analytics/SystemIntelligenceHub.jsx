import React, { useState } from 'react';
import { 
  FiActivity, 
  FiRefreshCcw, 
  FiChevronDown, 
  FiChevronUp, 
  FiShield, 
  FiSearch, 
  FiZap, 
  FiInfo,
  FiTrendingUp
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import adminApi from '../../api/adminApi';
import { showSuccess, showError } from '../../../../components/ui/toast.jsx';
import getErrorMessage from '../../../../utils/error.js';
import SignalRegistryCard from './SignalRegistryCard.jsx';

const SystemIntelligenceHub = ({ 
  narrative, 
  activeSignals = 0,
  isLoading, 
  isFetching, 
  onRefresh 
}) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);


  const runAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const response = await adminApi.runSystemAudit();
      if (response.success) {
        setAuditResult(response.data);
        showSuccess(response.message || "System-wide audit complete.");
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      showError(getErrorMessage(error, "Audit failed."));
    } finally {
      setIsAuditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse bg-white/40">
        <div className="flex items-center gap-3 mb-6">
          <HiSparkles className="text-indigo-400 animate-spin" size={20} />
          <div className="h-4 w-48 bg-slate-200 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const rawVelocity = narrative?.velocityScore ?? null;
  const velocityScore = rawVelocity !== null
    ? Math.round(rawVelocity <= 1 && rawVelocity > 0 ? rawVelocity * 100 : Math.max(0, Math.min(100, rawVelocity)))
    : null;
  const summary = narrative?.summary || null;
  const insights = Array.isArray(narrative?.insights) ? narrative.insights : [];

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="glass-card flex flex-col h-full relative overflow-hidden group/hub bg-white/40 border border-white/40 backdrop-blur-xl">
      {/* Dynamic Health Accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-1000 ${
        activeSignals > 5 ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
      }`}></div>

      
        {isRegistryOpen ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SignalRegistryCard onResolve={onRefresh} />
          </div>
        ) : (
          <div className="p-5 flex-1 flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Superior Control Header */}        {/* Superior Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
               <FiShield size={18} />
            </div>
            <div>
              <h2 className="text-[11px] font-black text-slate-800 tracking-tight leading-none uppercase">Governance Hub</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-1.5 w-1.5 rounded-full ${activeSignals > 5 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Tactical Intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Operational Counter - Compact */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 border border-slate-100 shadow-sm">
                <p className={`text-[12px] font-black leading-none tabular-nums ${activeSignals > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {activeSignals}
                </p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Signals</p>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Tactical Controls - Compact */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={runAudit}
                disabled={isAuditing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                  isAuditing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md active:scale-95'
                }`}
              >
                {isAuditing ? <FiActivity className="animate-spin" size={10} /> : <FiSearch size={10} />}
                {isAuditing ? 'Auditing...' : 'Audit'}
              </button>

              <button 
                onClick={onRefresh}
                disabled={isFetching}
                className={`p-1.5 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all ${isFetching ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <FiRefreshCcw size={14} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

            {/* Narrative & Metrics Layer - More compact */}
        <div className="grid gap-4 sm:grid-cols-[1fr_2.5fr] mb-5">
           {/* Velocity Card - Smaller */}
           <div className="glass-card p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-sm">
              <div className="flex flex-col h-full justify-between gap-3">
                 <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Velocity</p>
                    <FiTrendingUp className="text-indigo-300 opacity-50" size={14} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black tabular-nums leading-none">{velocityScore ?? 0}%</h3>
                    <div className="mt-2 w-full h-1 bg-indigo-900/30 rounded-full overflow-hidden">
                       <div className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ width: `${velocityScore}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Executive Summary */}
           <div className="p-4 rounded-2xl bg-white/60 border border-white shadow-sm flex flex-col justify-center relative">
              <div className="absolute top-3 right-4">
                 <HiSparkles className="text-indigo-400 opacity-20" size={24} />
              </div>
              <h4 className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <FiZap size={10} />
                 AI Strategic Summary
              </h4>
              <p className="text-[12px] text-slate-700 leading-relaxed font-semibold italic">
                {summary || "Analyzing live data points..."}
              </p>
              {auditResult && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
                   <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">M:</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${auditResult.categories.milestones > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {auditResult.categories.milestones > 0 ? `+${auditResult.categories.milestones}` : 'Clear'}
                      </span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">E:</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${auditResult.categories.evaluations > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {auditResult.categories.evaluations > 0 ? `+${auditResult.categories.evaluations}` : 'Clear'}
                      </span>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* Tactical Insights Grid - More compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.length === 0 ? (
            <div className="col-span-full py-8 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
               <FiInfo size={18} className="opacity-20" />
               <p className="text-[9px] font-bold uppercase tracking-widest">Awaiting Insight Generation</p>
            </div>
          ) : (
            insights.map((insight, i) => {
              const isExpanded = expandedIndex === i;
              return (
                <div 
                  key={i} 
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className={`group/card flex flex-col p-4 rounded-2xl bg-white border transition-all cursor-pointer ${
                    isExpanded 
                      ? 'border-indigo-300 shadow-xl ring-2 ring-indigo-50 transform -translate-y-0.5' 
                      : 'border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 hover:-translate-y-0.5'
                  }`}
                >
                   <div className="flex items-center justify-between mb-3">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${getSeverityBadge(insight.severity)}`}>
                        {insight.severity || 'Info'}
                      </span>
                      <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                         {isExpanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                      </div>
                   </div>
                   
                   <h4 className="text-[12px] font-black text-slate-900 mb-1 leading-tight">
                     {insight.title}
                   </h4>
                   
                   <p className={`text-[10px] text-slate-500 leading-relaxed font-medium transition-all ${isExpanded ? '' : 'line-clamp-2 min-h-[28px]'}`}>
                     {insight.description}
                   </p>
                   
                   <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'mt-4 max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="mt-auto flex flex-col gap-2 bg-gradient-to-br from-slate-900 to-slate-800 p-3 rounded-xl shadow-lg border border-slate-700">
                         <div className="flex items-center gap-1.5">
                           <div className="p-1 rounded-md bg-indigo-500 text-white">
                             <FiZap size={10} />
                           </div>
                           <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">AI Directive</span>
                         </div>
                         <p className="text-[10px] font-bold text-white leading-relaxed">
                           {insight.action}
                         </p>
                      </div>
                   </div>

                   {!isExpanded && insight.action && (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 transition-all">
                        <div className="flex-shrink-0 p-1 rounded-md bg-white text-indigo-600 shadow-sm border border-indigo-50">
                          <FiZap size={10} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 truncate">
                          {insight.action}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
          </div>
        )}
        
      {/* Footer System Status - Compact */}
      <div className="px-5 py-3 bg-slate-900/5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${activeSignals > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} border border-current opacity-70`}>
              <div className={`h-1 w-1 rounded-full ${activeSignals > 0 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`} />
              <span className="text-[8px] font-black uppercase tracking-widest">
                {activeSignals > 0 ? `${activeSignals} Active Alerts` : 'All Clear'}
              </span>
           </div>
        </div>
        <div className="flex items-center gap-1.5 text-indigo-600">
           <button 
              onClick={() => setIsRegistryOpen(!isRegistryOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[9px] font-black uppercase tracking-[0.1em] hover:bg-indigo-100 transition-colors"
            >
               {isRegistryOpen ? 'Close Details' : 'View Escalations'}
            </button>
        </div>
      </div>

    </div>
  );
};

export default SystemIntelligenceHub;
