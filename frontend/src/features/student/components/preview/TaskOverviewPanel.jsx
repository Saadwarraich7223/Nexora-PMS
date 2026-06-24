import { FiClipboard, FiZap, FiActivity, FiLayers } from "react-icons/fi";

const TaskOverviewPanel = ({ taskStats }) => {
  const percent = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  
  const activeCount = taskStats.todo + taskStats.inProgress;

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl h-full hover:shadow-md transition-all group">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiZap className="text-amber-500" />
          <h2>Performance Velocity</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Active Sprint</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="flex items-center gap-6">
           {/* Animated SVG Ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-slate-100"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-indigo-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-slate-800 leading-none tracking-tighter">{percent}%</span>
              <span className="text-[7px] font-black text-slate-400 tracking-widest mt-0.5 uppercase">Efficiency</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2">
             <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Unit</p>
                <p className="text-base font-black text-slate-800 tracking-tighter">{taskStats.total}</p>
             </div>
             <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">In-Flight</p>
                <p className="text-base font-black text-indigo-600 tracking-tighter">{activeCount}</p>
             </div>
             <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assigned</p>
                <p className="text-base font-black text-slate-700 tracking-tighter">{taskStats.mine}</p>
             </div>
             <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Resolved</p>
                <p className="text-base font-black text-emerald-600 tracking-tighter">{taskStats.done}</p>
             </div>
          </div>
        </div>

        <div className="space-y-2.5">
           <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                 <FiActivity className="text-indigo-500" size={12} />
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Completion Index</p>
              </div>
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tight">{taskStats.done} / {taskStats.total}</span>
           </div>
           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${percent}%` }}></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverviewPanel;
