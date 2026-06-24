import { useEffect, useMemo, useState } from "react";
import { 
  FiBell, 
  FiCheckCircle, 
  FiInfo, 
  FiActivity, 
  FiZap, 
  FiXCircle, 
  FiClock, 
  FiMail, 
  FiAlertCircle, 
  FiLayers,
  FiChevronRight,
  FiX,
  FiFileText,
  FiSearch
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import notificationApi from "../../../services/api/notificationApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import "../teacherTheme.css";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatsCard = ({ title, value, sub, icon: Icon, color, loading }) => (
  <div className="glass-card p-4 rounded-2xl bg-white/70 backdrop-blur-md border-none shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{title}</span>
      {loading ? (
        <LoadingSkeleton className="h-6 w-12 rounded-lg" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black text-slate-800 tracking-tight">{value}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sub}</span>
        </div>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color} bg-white shadow-sm border border-slate-100/50 group-hover:scale-110 transition-transform`}>
      <Icon size={18} />
    </div>
  </div>
);

const SignalDetailDrawer = ({ open, onClose, signal, onMarkRead }) => {
  if (!signal) return null;

  return (

    <div className={`flex justify-end -top-10 pt-8  p-4 text-[10px] fixed inset-0 z-[100] py-4 transition-all duration-500 ${open ? "visible" : "invisible"}`}>
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} 
        onClick={onClose}
      />
      <div className={`flex h-full w-full max-w-md flex-col overflow-hidden border-none shadow-xl bg-white rounded-xl animate-in slide-in-from-right duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full rounded-md flex flex-col">
          <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <FiBell size={20} />
               </div>
               <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Signal Analysis</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident Details & Metadata</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <FiX size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    signal.isRead ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {signal.isRead ? 'Resolved Node' : 'Active Signal'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FiClock size={12} />
                    {formatDate(signal.createdAt)}
                  </span>
               </div>
               <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                 {signal.derivedTitle || signal.title || "Unknown Event Signal"}
               </h1>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
               <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <FiMail size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Message Payload</span>
               </div>
               <p className="text-[13px] font-bold text-slate-700 leading-relaxed">
                 {signal.message}
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Signal Type</p>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{signal.type || 'SYSTEM_SIGNAL'}</p>
               </div>
               <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol Status</p>
                  <p className={`text-[11px] font-black uppercase tracking-tight ${signal.isRead ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {signal.isRead ? 'INGESTED' : 'AWAITING'}
                  </p>
               </div>
            </div>

            {signal.type === "proposal_submission" && (
               <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 group cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                     <FiFileText size={80} />
                  </div>
                  <div className="relative z-10">
                     <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-100">Action Required</h4>
                     <p className="text-sm font-black tracking-tight mb-4 leading-tight">Direct Access to Project Proposal Hub</p>
                     <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                        Open Project Hub
                     </button>
                  </div>
               </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
            {!signal.isRead ? (
               <button 
                 onClick={() => { onMarkRead(signal._id); onClose(); }}
                 className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
               >
                 <FiCheckCircle size={16} />
                 Resolve Signal
               </button>
            ) : (
               <button 
                 onClick={onClose}
                 className="w-full py-3.5 bg-white text-slate-400 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] select-none cursor-default flex items-center justify-center gap-2"
               >
                 <FiCheckCircle size={16} />
                 Signal Resolved
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherNotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // 'active' (unread) or 'archived' (read)
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadNotifications = async () => {
    setStatus("loading");
    try {
      const data = await notificationApi.fetchNotifications();
      setItems(data.notifications || []);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      showError(getErrorMessage(error, "Failed to load notifications."));
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getSignalTitle = (item) => {
    if (item.title) return item.title;
    const msg = item.message.toLowerCase();
    if (msg.includes("proposal") && msg.includes("submitted")) return "Project Proposal Submission";
    if (msg.includes("proposal") && msg.includes("approved")) return "Proposal Approval Protocol";
    if (msg.includes("meeting") && msg.includes("scheduled")) return "System Meeting Log";
    if (msg.includes("deadline") && msg.includes("approaching")) return "Temporal Node Alert";
    if (item.type === "announcement") return "Faculty Announcement";
    if (item.type === "system") return "System Protocol Signal";
    return "Event Signal";
  };

  const processedItems = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        derivedTitle: getSignalTitle(item),
        priority: item.priority || "medium",
      }))
      .filter((item) => {
        // Tab filtering
        if (activeTab === "active" && item.isRead) return false;
        if (activeTab === "archived" && !item.isRead) return false;

        // Priority filtering
        if (priorityFilter !== "all" && item.priority !== priorityFilter)
          return false;

        // Search filtering
        if (search.trim()) {
          const haystack = `${item.derivedTitle} ${item.message}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, activeTab, priorityFilter, search]);

  const stats = useMemo(() => {
    const unread = items.filter((n) => !n.isRead);
    const announcements = items.filter((n) => n.type === "announcement");
    const system = items.filter((n) => ["system", "alert"].includes(n.type));
    
    return {
      total: items.length,
      unread: unread.length,
      announcements: announcements.length,
      system: system.length,
    };
  }, [items]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      if (selectedSignal?._id === id) {
        setSelectedSignal(prev => ({ ...prev, isRead: true }));
      }
    } catch (error) {
      showError(getErrorMessage(error, "Failed to mark signal as resolved."));
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showSuccess("All signals resolved.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to resolve all signals."));
    }
  };

  const handleViewSignal = (signal) => {
    setSelectedSignal(signal);
    setIsDrawerOpen(true);
  };

  const getSignalIcon = (type) => {
    switch (type) {
      case "announcement": return { icon: FiInfo, color: "text-blue-500", bg: "bg-blue-50" };
      case "system": return { icon: FiZap, color: "text-amber-500", bg: "bg-amber-50" };
      case "alert": return { icon: FiAlertCircle, color: "text-rose-500", bg: "bg-rose-50" };
      case "success": return { icon: FiCheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" };
      default: return { icon: FiActivity, color: "text-indigo-500", bg: "bg-indigo-50" };
    }
  };

  return (
    <DashboardShell>
      <div className="h-full bg-transparent overflow-y-auto custom-scrollbar">
        <main className="max-w-[1400px] mx-auto space-y-6 pb-12">
          
          {/* Orchestrator Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FiBell className="text-indigo-600" />
                Notification Command
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Real-time Signal Registry & Event Intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  size={12}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="FILTER_SIGNALS..."
                  className="h-8 pl-9 pr-4 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all w-60 shadow-sm"
                />
              </div>
              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-50/20 transition-all flex items-center gap-2"
                >
                  <FiCheckCircle size={12} />
                  Resolve All
                </button>
              )}
            </div>
          </div>

          {/* Strategy Layer (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Signals" value={stats.total} sub="EVENTS" icon={FiLayers} color="text-slate-600" loading={status === "loading"} />
            <StatsCard title="Unread Nodes" value={stats.unread} sub="PENDING" icon={FiActivity} color="text-indigo-600" loading={status === "loading"} />
            <StatsCard title="Announcements" value={stats.announcements} sub="PUBLIC" icon={FiInfo} color="text-amber-600" loading={status === "loading"} />
            <StatsCard title="System Alerts" value={stats.system} sub="CRITICAL" icon={FiZap} color="text-rose-600" loading={status === "loading"} />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Signal Control Sidebar */}
            <div className="w-full lg:w-56 shrink-0 space-y-4">
              <div className="glass-card p-4 bg-white shadow-sm rounded-xl border-none space-y-4">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Priority Filters
                </h3>
                <div className="space-y-1.5">
                  {["all", "high", "medium", "low"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`w-full px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-left transition-all flex items-center justify-between group ${
                        priorityFilter === p
                          ? "bg-slate-900 text-white shadow-lg"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                      <div
                        className={`h-1 w-1 rounded-full ${
                          p === "high"
                            ? "bg-rose-500"
                            : p === "medium"
                              ? "bg-amber-500"
                              : p === "low"
                                ? "bg-sky-500"
                                : "bg-indigo-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100/50">
                <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <FiActivity size={10} />
                  Registry Health
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black text-slate-900">
                    {Math.round(
                      ((stats.total - stats.unread) / stats.total) * 100 || 100,
                    )}
                    %
                  </span>
                  <span className="text-[7px] font-black text-slate-400 uppercase">
                    Resolution
                  </span>
                </div>
              </div>
            </div>

            {/* Signal Registry Hub */}
            <div className="flex-1 w-full min-w-0 flex flex-col space-y-3">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1.5 p-1 bg-white/60 backdrop-blur-md rounded-xl border border-slate-100 w-fit">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "active"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Active ({stats.unread})
                </button>
                <button
                  onClick={() => setActiveTab("archived")}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "archived"
                      ? "bg-slate-800 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Archive ({stats.total - stats.unread})
                </button>
              </div>

              <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-xl min-h-[500px]">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-900 uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    <h2>
                      {activeTab === "active"
                        ? "Incident Registry Feed"
                        : "Archived Signal History"}
                    </h2>
                  </div>
                  <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    LOGS_V3.2
                  </span>
                </div>

                <div className="p-4 flex-1">
                  {status === "loading" ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <LoadingSkeleton
                          key={i}
                          className="h-16 w-full rounded-xl"
                        />
                      ))}
                    </div>
                  ) : processedItems.length === 0 ? (
                    <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <FiBell className="text-slate-300" size={32} />
                      </div>
                      <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">
                        Feed Clear
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        No signals matching current protocol filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {processedItems.map((item) => {
                        const { icon: Icon, color, bg } = getSignalIcon(item.type);
                        return (
                          <div
                          key={item._id}
                          onClick={() => handleViewSignal(item)}
                          className={`group p-3 rounded-lg border transition-all flex items-start justify-between gap-3 cursor-pointer relative overflow-hidden ${
                            item.isRead
                              ? "bg-white/50 border-slate-100 opacity-60 hover:opacity-100"
                              : "bg-white border-indigo-100 shadow-sm shadow-indigo-50/30 hover:border-indigo-200"
                          }`}
                        >
                          {!item.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-600" />
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${bg} ${color} border border-transparent group-hover:border-current/10 transition-colors`}>
                              <Icon size={14} />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-[10px] font-black uppercase tracking-tight ${item.isRead ? "text-slate-500" : "text-slate-900"}`}>
                                  {item.derivedTitle}
                                </h4>
                                {!item.isRead && (
                                  <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight opacity-90 max-w-2xl truncate">
                                {item.message}
                              </p>
                              <div className="flex items-center gap-2.5 pt-0.5">
                                <div className="flex items-center gap-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                  <FiClock size={9} />
                                  {formatDate(item.createdAt)}
                                </div>
                                <div className={`text-[7px] font-black px-1 py-0.5 rounded border uppercase tracking-widest ${
                                  item.type === 'announcement' ? 'border-blue-100 text-blue-500 bg-blue-50/30' :
                                  item.type === 'alert' ? 'border-rose-100 text-rose-500 bg-rose-50/30' :
                                  'border-slate-100 text-slate-300 bg-slate-50/30'
                                }`}>
                                  {item.type || 'SIGNAL'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {!item.isRead && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkRead(item._id); }}
                                className="h-7 px-3 rounded-md bg-slate-50 text-slate-900 text-[8px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-900 hover:text-white transition-all shadow-sm shrink-0"
                              >
                                Resolve
                              </button>
                            )}
                            <div className="h-7 w-7 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                               <FiChevronRight size={12} />
                            </div>
                          </div>
                        </div>
);
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Signal Archive Banner */}
          <div className="glass-card rounded-2xl border border-slate-200 bg-slate-50/30 p-8 flex items-center justify-between group hover:border-indigo-100 transition-all opacity-80">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100">
                <FiZap size={20} className="text-slate-300" />
              </div>
              <div className="text-left">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Signal Retention Protocol</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-80 leading-relaxed max-w-xl">
                  Signals are retained in the registry for 30 cycles. Resolved nodes are automatically archived after ingestion by the system analytics engine.
                </p>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full border border-slate-200 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
              Retention Active
            </div>
          </div>
        </main>
      </div>

      <SignalDetailDrawer 
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        signal={selectedSignal}
        onMarkRead={handleMarkRead}
      />
    </DashboardShell>
  );
};

export default TeacherNotificationsPage;
