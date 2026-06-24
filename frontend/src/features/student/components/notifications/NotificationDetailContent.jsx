import { 
  FiBell, 
  FiAlertCircle, 
  FiInfo, 
  FiZap, 
  FiClock, 
  FiUser, 
  FiCheckCircle,
  FiMail,
  FiLayers,
  FiFileText
} from "react-icons/fi";

const NotificationDetailContent = ({ 
  notification, 
  priority, 
  sender,
  onMarkRead,
  actionStatus = "idle"
}) => {
  if (!notification) return null;

  const getPriorityColor = () => {
    switch (priority) {
      case "high": return "text-rose-600";
      case "medium": return "text-amber-600";
      default: return "text-sky-600";
    }
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Signal Status Layer */}
      <div className="flex items-center justify-between">
         <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
            notification.isRead ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'
         }`}>
            {notification.isRead ? 'Resolved Node' : 'Active Signal'}
         </span>
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <FiClock size={12} />
            {formatDate(notification.createdAt)}
         </span>
      </div>

      {/* Message Payload Tile */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
            <FiMail size={80} />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-slate-400">
               <FiMail size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Message Payload</span>
            </div>
            <p className="text-[13px] font-bold text-slate-700 leading-relaxed">
               {notification.message}
            </p>
         </div>
      </div>

      {/* Metadata Protocol Grid */}
      <div className="grid grid-cols-2 gap-4">
         <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Protocol</p>
            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
               <FiUser size={12} className="text-indigo-400" />
               {sender?.tag || 'System'}
            </p>
         </div>
         <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority Metric</p>
            <p className={`text-[11px] font-black uppercase tracking-tight ${getPriorityColor()}`}>
               {priority || 'Standard'} Priority
            </p>
         </div>
      </div>

      {/* Actionable Tactical Node */}
      {notification.link && (
         <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 group cursor-pointer overflow-hidden relative active:scale-[0.98] transition-all"
              onClick={() => window.location.href = notification.link}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
               <FiFileText size={80} />
            </div>
            <div className="relative z-10">
               <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-100 text-left">Tactical Objective</h4>
               <p className="text-sm font-black tracking-tight mb-4 leading-tight text-left">Direct Access to Mission Resource</p>
               <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Open Target Hub
               </button>
            </div>
         </div>
      )}

      {/* Protocol Resolution Action */}
      {!notification.isRead && onMarkRead && (
         <div className="pt-2 border-t border-slate-100 px-1">
            <button
               onClick={onMarkRead}
               disabled={actionStatus === "loading"}
               className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
            >
               <FiCheckCircle size={16} />
               {actionStatus === "loading" ? "Ingesting Signal..." : "Resolve Signal"}
            </button>
         </div>
      )}
    </div>
  );
};

export default NotificationDetailContent;
