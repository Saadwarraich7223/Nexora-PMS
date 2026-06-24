import { FiActivity, FiCheckCircle, FiClock, FiAlertTriangle, FiTarget, FiZap } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const GroupHealthSummary = ({ workspace, status }) => {
  if (status === "loading") {
    return (
      <div className="glass-card bg-white/50 border-none shadow-sm rounded-3xl p-6 mb-6">
        <LoadingSkeleton className="h-4 w-1/4 mb-6 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!workspace || !workspace.tasks) return null;

  // Progress Intelligence Math
  const tasks = workspace.tasks || [];
  const features = workspace.features || [];
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFeatures = features.length;
  const completedFeatures = features.filter((f) => f.relatedTasks && f.relatedTasks.length > 0 && f.progress === 100).length;
  const featureProgress = totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0;

  // Calculate overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < now && t.status !== "completed");
  
  // Health Status
  let healthStatus = "Normal Operation";
  let healthColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
  let healthIcon = <FiCheckCircle className="text-emerald-500" />;
  let healthLevel = "Low";
  
  if (overdueTasks.length >= 3 || (workspace.project && workspace.project.status === "rejected")) {
    healthStatus = "Critical Intervention";
    healthColor = "text-rose-600 bg-rose-50 border-rose-100";
    healthIcon = <FiAlertTriangle className="text-rose-500" />;
    healthLevel = "High";
  } else if (overdueTasks.length > 0 || totalTasks === 0) {
    healthStatus = "Observation Required";
    healthColor = "text-amber-600 bg-amber-50 border-amber-100";
    healthIcon = <FiClock className="text-amber-500" />;
    healthLevel = "Medium";
  }

  return (
    <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm p-5 mb-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Project Intelligence Pulse</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Real-time cohort health & velocity metrics</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-sm ${healthColor}`}>
          {healthIcon}
          {healthStatus}
          <span className="w-1 h-1 rounded-full bg-current opacity-30 mx-1"></span>
          Risk: {healthLevel}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task Velocity Metric */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-5 border border-slate-100 hover:bg-white transition-all group shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shadow-sm"><FiZap size={14} /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Velocity</p>
          </div>
          <div className="flex items-baseline gap-1">
             <span className="text-2xl font-black text-slate-800 tracking-tight">{taskProgress}%</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Units Finalized</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500" 
               style={{ width: `${taskProgress}%` }}
             />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
            {completedTasks} of {totalTasks} units finalized
          </p>
        </div>

        {/* Feature Maturity Metric */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-5 border border-slate-100 hover:bg-white transition-all group shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100 shadow-sm"><FiTarget size={14} /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feature Maturity</p>
          </div>
          <div className="flex items-baseline gap-1">
             <span className="text-2xl font-black text-slate-800 tracking-tight">{featureProgress}%</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Modules Stable</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-500" 
               style={{ width: `${featureProgress}%` }}
             />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">
            {completedFeatures} of {totalFeatures} modules stable
          </p>
        </div>

        {/* Friction Points Metric */}
        <div className={`bg-white/50 backdrop-blur-sm rounded-xl p-5 border transition-all group shadow-sm ${overdueTasks.length > 0 ? "border-rose-100 bg-rose-50/10" : "border-slate-100"}`}>
          <div className="flex items-center justify-between mb-4">
             <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shadow-sm ${overdueTasks.length > 0 ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}><FiActivity size={14} /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Friction Points</p>
          </div>
          <div className="flex items-baseline gap-1">
             <span className={`text-2xl font-black tracking-tight ${overdueTasks.length > 0 ? "text-rose-600" : "text-slate-800"}`}>{overdueTasks.length}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Blockers Detected</span>
          </div>
          <div className="mt-4 flex gap-1">
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < overdueTasks.length ? "bg-rose-500" : "bg-slate-100"}`} />
             ))}
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
            Overdue operational tasks detected
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupHealthSummary;
