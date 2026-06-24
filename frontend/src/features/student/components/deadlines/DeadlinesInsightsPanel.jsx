import { FiActivity, FiTarget, FiCheckCircle, FiClock } from "react-icons/fi";

const DeadlinesInsightsPanel = ({ deadlines, stats }) => {
  const milestones = deadlines.filter((d) => d.type === "milestone");
  const tasks = deadlines.filter((d) => d.type === "task");

  const completedMilestones = milestones.filter(m => m.isCompleted).length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;

  const milestoneProgress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
  const taskProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const nextMilestone = milestones
    .filter(m => !m.isCompleted)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  return (
    <div className="space-y-4">
      {/* Health Overview Card */}
      <div className="glass-card student-premium-card rounded-2xl px-5 py-5 border-l-4 border-l-indigo-500 shadow-lg">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
          <FiActivity className="text-indigo-500" size={16} />
          Project Health Summary
        </h2>
        
        <div className="space-y-6">
          {/* Milestone Progress */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Milestones Done</label>
              <span className="text-xs font-bold text-teal-600">{completedMilestones}/{milestones.length}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(45,212,191,0.4)]"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
          </div>

          {/* Task Progress */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tasks Completed</label>
              <span className="text-xs font-bold text-violet-600">{completedTasks}/{tasks.length}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-gradient-to-r from-violet-400 to-violet-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(167,139,250,0.4)]"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Next Critical Card */}
      {nextMilestone && (
        <div className="glass-card bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl px-5 py-5 text-white shadow-xl relative overflow-hidden group">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100/70 mb-3 flex items-center gap-2 italic">
            <FiTarget size={14} />
            Next Critical Milestone
          </h3>
          
          <p className="text-lg font-bold leading-tight mb-2 pr-4">{nextMilestone.name || nextMilestone.title}</p>
          
          <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-bold">
            <FiClock size={12} className="text-indigo-200" />
            Major Submission Window
          </div>
        </div>
      )}

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card bg-white/50 rounded-2xl p-4 border border-slate-200/50">
           <FiCheckCircle className="text-emerald-500 mb-2" size={20} />
           <p className="text-xl font-bold text-slate-800">{stats.total - stats.overdue}</p>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">On Track</p>
        </div>
        <div className="glass-card bg-white/50 rounded-2xl p-4 border border-slate-200/50">
           <FiClock className="text-rose-500 mb-2" size={20} />
           <p className="text-xl font-bold text-slate-800">{stats.overdue}</p>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attention</p>
        </div>
      </div>
    </div>
  );
};

export default DeadlinesInsightsPanel;

