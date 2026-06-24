import { Link } from "react-router-dom";
import { FiCheckCircle, FiUsers, FiUpload, FiBell, FiChevronRight } from "react-icons/fi";

const QuickActionsCard = () => {
  const actions = [
    {
      to: "/admin/groups",
      title: "Approve Groups",
      desc: "Process new submissions",
      icon: <FiCheckCircle />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      to: "/admin/faculty",
      title: "Faculty Load",
      desc: "Assign & balance mentors",
      icon: <FiUsers />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      to: "/admin/students",
      title: "Bulk Import",
      desc: "Upload student rosters",
      icon: <FiUpload />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
          Command Shortcuts
        </h2>
        <p className="text-[10px] font-bold text-slate-700">Quick operational pivots.</p>
      </div>

      <div className="flex-1 p-4 space-y-3 bg-slate-50/20">
        {actions.map((action, idx) => (
          <Link
            key={idx}
            to={action.to}
            className="group flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center text-lg transition-transform group-hover:scale-110 shadow-sm`}>
                {action.icon}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 tracking-tight">{action.title}</h4>
                <p className="text-[9px] font-bold text-slate-400">{action.desc}</p>
              </div>
            </div>
            <div className="p-1 px-1.5 rounded-md bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
               <FiChevronRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white/50">
        <Link
          to="/admin/announcements"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
        >
          <FiBell />
          BroadCast Alert
        </Link>
      </div>
    </div>
  );
};

export default QuickActionsCard;
