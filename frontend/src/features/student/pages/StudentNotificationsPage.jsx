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
  FiSearch,
  FiRefreshCw
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import notificationApi from "../../../services/api/notificationApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import { 
  normalizeNotificationPriority, 
  resolveNotificationSender 
} from "../utils/notificationMeta.js";
import "../studentTheme.css";

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

const SignalDetailDrawer = ({ open, onClose, signal, onMarkRead }) => {
  if (!signal) return null;
  const sender = resolveNotificationSender(signal);
  const priority = normalizeNotificationPriority(signal.priority);

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-500 ${open ? "visible" : "invisible"}`}>
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} 
        onClick={onClose}
      />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-full flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-6 font-black uppercase tracking-widest text-[10px]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <FiBell size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Signal Analysis</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident Details & Metadata</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 rounded-xl"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                  signal.isRead ? "bg-slate-100 text-slate-500" : "bg-indigo-100 text-indigo-600"
                }`}>
                  {signal.isRead ? "Resolved Node" : "Active Signal"}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <FiClock size={12} />
                  {formatDate(signal.createdAt)}
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                {signal.derivedTitle}
              </h1>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-400">
                <FiMail size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Message Payload</span>
              </div>
              <p className="text-[13px] font-bold leading-relaxed text-slate-700">
                {signal.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Source Protocol</p>
                <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">{sender.tag}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Priority Level</p>
                <p className={`text-[11px] font-black uppercase tracking-tight ${
                  priority === "high" ? "text-rose-600" : priority === "medium" ? "text-amber-600" : "text-sky-600"
                }`}>
                  {priority}
                </p>
              </div>
            </div>

            {signal.link && (
               <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 group cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                     <FiFileText size={80} />
                  </div>
                  <div className="relative z-10">
                     <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-100">Tactical Objective</h4>
                     <p className="text-sm font-black tracking-tight mb-4 leading-tight">Direct Access to Mission Resource</p>
                     <button 
                       onClick={() => window.location.href = signal.link}
                       className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                     >
                        Open Target Hub
                     </button>
                  </div>
               </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-slate-100 bg-slate-50/30 p-6">
            {!signal.isRead ? (
              <button 
                onClick={() => onMarkRead(signal._id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600"
              >
                <FiCheckCircle size={16} />
                Resolve Signal
              </button>
            ) : (
              <button 
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 cursor-default"
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

const StudentNotificationsPage = () => {
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
      showError(getErrorMessage(error, "Failed to load notification registry."));
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getSignalTitle = (item) => {
    if (item.title) return item.title;
    const msg = String(item.message || "").toLowerCase();
    const type = String(item.type || "").toLowerCase();

    if (msg.includes("evaluation") || msg.includes("grading")) return "Performance Matrix Evaluation";
    if (msg.includes("meeting")) return "Mission Briefing Protocol";
    if (msg.includes("deadline")) return "Temporal Node Alert";
    if (msg.includes("task") || msg.includes("feature")) return "Tactical Asset Update";
    if (type === "announcement") return "Protocol Announcement";
    if (type === "system") return "System Command Signal";
    return "Notification Signal";
  };

  const processedItems = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        derivedTitle: getSignalTitle(item),
        priority: normalizeNotificationPriority(item.priority),
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
          return haystack.includes(search.trim().toLowerCase());
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, activeTab, priorityFilter, search]);

  const stats = useMemo(() => {
    const total = items.length;
    const unread = items.filter(n => !n.isRead).length;
    const highPriority = items.filter(n => normalizeNotificationPriority(n.priority) === "high").length;
    const health = total > 0 ? Math.round(((total - unread) / total) * 100) : 100;

    return [
      { label: "Total Signals", value: total, sub: "Indexed Nodes", icon: FiLayers, color: "text-slate-600" },
      { label: "Unread Registry", value: unread, sub: "Awaiting Actions", icon: FiActivity, color: "text-indigo-600" },
      { label: "Critical Alerts", value: highPriority, sub: "High Priority", icon: FiZap, color: "text-rose-600" },
      { label: "System Health", value: `${health}%`, sub: "Read Consensus", icon: FiCheckCircle, color: "text-emerald-600" },
    ];
  }, [items]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (selectedSignal?._id === id) {
        setSelectedSignal(prev => ({ ...prev, isRead: true }));
      }
      showSuccess("Signal resolved.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to resolve signal."));
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      showSuccess("All signals resolved in index.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to mass resolve signals."));
    }
  };

  const handleViewSignal = (signal) => {
    setSelectedSignal(signal);
    setIsDrawerOpen(true);
  };

  const getSignalIcon = (type, priority) => {
    if (priority === "high") return { icon: FiZap, color: "text-rose-500", bg: "bg-rose-50" };
    switch (type) {
      case "announcement": return { icon: FiInfo, color: "text-blue-500", bg: "bg-blue-50" };
      case "system": return { icon: FiZap, color: "text-amber-500", bg: "bg-amber-50" };
      case "alert": return { icon: FiAlertCircle, color: "text-rose-500", bg: "bg-rose-50" };
      default: return { icon: FiActivity, color: "text-indigo-500", bg: "bg-indigo-50" };
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Orchestrator Header */}
        <StudentPageHeader
          protocolName="Notification_Command_v3.2"
          title="Notification Command"
          subtitle="Real-time Signal Registry & Event Intelligence"
          rightSide={
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <FiBell className="text-indigo-600" />
                  Signal Registry
                </h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Centralized Alert & Information Stream
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="FILTER_SIGNALS..."
                    className="h-8 pl-8 pr-4 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all w-60 shadow-sm"
                  />
                </div>
                {stats.unread > 0 && (
                  <button 
                    onClick={handleMarkAll}
                    className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <FiCheckCircle size={12} />
                    Resolve All
                  </button>
                )}
              </div>
              <button 
                onClick={loadNotifications}
                className="h-8 w-8 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all active:scale-95"
              >
                <FiRefreshCw size={14} className={status === "loading" ? "animate-spin" : ""} />
              </button>
            </div>
          }
        />

        {/* Strategy KPI Layer */}
        <div className="mb-6">
          <StatsCards 
            stats={stats} 
            status={status} 
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Signal Control Sidebar */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
             <div className="glass-card p-5 bg-white shadow-sm rounded-2xl border-none space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Filters</h3>
                <div className="space-y-2">
                  {["all", "high", "medium", "low"].map(p => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all flex items-center justify-between group ${
                        priorityFilter === p 
                          ? "bg-slate-900 text-white shadow-lg" 
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        p === 'high' ? 'bg-rose-500' : p === 'medium' ? 'bg-amber-500' : p === 'low' ? 'bg-sky-500' : 'bg-indigo-500'
                      }`} />
                    </button>
                  ))}
                </div>
             </div>

             <button
               onClick={handleMarkAll}
               disabled={items.filter(n => !n.isRead).length === 0}
               className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
             >
                <FiCheckCircle size={14} />
                Resolve All Signals
             </button>
          </div>

          {/* Incident Registry Feed Container */}
          <div className="flex-1 w-full min-w-0 flex flex-col space-y-3">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-white/60 backdrop-blur-md rounded-xl border border-slate-100 w-fit">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'active' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Active ({stats.unread})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'archived' 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Archive ({stats.total - stats.unread})
              </button>
            </div>

            <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-xl min-h-[500px]">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-900 uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-indigo-500" />
                  <h2>{activeTab === 'active' ? 'Active Registry Feed' : 'Archived Signal History'}</h2>
                </div>
                <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-widest">LOGS_V3.2</span>
              </div>

              <div className="p-4 flex-1">
                {status === "loading" ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <LoadingSkeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : processedItems.length === 0 ? (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <FiBell size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Registry Neutral</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">No signals detected within current protocol parameters.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {processedItems.map(item => {
                      const { icon: Icon, color, bg } = getSignalIcon(item.type, item.priority);
                      return (
                        <div 
                          key={item._id}
                          onClick={() => handleViewSignal(item)}
                          className={`group p-3 rounded-lg border transition-all flex items-start justify-between gap-3 cursor-pointer relative overflow-hidden ${
                            item.isRead 
                              ? 'bg-white/50 border-slate-100 opacity-60 hover:opacity-100' 
                              : 'bg-white border-indigo-100 shadow-sm shadow-indigo-50/30 hover:border-indigo-200'
                          }`}
                        >
                          {!item.isRead && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-600" />}
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${bg} ${color} border border-transparent group-hover:border-current/10 transition-colors`}>
                              <Icon size={14} />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-[10px] font-black uppercase tracking-tight ${item.isRead ? 'text-slate-500' : 'text-slate-900'}`}>{item.derivedTitle}</h4>
                                {!item.isRead && <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />}
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight opacity-90 max-w-2xl truncate">{item.message}</p>
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

        {/* Tactical Footer Signal */}
        <div className="glass-card rounded-2xl border border-slate-200 bg-slate-50/50 p-8 flex items-center justify-between group hover:border-indigo-200 transition-all opacity-80 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
              <FiZap size={100} />
           </div>
           <div className="flex items-center gap-6 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                 <FiActivity size={24} className="text-indigo-400" />
              </div>
              <div>
                 <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Strategic Signal Retention</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80 leading-relaxed max-w-2xl">
                    Encrypted signal streams are archived after 30 cycles. Unresolved nodes will persist in the active registry until protocol acknowledgement is received by the system.
                 </p>
              </div>
           </div>
           <div className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
              Retention_Active
           </div>
        </div>
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

export default StudentNotificationsPage;
