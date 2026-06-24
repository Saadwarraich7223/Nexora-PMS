import { resolveDeadlineStatus, getDaysUntil } from "./deadlineMeta.js";
import { FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiUser, FiStar } from "react-icons/fi";

const DeadlinesListPanel = ({ deadlines, loading, onSelect, formatDate, activeTab, onTabChange, currentUserId }) => {
  const milestones = deadlines.filter((d) => d.type === "milestone");
  const tasks = deadlines.filter((d) => d.type === "task");

  const renderItem = (deadline) => {
    const timeStatus = resolveDeadlineStatus(deadline.dueDate);
    
    const isOverridden = deadline.isOverridden;
    const activeStatus = deadline.activeStatus || "pending";
    
    let badgeClass = timeStatus.className || "bg-slate-50 text-slate-600 border-slate-200";
    let badgeLabel = timeStatus.label || "Pending";
    let Icon = FiClock;
    
    if (activeStatus === "completed_early") {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      badgeLabel = deadline.daysVariance ? `Done Early (+${deadline.daysVariance}d)` : "Done Early";
      Icon = FiCheckCircle;
    } else if (activeStatus === "completed_on_time") {
      badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
      badgeLabel = "Done On Time";
      Icon = FiCheckCircle;
    } else if (activeStatus === "overdue") {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
      badgeLabel = deadline.daysVariance ? `Done Late (${Math.abs(deadline.daysVariance)}d)` : "Done Late";
      Icon = FiAlertCircle;
    }

    if (isOverridden && activeStatus !== "pending") {
      badgeLabel = `${badgeLabel}*`;
    }

    const daysLeft = getDaysUntil(deadline.dueDate);
    let daysString = "";
    if (daysLeft !== null) {
      if (daysLeft === 0) daysString = "Today";
      else if (daysLeft === 1) daysString = "Tomorrow";
      else if (daysLeft > 1) daysString = `${daysLeft} days left`;
      else if (daysLeft < 0) daysString = `${Math.abs(daysLeft)} days ago`;
    }

    return (
      <button
        key={`${deadline.type}-${deadline._id}`}
        onClick={() => onSelect(deadline)}
        className="w-full text-left rounded-xl px-4 py-3 border transition-all duration-150 bg-white/40 hover:bg-white/70 border-slate-200/60 shadow-sm flex items-start gap-3 flex-col sm:flex-row sm:items-center"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
            {deadline.name || deadline.title || "Deadline"}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <FiCalendar className="text-slate-400" size={12} />
              Due: {formatDate(deadline.dueDate)}
              {daysString && (
                <span className="ml-1 font-bold text-slate-400">({daysString})</span>
              )}
            </p>
            {deadline.type === "task" && deadline.assigneeName && (
               <span className={`flex items-center gap-1.5 text-[10px] font-bold border px-2 py-0.5 rounded-full transition-colors ${
                  String(deadline.assigneeId) === String(currentUserId)
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-violet-50 text-violet-700 border-violet-100"
               }`}>
                  {String(deadline.assigneeId) === String(currentUserId) ? (
                    <>
                      <FiStar className="text-amber-500 fill-amber-500" size={10} />
                      My Task
                    </>
                  ) : (
                    <>
                      <FiUser className="text-violet-500" size={10} />
                      {deadline.assigneeName}
                    </>
                  )}
               </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap shrink-0 mt-2 sm:mt-0">
          <span
            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border leading-tight ${badgeClass}`}
          >
            <Icon size={12} />
            {badgeLabel}
          </span>
          
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full leading-tight ${
              deadline.type === "task"
                ? "bg-violet-100 text-violet-600"
                : "bg-teal-100 text-teal-600"
            }`}
          >
            {deadline.type === "task" ? "Task" : "Milestone"}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="glass-card student-premium-card rounded-2xl px-4 py-4 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-slate-800">Deadline Timeline</h2>
        
        <div className="flex p-1 bg-slate-100/50 border border-slate-200/60 rounded-xl shrink-0 w-full sm:w-[240px]">
          <button
            onClick={() => onTabChange("pending")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all capitalize tracking-wider ${
              activeTab === "pending"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => onTabChange("completed")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all capitalize tracking-wider ${
              activeTab === "completed"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Completed
          </button>
        </div>
      </div>
      
      <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          </div>
        ) : deadlines.length > 0 ? (
          <div className="space-y-6">
            {milestones.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 block shadow-[0_0_8px_rgba(45,212,191,0.5)]"></span>
                  Teacher Milestones
                </h3>
                {milestones.map(renderItem)}
              </div>
            )}
            
            {tasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 block shadow-[0_0_8px_rgba(167,139,250,0.5)]"></span>
                  Student Tasks
                </h3>
                {tasks.map(renderItem)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
             <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
               <FiCheckCircle className="text-slate-400" size={20} />
             </div>
             <p className="text-xs font-bold text-slate-800 mt-1">No deadlines found.</p>
             <p className="text-[11px] text-slate-400 text-center">
               Adjust your filters or tab selection.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlinesListPanel;

