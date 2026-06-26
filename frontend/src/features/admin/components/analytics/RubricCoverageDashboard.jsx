import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { FiCheckCircle, FiAlertCircle, FiBookmark, FiFileText, FiLayers } from 'react-icons/fi';
import { BsAward as GraduationCap } from 'react-icons/bs';
import adminApi from '../../api/adminApi';

const RubricCoverageDashboard = ({ groupId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const response = await adminApi.fetchRubricAlignmentReport(groupId);
        setReport(response.data);
      } catch (err) {
        setError("Alignment telemetry failed to sync.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) loadReport();
  }, [groupId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse text-center">
      <GraduationCap className="text-indigo-400 animate-bounce mb-2" size={20} />
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Syncing Alignment...</div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-rose-500 text-xs">
      <div className="flex items-center gap-2 font-black mb-1 uppercase tracking-widest text-[9px]">
        <FiAlertCircle size={12} /> Sync Error
      </div>
      <p>{error}</p>
    </div>
  );

  if (!report) return null;

  const COLORS = ['#10b981', '#f1f5f9'];
  const pieData = [
    { name: 'Satisfied', value: report.satisfiedCriteria },
    { name: 'Remaining', value: report.totalCriteria - report.satisfiedCriteria }
  ];

  return (
    <div className="space-y-4">
      {/* Overview Stat Group: Compact Container */}
      <div className="flex bg-slate-900 rounded-2xl text-white overflow-hidden shadow-xl border border-slate-800">
        
        {/* Left Side: Main Score */}
        <div className="w-1/2 p-4 relative flex flex-col justify-center border-r border-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
             <GraduationCap size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 mb-2">
              <FiBookmark size={10} className="fill-current" /> Alignment
            </p>
            <div className="flex items-baseline gap-2 mb-1">
               <h3 className="text-3xl font-black tabular-nums leading-none text-white">{report.completionPercentage}%</h3>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
               <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${report.completionPercentage}%` }} />
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
              {report.satisfiedCriteria} / {report.totalCriteria} Metrics Satisfied
            </p>
          </div>
        </div>

        {/* Right Side: Pie Breakdown */}
        <div className="w-1/2 bg-slate-800/20 p-2 flex flex-col items-center justify-center">
          <div className="w-full h-[80px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   cx="50%"
                   cy="50%"
                   innerRadius={25}
                   outerRadius={40}
                   paddingAngle={4}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="text-center mt-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress Ratio</p>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
           <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Operational Breakdown</h4>
        </div>

        <div className="grid gap-2">
          {report.report.map((item, idx) => (
            <div key={idx} className={`p-3 rounded-xl border transition-all ${
              item.coverage.isSatisfied 
                ? 'bg-emerald-50/30 border-emerald-100/50' 
                : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="flex items-start justify-between gap-3">
                
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${item.coverage.isSatisfied ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-300'}`} />
                  <div>
                    <h5 className="text-[10px] font-black text-slate-800 tracking-tight leading-tight uppercase mb-0.5">
                      {item.label}
                    </h5>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                       {item.description}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                   <div className="flex flex-col gap-1 items-end mb-1">
                      {item.coverage.taskCount > 0 && (
                        <span className="flex items-center gap-1 text-[7px] font-black text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
                          <FiLayers size={8} /> {item.coverage.taskCount}
                        </span>
                      )}
                      {item.coverage.fileCount > 0 && (
                        <span className="flex items-center gap-1 text-[7px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                          <FiFileText size={8} /> {item.coverage.fileCount}
                        </span>
                      )}
                   </div>
                </div>
              </div>

              {item.coverage.isSatisfied && (
                <div className="mt-2.5 pt-2 border-t border-emerald-100/30 flex flex-wrap gap-1.5">
                   {item.coverage.artifactList.map((art, i) => (
                     <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 bg-white/50 rounded flex-shrink-0 border border-emerald-50 text-[8px] font-bold text-slate-600">
                        {art.type === 'task' ? <FiLayers size={6} /> : <FiFileText size={6} />}
                        <span className="truncate max-w-[100px]">{art.title}</span>
                     </div>
                   ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RubricCoverageDashboard;
