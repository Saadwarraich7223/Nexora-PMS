import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { FiAlertTriangle, FiCheckCircle, FiActivity, FiUsers, FiZap, FiCalendar, FiTarget } from 'react-icons/fi';
import { HiOutlineLightBulb as BrainCircuit } from 'react-icons/hi';
import adminApi from '../../api/adminApi';

const HealthForecastingHub = ({ groupId, groupName, fetcher }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        const data = fetcher 
          ? await fetcher() 
          : await adminApi.fetchProjectHealthForecast(groupId);
        
        // Ensure we extract the nested 'data' payload from our standard API response shape
        setForecast(data?.data || data);
      } catch (err) {
        setError("Telemetry signal lost. Re-synchronizing...");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) loadForecast();
  }, [groupId, fetcher]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse">
      <FiActivity className="animate-spin text-cyan-400 mb-2" size={20} />
      <div className="text-xs text-slate-400 font-mono tracking-widest uppercase">Analyzing Telemetry</div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400 text-xs text-center">
      <FiAlertTriangle className="mx-auto mb-2" size={18} />
      {error}
    </div>
  );

  if (!forecast) return null;

  const { healthScore, status, breakdown, aiInsight } = forecast;

  const radarData = [
    { subject: 'Velocity', A: breakdown?.velocity.score, fullMark: 100 },
    { subject: 'Engagement', A: breakdown?.engagement.score, fullMark: 100 },
    { subject: 'Telemetry', A: breakdown?.telemetry.score, fullMark: 100 },
  ];

  const getStatusColor = (score) => {
    if (score >= 80) return 'text-cyan-400';
    if (score >= 60) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getStatusBg = (score) => {
    if (score >= 80) return 'bg-cyan-500/10 border-cyan-500/20';
    if (score >= 60) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-left">
      
      {/* Compact Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[9px] uppercase tracking-widest mb-1">
            <FiZap size={10} /> Predictive Health
          </div>
          <h2 className="text-sm font-bold text-white leading-tight">
            {groupName || "Project"} Intelligence
          </h2>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border ${getStatusBg(healthScore)} flex flex-col items-end`}>
          <div className="text-[8px] text-slate-400 font-mono uppercase tracking-widest leading-none mb-1">Health Index</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black leading-none ${getStatusColor(healthScore)}`}>{healthScore}</span>
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">{status}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Radar & Compact Stats Row */}
        <div className="flex gap-4">
          <div className="w-1/2 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-center p-2 relative">
             <div className="h-[120px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                   <PolarGrid stroke="#334155" />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 600 }} />
                   <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                   <Radar name="Group Health" dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
                 </RadarChart>
               </ResponsiveContainer>
             </div>
          </div>
          
          <div className="w-1/2 flex flex-col gap-2">
            {[
              { label: 'Velocity', score: breakdown?.velocity?.score, icon: FiTarget, color: 'from-cyan-500 to-blue-500' },
              { label: 'Engagement', score: breakdown?.engagement?.score, icon: FiUsers, color: 'from-emerald-500 to-teal-500' },
              { label: 'Telemetry', score: breakdown?.telemetry?.score, icon: FiActivity, color: 'from-indigo-500 to-purple-500' },
            ].map((metric) => (
              <div key={metric.label} className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <metric.icon size={10} className="text-slate-500" /> {metric.label}
                  </div>
                  <span className="text-white">{Math.round(metric.score)}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${metric.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight Compact Container */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-cyan-400/10">
            <BrainCircuit size={40} />
          </div>
          
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2 text-xs">
            <BrainCircuit size={14} /> AI Synthesis Summary
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium mb-3 italic">
            "{aiInsight?.summary}"
          </p>

          {(aiInsight?.riskAlerts || []).length > 0 && (
            <div className="mb-3 space-y-1">
              <div className="text-[9px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <FiAlertTriangle size={10} /> Risk Points
              </div>
              {aiInsight.riskAlerts.map((risk, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                  <span className="w-1 h-1 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                  <span className="leading-tight">{risk}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10 mb-3">
            <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <FiCheckCircle size={10} /> Tactical Directive
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {aiInsight?.recommendation || "Maintain current velocity and increase team cohesion."}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <FiCalendar size={10} /> Est. Completion
            </div>
            <div className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md">
              {aiInsight?.predictedCompletionDate ? new Date(aiInsight?.predictedCompletionDate).toLocaleDateString() : "June 25, 2026"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthForecastingHub;
