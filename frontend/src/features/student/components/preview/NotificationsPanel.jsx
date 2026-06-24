import { FiBell, FiZap, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  normalizeNotificationPriority,
  resolveNotificationSender,
} from "../../utils/notificationMeta.js";

const priorityClass = {
  high: "bg-rose-50 text-rose-600 border-rose-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  low: "bg-sky-50 text-sky-600 border-sky-100",
};

const NotificationsPanel = ({ notifications, unreadCount, onOpen }) => {
  const unreadItems = notifications.filter((n) => !n.isRead);
  const items = unreadItems.slice(0, 3);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl h-full hover:shadow-md transition-all group">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiBell className="text-indigo-600" />
          <h2>Incident Registry</h2>
        </div>
        {unreadCount > 0 && (
          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
            {unreadCount} Signal{unreadCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-3 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {items.map((n) => {
          const priority = normalizeNotificationPriority(n.priority);
          const sender = resolveNotificationSender(n);

          return (
            <button
              key={n._id}
              onClick={() => onOpen?.(n)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all text-left shadow-sm group/item"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${priorityClass[priority]}`}>
                  {priority}
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover/item:text-indigo-600 transition-colors">
                {n.title || n.type}
              </p>
              <p className="text-[10px] font-bold text-slate-400 line-clamp-1 mt-0.5">
                {n.message}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">
                  FROM: {sender.tag}
                </span>
              </div>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="h-10 w-10 mb-3 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
               <FiBell size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Signal Clear</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/30">
        <button
          onClick={() => navigate("/student/notifications")}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors group"
        >
          Master Archive <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
