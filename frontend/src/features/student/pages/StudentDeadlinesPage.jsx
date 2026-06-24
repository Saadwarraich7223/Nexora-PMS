import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  FiTarget, 
  FiActivity, 
  FiZap, 
  FiCalendar, 
  FiClock, 
  FiLayers, 
  FiCheck, 
  FiAlertCircle, 
  FiSearch, 
  FiInfo, 
  FiUser, 
  FiList, 
  FiArrowRight,
  FiFilter
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import { fetchStudentPreview } from "../slices/studentSlice.js";
import studentApi from "../api/studentApi.js";
import StudentDetailDrawer from "../components/shared/StudentDetailDrawer.jsx";
import { getDaysUntil } from "../components/deadlines/deadlineMeta.js";
import StatsCards from "../../admin/components/StatsCards.jsx";
import DeadlinesListPanel from "../components/deadlines/DeadlinesListPanel.jsx";
import DeadlinesInsightsPanel from "../components/deadlines/DeadlinesInsightsPanel.jsx";
import getErrorMessage from "../../../utils/error.js";
import { showError } from "../../../components/ui/toast.jsx";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import "../studentTheme.css";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getDaysRemainingText = (dateValue) => {
  if (!dateValue) return "";
  const days = getDaysUntil(dateValue);
  if (days < 0) return `OVERDUE BY ${Math.abs(days)}D`;
  if (days === 0) return "DUE TODAY";
  if (days === 1) return "DUE TOMORROW";
  return `${days} DAYS REMAINING`;
};

const StudentDeadlinesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { preview } = useSelector((state) => state.student);
  
  const [deadlines, setDeadlines] = useState([]);
  const [status, setStatus] = useState("idle");
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const [horizon, setHorizon] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");

  const group = preview?.group;
  const currentUserId = String(user?._id || "");
  const isLeader = Boolean(group && currentUserId && String(group.leader?._id || group.leader) === currentUserId);

  const loadDeadlines = async () => {
    setStatus("loading");
    try {
      const [deadlinesData, tasksData] = await Promise.all([
        studentApi.fetchDeadlines(),
        studentApi.fetchTasks()
      ]);
      
      const mItems = [];
      
      (deadlinesData.deadlines || []).forEach((d) => {
        if (!d.dueDate) return;
        const isOverridden = d.isOverridden;
        const activeStatus = isOverridden ? d.overrideStatus : (d.completionStatus || "pending");
        const isCompleted = activeStatus === "completed_early" || activeStatus === "completed_on_time" || activeStatus === "overdue";
        mItems.push({ ...d, type: "milestone", dueDate: d.dueDate, isCompleted, activeStatus });
      });
      
      (tasksData.tasks || []).forEach((t) => {
        if (!t.deadline) return;
        const isCompleted = ["completed", "done"].includes(String(t.status || "").toLowerCase());
        let activeStatus = "pending";
        if (isCompleted) activeStatus = "completed_on_time";
        else if (getDaysUntil(t.deadline) < 0) activeStatus = "overdue";

        mItems.push({ 
            ...t, 
            type: "task", 
            name: t.title || "Task", 
            dueDate: t.deadline, 
            isCompleted, 
            activeStatus,
            assigneeName: t.assignedTo?.name || t.assignedTo?.username || "",
            assigneeId: String(t.assignedTo?._id || t.assignedTo || "")
        });
      });
      
      setDeadlines(mItems);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setDeadlines([]);
      showError(getErrorMessage(error, "Failed to load deadlines."));
    }
  };

  useEffect(() => {
    dispatch(fetchStudentPreview());
    loadDeadlines();
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = deadlines.length;
    const overdue = deadlines.filter(d => !d.isCompleted && getDaysUntil(d.dueDate) < 0).length;
    const fulfilled = deadlines.filter(d => d.isCompleted).length;
    const health = total > 0 ? Math.round((fulfilled / total) * 100) : 100;

    return [
      { label: "Total Nodes", value: total, sub: "/ Active Registry", icon: <FiTarget /> },
      { label: "Overdue Alerts", value: overdue, sub: "Action Required", icon: <FiAlertCircle />, color: overdue > 0 ? "text-rose-500" : "" },
      { label: "Fulfilled", value: fulfilled, sub: "Closed Checkpoints", icon: <FiCheck /> },
      { label: "Registry Health", value: `${health}%`, sub: "Operational Integrity", icon: <FiActivity /> },
    ];
  }, [deadlines]);

  const filteredDeadlines = useMemo(() => {
    return [...deadlines]
      .filter((item) => {
         if (item.type === "task" && !isLeader) {
            if (item.assigneeId && item.assigneeId !== currentUserId) return false;
         }
         return true;
      })
      .filter((item) => {
         if (activeTab === "pending" && item.isCompleted) return false;
         if (activeTab === "completed" && !item.isCompleted) return false;
         return true;
      })
      .filter((item) => {
         if (typeFilter !== "all" && item.type !== typeFilter) return false;
         return true;
      })
      .filter((item) => {
        const days = getDaysUntil(item.dueDate);
        if (horizon === "all") return true;
        if (days === null) return false;
        if (horizon === "overdue") return days < 0;
        if (horizon === "today") return days === 0;
        if (horizon === "7days") return days >= 0 && days <= 7;
        if (horizon === "30days") return days >= 0 && days <= 30;
        return true;
      })
      .filter((item) => {
        if (!search.trim()) return true;
        const label = String(item.name || item.title || "").toLowerCase();
        return label.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => {
        if (activeTab === "pending") {
           return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else {
           return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
      });
  }, [deadlines, horizon, search, activeTab, typeFilter, isLeader, currentUserId]);

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        {/* Standardized Orchestrator Header */}
        <StudentPageHeader
          protocolName="Deadline_Command_v1.4"
          title="Deadline Command"
          subtitle="Lifecycle Orchestration & Milestone Intelligence"
          groupName={group?.name}
          rightSide={
            <div className="h-10 px-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 group focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:border-indigo-300 transition-all">
              <FiSearch className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
              <input 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="SEARCH_REGISTRY..."
                 className="bg-transparent border-none outline-none text-[10px] font-black text-slate-700 placeholder:text-slate-300 w-48"
              />
            </div>
          }
        />

        {/* Strategy Layer (KPIs) */}
        <StatsCards stats={stats} status={status === "loading" ? "loading" : "succeeded"} />

        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Intelligence Sidebar */}
          <div className="w-full xl:w-[320px] shrink-0 sticky top-8 space-y-6">
            <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-3xl p-6 shadow-sm space-y-8">
              {/* Protocol Filter */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FiFilter className="text-indigo-500" />
                  Protocol Registry
                </h3>
                <div className="grid gap-2">
                  {[
                    { id: "pending", label: "Operational Hub", icon: <FiClock /> },
                    { id: "completed", label: "Archive Registry", icon: <FiCheck /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        activeTab === tab.id 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <span className="text-[11px] font-black uppercase tracking-tight flex items-center gap-3">
                         <span className={activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400'}>{tab.icon}</span>
                         {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin Filter */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FiLayers className="text-amber-500" />
                  Origin Source
                </h3>
                <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1">
                  {[
                    { id: "all", label: "Global" },
                    { id: "milestone", label: "Teacher" },
                    { id: "task", label: "Self/Task" }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTypeFilter(f.id)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        typeFilter === f.id 
                          ? "bg-white text-amber-600 shadow-sm border border-amber-100/50" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizon Intelligence */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FiCalendar className="text-emerald-500" />
                  Temporal Horizon
                </h3>
                <select 
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all uppercase"
                >
                  <option value="all">FULL_LIFECYCLE</option>
                  <option value="overdue">OVERDUE_ALERTS</option>
                  <option value="today">IMMEDIATE_NODES</option>
                  <option value="7days">7_DAY_STRATEGY</option>
                  <option value="30days">MONTHLY_OUTLOOK</option>
                </select>
              </div>

              {/* Operational Guide */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                <p className="text-[9px] font-bold text-indigo-700 leading-relaxed uppercase tracking-tight">
                  Registry synchronization active. All timestamps relative to node initialization.
                </p>
              </div>
            </div>
          </div>

          {/* Checkpoint Registry (Main List) */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-3xl p-8 space-y-6 min-h-[600px]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Checkpoint Registry</h2>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Operational Assets</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {filteredDeadlines.length} Nodes Indexed
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                {status === "loading" ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-50 animate-pulse border border-slate-100" />)}
                  </div>
                ) : filteredDeadlines.map((item) => {
                  const daysLeft = getDaysUntil(item.dueDate);
                  const isOverdue = !item.isCompleted && daysLeft < 0;
                  const isToday = !item.isCompleted && daysLeft === 0;

                  return (
                    <button
                      key={item._id}
                      onClick={() => setSelectedDeadline(item)}
                      className="group relative flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all text-left overflow-hidden"
                    >
                      {/* Accent Bar */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 transition-all group-hover:w-1.5 ${
                        item.isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : isToday ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-indigo-500'
                      }`} />

                      <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors border border-slate-100">
                        {item.type === "milestone" ? <FiZap size={18} /> : <FiTarget size={18} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                            {item.name || item.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                            item.isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            isOverdue ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {item.activeStatus?.replace("_", " ")}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <FiCalendar size={12} className="text-slate-300" />
                            {formatDate(item.dueDate)}
                          </span>
                          {daysLeft !== null && !item.isCompleted && (
                            <span className={isOverdue ? 'text-rose-500 font-bold' : isToday ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                              {getDaysRemainingText(item.dueDate)}
                            </span>
                          )}
                          {item.grade !== null && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono">
                               SCORE: {item.grade} / {item.maxGrade}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                         {item.linkedFeature && (
                            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                               <FiLayers size={10} className="text-indigo-400" />
                               {item.linkedFeature.name}
                            </div>
                         )}
                         <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all">
                            <FiArrowRight size={14} />
                         </div>
                      </div>
                    </button>
                  );
                })}

                {status !== "loading" && filteredDeadlines.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-32 grayscale opacity-40">
                    <FiTarget size={48} className="text-slate-200 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Clean: No Active Nodes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StudentDetailDrawer
        open={Boolean(selectedDeadline)}
        onClose={() => setSelectedDeadline(null)}
        title={selectedDeadline?.name || selectedDeadline?.title || "Operational Node"}
        subtitle={selectedDeadline ? `TEMPORAL_TARGET: ${formatDate(selectedDeadline.dueDate)}` : ""}
      >
        {selectedDeadline && (
          <div className="space-y-6 pb-20">
            {/* Core Metrics Tier */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Node Protocol</span>
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                     <FiZap size={14} className="text-indigo-500" />
                     {selectedDeadline.type?.toUpperCase() || "MILESTONE"}
                  </span>
               </div>
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registry Status</span>
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                     <FiActivity size={14} className="text-emerald-500" />
                     {selectedDeadline.activeStatus?.toUpperCase().replace("_", " ")}
                  </span>
               </div>
            </div>

            {/* Tactical Intelligence Tile */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5">
               <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                     <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Temporal Node</h4>
                     <p className="text-[11px] font-black text-slate-900 flex items-center gap-2">
                        <FiCalendar className="text-slate-400" />
                        {formatDate(selectedDeadline.dueDate)}
                     </p>
                  </div>
                  <div className="text-right space-y-1">
                     <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Initialization</h4>
                     <p className="text-[11px] font-bold text-slate-500">
                        {formatDate(selectedDeadline.createdAt)}
                     </p>
                  </div>
               </div>

               {selectedDeadline.isOverridden && selectedDeadline.overrideNote && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
                     <div className="flex items-center gap-2">
                        <FiAlertCircle size={14} className="text-amber-500" />
                        <h5 className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Protocol Adjustment Note</h5>
                     </div>
                     <p className="text-[11px] font-bold text-amber-900/70 leading-relaxed uppercase tracking-tight">
                        {selectedDeadline.overrideNote}
                     </p>
                  </div>
               )}

               {selectedDeadline.type === "task" && (
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Instructions</h5>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                           <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                              {selectedDeadline.description || "No specific terminal instructions provided for this node."}
                           </p>
                        </div>
                     </div>
                     <button 
                        onClick={() => navigate("/student/tasks")} 
                        className="w-full h-11 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                     >
                        MANAGE_TASK_BOARD <FiArrowRight />
                     </button>
                  </div>
               )}

               {selectedDeadline.type === "milestone" && selectedDeadline.linkedFeature && (
                  <div className="pt-2">
                     <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Linked Asset Synergy</h5>
                     <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center text-indigo-500">
                              <FiLayers size={14} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{selectedDeadline.linkedFeature.name}</p>
                              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Protocol: {selectedDeadline.linkedFeature.status}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Presence Registry */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                     <FiUser size={14} />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Node Custodian</p>
                     <p className="text-[11px] font-black text-slate-700 uppercase">{selectedDeadline.createdBy?.name || "SYSTEM_PROTOCOL"}</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </StudentDetailDrawer>
    </DashboardShell>
  );
};

export default StudentDeadlinesPage;
