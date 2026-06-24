import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiX, FiCheck, FiTrash2, FiExternalLink } from "react-icons/fi";
import notificationApi from "../../services/api/notificationApi.js";
import { showError, showSuccess } from "./toast.jsx";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

const priorityDot = (p) => {
  const v = (p || "low").toLowerCase();
  if (v === "high") return "bg-rose-500";
  if (v === "medium") return "bg-amber-500";
  return "bg-slate-300";
};

const NotificationDrawer = ({ role }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.fetchNotifications();
      setNotifications(data.notifications || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      showError("Failed to mark as read.");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showSuccess("All notifications marked as read.");
    } catch {
      showError("Failed to mark all as read.");
    }
  };

  const deleteNotif = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      showError("Failed to delete.");
    }
  };

  return (
    <div className="relative" ref={drawerRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
          open 
            ? "bg-slate-900 text-white shadow-lg shadow-black/20" 
            : "bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        }`}
        title="Notifications Hub"
      >
        <FiBell size={16} className={unreadCount > 0 ? "animate-pulse" : ""} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[8px] font-black text-white px-1 border-2 border-white shadow-sm"
            style={{ backgroundColor: 'var(--role-accent)' }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Palette */}
      <div
        className={`absolute top-full right-0 mt-3 w-[380px] max-h-[520px] bg-slate-50 rounded-2xl shadow-2xl shadow-black/15 border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 origin-top-right z-[200] ${
          open 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        {/* Elite Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Command Hub</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
               {unreadCount} UNREAD <span className="opacity-40 mx-1">|</span> {notifications.length} TOTAL_SIGNALS
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--role-accent)' }}
              >
                <FiCheck size={10} />
                Dismiss All
              </button>
            )}
            <button
              onClick={() => {
                setOpen(false);
                navigate(`/${role}/notifications`);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                title="View Full Registry"
            >
              <FiExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Signal Registry */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-[120px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-[var(--role-accent)] rounded-full animate-spin" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syncing Signals...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                 <FiBell className="text-slate-200" size={24} />
              </div>
              <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Zero Incidents</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
                Platform is operational. No tactical alerts detected.
              </p>
            </div>
          ) : (
            <>
              {/* Active / Unread Signals */}
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 px-2 mb-2">
                     <span className="w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: 'var(--role-accent)' }}></span>
                     <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">Tactical_Alerts</p>
                  </div>
                  {notifications
                    .filter((n) => !n.isRead)
                    .map((n) => (
                      <div
                        key={n._id}
                        className="group relative rounded-xl p-3 bg-white/60 border border-[var(--role-accent-border)] hover:bg-white transition-all shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_var(--role-accent)] animate-pulse ${priorityDot(n.priority)}`}
                            style={{ backgroundColor: n.priority === 'high' ? undefined : 'var(--role-accent)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                               <p className="text-[10px] capitalize font-black text-slate-900 truncate">
                                 {n.title || n.type || "Notification"}
                               </p>
                               <span className="text-[8px] font-black text-slate-400 opacity-60">
                                 {formatRelativeTime(n.createdAt)}
                               </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed italic">
                              {n.message}
                            </p>
                          </div>
                          
                          {/* Tactical Actions */}
                          <div className="absolute right-2 top-2 h-full py-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                              className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-110 transition-transform"
                                title="Dismiss Signal"
                            >
                              <FiCheck size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                              className="w-6 h-6 rounded-lg flex items-center justify-center bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-110 transition-transform"
                                title="Purge Record"
                            >
                              <FiTrash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Archive Section */}
              {notifications.filter((n) => n.isRead).length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 px-2 mb-2">Signal_Registry</p>
                  {notifications
                    .filter((n) => n.isRead)
                    .slice(0, 8)
                    .map((n) => (
                      <div
                        key={n._id}
                        className="group rounded-xl p-3 bg-slate-50/40 border border-slate-100 hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-slate-300" />
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-bold text-slate-500 truncate italic">
                                  {n.title || n.type || "Notification"}
                                </p>
                                <span className="text-[8px] font-black text-slate-300">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                             </div>
                            <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5 italic">
                              {n.message}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteNotif(n._id)}
                            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all font-black"
                          >
                            <FiTrash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Orchestrator */}
        <div className="px-4 py-2 bg-slate-900 border-t border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Nexora_Sync_Active</span>
           </div>
           <button 
             onClick={() => navigate(`/${role}/profile`)}
             className="text-[8px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-widest"
           >
              Telemetry_Settings
           </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
