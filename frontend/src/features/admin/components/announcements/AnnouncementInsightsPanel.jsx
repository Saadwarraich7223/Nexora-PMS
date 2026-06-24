import { FiActivity, FiAlertCircle, FiEye, FiClock, FiLayers, FiCheckCircle } from "react-icons/fi";

const statCards = (stats) => [
  {
    label: "Total Broadcasts",
    value: stats.total,
    icon: <FiActivity size={14} />,
    color: "text-slate-600",
    bg: "bg-slate-50",
  },
  {
    label: "High Priority",
    value: stats.high,
    icon: <FiAlertCircle size={14} />,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    label: "Avg Read Rate",
    value: `${stats.readRate}%`,
    icon: <FiEye size={14} />,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    label: "Recent Activity",
    value: stats.recent,
    icon: <FiClock size={14} />,
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
];

const templates = [
  {
    id: "deadline-reminder",
    label: "Deadline Reminder",
    title: "Project Submission Cutoff",
    message: "Reminder: project submissions are due this week. Please verify your files and submit before the cutoff.",
    priority: "high",
  },
  {
    id: "meeting-update",
    label: "Meeting Update",
    title: "Slot Confirmation Required",
    message: "This is a schedule update for supervisor meetings. Check your assigned slot and confirm attendance.",
    priority: "medium",
  },
  {
    id: "portal-notice",
    label: "Portal Notice",
    title: "Scheduled Maintenance Window",
    message: "The portal will undergo maintenance during off-hours. Save your progress and avoid submissions.",
    priority: "low",
  },
];

const AnnouncementInsightsPanel = ({ stats, onUseTemplate }) => (
  <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none rounded-3xl h-full">
    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
       <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Insights & Tools</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Performance tracking and quick drafts</p>
       </div>
       <div className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
          Live
       </div>
    </div>

    <div className="p-8 space-y-8">
      {/* 2x2 Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards(stats).map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
          >
            <div className={`h-8 w-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>
               {card.icon}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-lg font-black tracking-tight ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Templates</h3>
        <div className="space-y-2">
          {templates.map((item) => (
            <button
              key={item.id}
              onClick={() => onUseTemplate(item)}
              className="w-full p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 transition-all text-left flex items-start gap-3 group shadow-sm"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                <FiCheckCircle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate mb-0.5">{item.label}</p>
                <p className="text-[9px] font-bold text-slate-400 truncate">{item.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AnnouncementInsightsPanel;
