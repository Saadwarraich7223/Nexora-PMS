import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiAlertCircle, FiCheckCircle, FiArrowRight, FiClipboard, FiLayers } from "react-icons/fi";

const getDaysUntil = (dateValue) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const getUrgencyConfig = (days, isCompleted) => {
  if (isCompleted) return {
    label: "Resolved",
    badgeCls: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: <FiCheckCircle className="text-emerald-500" size={14} />,
  };
  
  if (days < 0) return {
    label: "Overdue",
    badgeCls: "bg-rose-50 text-rose-600 border-rose-100",
    icon: <FiAlertCircle className="text-rose-500" size={14} />,
  };
  if (days === 0) return {
    label: "Critical",
    badgeCls: "bg-rose-50 text-rose-600 border-rose-100 animate-pulse",
    icon: <FiAlertCircle className="text-rose-500" size={14} />,
  };
  if (days <= 2) return {
    label: "Near-term",
    badgeCls: "bg-amber-50 text-amber-600 border-amber-100",
    icon: <FiClock className="text-amber-500" size={14} />,
  };
  return {
    label: `${days}D Left`,
    badgeCls: "bg-slate-50 text-slate-500 border-slate-100",
    icon: <FiCalendar className="text-slate-400" size={14} />,
  };
};

const DeadlinesPanel = ({ deadlines = [], tasks = [], currentUserId = "" }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");

  const mergedItems = useMemo(() => {
    const items = [];
    deadlines.forEach((d) => {
      if (!d.dueDate) return;
      const isOverridden = d.isOverridden;
      const activeStatus = isOverridden ? d.overrideStatus : (d.completionStatus || "pending");
      const isCompleted = activeStatus === "completed_early" || activeStatus === "completed_on_time" || activeStatus === "overdue";
      
      items.push({
        id: d._id,
        title: d.title || d.name || "Milestone",
        date: d.dueDate,
        type: "milestone",
        isCompleted,
        route: "/student/deadlines",
      });
    });

    tasks.forEach((t) => {
      if (!t.deadline) return;
      const assignedId = t.assignedTo?._id || t.assignedTo;
      if (currentUserId && assignedId && String(assignedId) !== String(currentUserId)) return;
      const isCompleted = ["completed", "done"].includes(String(t.status || "").toLowerCase());
      
      items.push({
        id: t._id,
        title: t.title || "Task",
        date: t.deadline,
        type: "task",
        isCompleted,
        route: "/student/tasks",
      });
    });

    return items;
  }, [deadlines, tasks, currentUserId]);

  const displayedItems = useMemo(() => {
    let list = mergedItems.filter(i => activeTab === "completed" ? i.isCompleted : !i.isCompleted);
    if (activeTab === "pending") {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return list;
  }, [mergedItems, activeTab]);

  const visibleItems = displayedItems.slice(0, 5);

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl h-full hover:shadow-md transition-all group">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiCalendar className="text-indigo-600" />
          <h2>Strategic Deadlines</h2>
        </div>
        <div className="flex p-0.5 bg-white rounded-xl border border-slate-100 shadow-sm">
           <button
             onClick={() => setActiveTab("pending")}
             className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "pending" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
           >
             Pending
           </button>
           <button
             onClick={() => setActiveTab("completed")}
             className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "completed" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
           >
             History
           </button>
        </div>
      </div>

      <div className="p-3 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {visibleItems.map((item) => {
          const days = getDaysUntil(item.date);
          const urgency = getUrgencyConfig(days, item.isCompleted);
          return (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => navigate(item.route)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all text-left shadow-sm flex items-start gap-3 group/item"
            >
              <div className="flex flex-col items-center justify-center h-10 w-10 shrink-0 bg-white rounded-lg border border-slate-100 group-hover/item:border-indigo-100 transition-all font-black">
                 <span className="text-[7px] text-slate-400 uppercase tracking-widest leading-none">
                    {new Date(item.date).toLocaleDateString("en-US", { month: "short" })}
                 </span>
                 <span className="text-sm text-slate-800 leading-none mt-1">
                    {new Date(item.date).getDate()}
                 </span>
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover/item:text-indigo-600 transition-colors">
                      {item.title}
                    </p>
                    <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${urgency.badgeCls}`}>
                       {urgency.label}
                    </span>
                 </div>
                 <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                       {item.type === "task" ? <FiClipboard size={10} /> : <FiLayers size={10} />}
                       {item.type}
                    </div>
                    {days <= 2 && !item.isCompleted && (
                       <>
                         <div className="h-1 w-1 rounded-full bg-slate-200" />
                         <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Urgent</span>
                       </>
                    )}
                 </div>
              </div>
            </button>
          );
        })}
        {visibleItems.length === 0 && (
          <div className="py-12 text-center flex flex-col items-center">
             <div className="h-12 w-12 mb-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                <FiCheckCircle size={24} />
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Timeline Clear</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/30">
        <button
          onClick={() => navigate("/student/deadlines")}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors group"
        >
          View Full Timeline <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default DeadlinesPanel;
