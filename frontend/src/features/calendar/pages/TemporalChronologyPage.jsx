import { useState, useMemo, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiZap,
  FiActivity,
  FiCheckCircle,
  FiFilter,
  FiInfo,
  FiPlus,
  FiTarget,
  FiAlertCircle,
  FiX,
  FiExternalLink,
  FiMapPin,
  FiUsers,
  FiFileText,
  FiBell,
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import StudentPageHeader from "../../student/components/shared/StudentPageHeader.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import studentApi from "../../student/api/studentApi.js";
import teacherApi from "../../teacher/api/teacherApi.js";
import adminApi from "../../admin/api/adminApi.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ─── Temporal Detail Drawer ────────────────────────────────────────────────
const TemporalDetailDrawer = ({ open, onClose, date, signals, onNavigate }) => {
  if (!date) return null;

  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const meetings = signals.filter((s) => s.type === "meeting");
  const deadlines = signals.filter((s) => s.type === "deadline");
  const tasks = signals.filter((s) => s.type === "task");
  const announcements = signals.filter((s) => s.type === "announcement");
  const criticalCount = signals.filter((s) => s.priority === "high").length;

  const getRelativeTime = (targetDate) => {
    const now = new Date();
    const diff = targetDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 0) return `In ${days} days`;
    return `${Math.abs(days)} days ago`;
  };

  const SignalGroup = ({ title, icon: Icon, items, color, bgColor }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-lg ${bgColor} flex items-center justify-center`}
            >
              <Icon size={14} className={color} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {title}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-black ${bgColor} ${color}`}
          >
            {items.length}
          </span>
        </div>
        <div className="space-y-2">
          {items.map((signal) => (
            <div
              key={signal.id}
              onClick={() => onNavigate(signal)}
              className="group p-2.5 rounded-lg border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all group-hover:w-1 ${
                  signal.priority === "high"
                    ? "bg-rose-500"
                    : signal.priority === "medium"
                      ? "bg-amber-500"
                      : signal.type === "announcement"
                        ? "bg-amber-400"
                        : "bg-indigo-500"
                }`}
              />
              <div className="pl-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      signal.priority === "high"
                        ? "bg-rose-50 text-rose-600"
                        : signal.priority === "medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {signal.priority}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    {signal.time || "All Day"}
                  </span>
                </div>

                <h4 className="text-[11px] font-black text-slate-900 tracking-tight mb-1 leading-tight uppercase">
                  {signal.title}
                </h4>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {signal.groupName && (
                    <span className="flex items-center gap-1 text-[8px] font-black text-indigo-500 bg-indigo-50/50 px-1 py-0.5 rounded">
                      <FiUsers size={8} />
                      {signal.groupName}
                    </span>
                  )}
                  {signal.location && (
                    <>
                      <div className="h-1 w-1 rounded-full bg-slate-200" />
                      <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                        <FiMapPin size={8} />
                        {signal.location}
                      </span>
                    </>
                  )}
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                    <FiClock size={9} />
                    {getRelativeTime(signal.date)}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    {signal.category}
                  </span>
                </div>
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                <FiChevronRight size={14} className="text-indigo-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0    z-[100] transition-all duration-500 ${open ? "visible" : "invisible"}`}
    >
      <div
        className={`absolute inset-0 -top-10 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-5 top-0 h-[95vh] rounded-xl  w-full max-w-md bg-white transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          {/* Drawer Header */}
          <div className="border-b border-slate-100 rounded-t-xl bg-slate-50/80 px-4 py-3.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100/50 text-xs font-black">
                  {date.getDate()}
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-slate-900 tracking-tight leading-none mb-0.5">
                    {dayName}
                  </h2>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    {formattedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center text-slate-400 transition-all hover:bg-white hover:text-slate-600 rounded-lg hover:shadow-sm"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Date Summary KPIs */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <p className="text-sm font-black text-slate-900 leading-none mb-0.5">
                  {signals.length}
                </p>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                  Total
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <p
                  className={`text-sm font-black leading-none mb-0.5 ${criticalCount > 0 ? "text-rose-600" : "text-emerald-600"}`}
                >
                  {criticalCount}
                </p>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                  Critical
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <p className="text-sm font-black text-indigo-600 leading-none mb-0.5">
                  {new Set(signals.map((s) => s.type)).size}
                </p>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                  Types
                </p>
              </div>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {signals.length > 0 ? (
              <>
                {/* AI Quick Analysis */}
                {criticalCount > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 border-dashed">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle
                        className="text-rose-500 mt-0.5 shrink-0"
                        size={16}
                      />
                      <div>
                        <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">
                          Priority Alert
                        </h4>
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          {criticalCount} high-priority{" "}
                          {criticalCount === 1
                            ? "signal requires"
                            : "signals require"}{" "}
                          immediate attention on this date.
                          {meetings.length > 0 &&
                            deadlines.length > 0 &&
                            " Potential scheduling conflict detected between meetings and deadlines."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <SignalGroup
                  title="Meetings"
                  icon={FiUsers}
                  items={meetings}
                  color="text-indigo-600"
                  bgColor="bg-indigo-50"
                />
                <SignalGroup
                  title="Deadlines"
                  icon={FiTarget}
                  items={deadlines}
                  color="text-rose-600"
                  bgColor="bg-rose-50"
                />
                <SignalGroup
                  title="Tasks"
                  icon={FiZap}
                  items={tasks}
                  color="text-emerald-700"
                  bgColor="bg-emerald-50"
                />
                <SignalGroup
                  title="Announcements"
                  icon={FiBell}
                  items={announcements}
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
              </>
            ) : (
              <div className="py-20 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100/50">
                  <FiCalendar size={24} className="text-slate-200" />
                </div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  No Active Signals
                </h3>
                <p className="text-[10px] font-bold text-slate-300 max-w-[180px] leading-relaxed uppercase tracking-tight">
                  This temporal node contains no scheduled missions or
                  broadcasts.
                </p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {signals.length > 0 && (
            <div className="border-t rounded-b-xl border-slate-100 p-6 bg-slate-50/30">
              <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest justify-center">
                <FiInfo size={12} />
                Click any signal to navigate to its module
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const TemporalChronologyPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState("idle");

  const [signals, setSignals] = useState([]);
  const role = user?.role;

  // Role-aware filter tabs
  const availableFilters = useMemo(() => {
    if (role === "student") return ["meeting", "deadline", "task"];
    if (role === "teacher") return ["meeting", "deadline", "announcement"];
    return ["deadline", "announcement"]; // admin
  }, [role]);

  const [activeFilters, setActiveFilters] = useState([]);
  const [aiBriefing, setAiBriefing] = useState("");

  // Initialize filters when role loads
  useEffect(() => {
    setActiveFilters(availableFilters);
  }, [availableFilters]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setDrawerOpen(true);
  };

  const handleSignalClick = (signal) => {
    if (!signal) return;
    setDrawerOpen(false);
    switch (signal.type) {
      case "meeting":
        navigate(`/${role}/meetings`);
        break;
      case "deadline":
        navigate(`/${role}/deadlines`);
        break;
      case "task":
        navigate(`/${role}/tasks`);
        break;
      case "announcement":
        navigate(`/${role}/announcements`);
        break;
      default:
        break;
    }
  };

  const toggleFilter = (type) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const filteredSignals = useMemo(() => {
    return signals.filter((s) => activeFilters.includes(s.type));
  }, [signals, activeFilters]);

  const viewDate = useMemo(
    () => ({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    }),
    [currentDate],
  );

  const loadTemporalSignals = useCallback(async () => {
    setStatus("loading");
    try {
      let aggregatedSignals = [];
      const role = user?.role;

      if (role === "student") {
        const [meetingRes, deadlineRes, taskRes] = await Promise.all([
          studentApi.fetchMeetings().catch(() => ({ logs: [] })),
          studentApi.fetchDeadlines().catch(() => ({ deadlines: [] })),
          studentApi.fetchTasks().catch(() => ({ tasks: [] })),
        ]);

        const meetings = meetingRes.logs || meetingRes.meetings || [];
        const deadlines = deadlineRes.deadlines || [];
        const tasks = taskRes.tasks || [];

        aggregatedSignals = [
          ...meetings.map((m) => ({
            id: m._id,
            title: m.agenda || m.type || "Team Meeting",
            date: new Date(m.date),
            type: "meeting",
            priority: "medium",
            category: m.type || "Operational",
            time: new Date(m.date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            raw: m,
          })),
          ...deadlines.map((d) => ({
            id: d._id,
            title: d.name || "Deadline",
            date: new Date(d.dueDate),
            type: "deadline",
            priority: "high",
            category:
              d.completionStatus === "pending"
                ? "Active"
                : d.completionStatus || "Resolved",
            raw: d,
          })),
          ...tasks
            .filter((t) => t.deadline)
            .map((t) => ({
              id: t._id,
              title: t.title || "Task",
              date: new Date(t.deadline),
              type: "task",
              priority: t.priority || "medium",
              category:
                t.status === "completed" ? "Done" : t.status || "Tactical",
              raw: t,
            })),
        ];
      } else if (role === "teacher") {
        const [groupsRes, announcementsRes] = await Promise.all([
          teacherApi.fetchAssignedGroups().catch(() => ({ groups: [] })),
          adminApi.fetchAnnouncements().catch(() => ({ announcements: [] })),
        ]);

        const groups = groupsRes.groups || [];
        const announcements = announcementsRes.announcements || [];

        // Fetch ALL meetings and deadlines across all assigned groups
        let allMeetings = [];
        let allDeadlines = [];
        const seenMeetingIds = new Set();

        for (const group of groups) {
          const groupId = group._id;
          const groupName = group.name || "Group";

          // Fetch meetings for this group
          try {
            const meetRes = await teacherApi.fetchGroupMeetings(groupId);
            const logs = meetRes.logs || [];
            logs.forEach((m) => {
              if (!seenMeetingIds.has(m._id)) {
                seenMeetingIds.add(m._id);
                allMeetings.push({ ...m, groupName });
              }
            });
          } catch {}

          // Fetch deadlines for this group's project
          const projectId = group.project?._id || group.project;
          if (projectId) {
            try {
              const dlRes = await teacherApi.fetchProjectDeadlines(projectId);
              const dls = dlRes.deadlines || [];
              allDeadlines = [
                ...allDeadlines,
                ...dls.map((d) => ({ ...d, groupName })),
              ];
            } catch {}
          }
        }

        aggregatedSignals = [
          ...allMeetings.map((m) => ({
            id: m._id,
            title: m.agenda || m.type || "Meeting",
            date: new Date(m.date),
            type: "meeting",
            priority: "medium",
            category: m.type || "Supervisor",
            time: new Date(m.date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            groupName: m.groupName,
            location: m.location,
            raw: m,
          })),
          ...allDeadlines.map((d) => ({
            id: d._id,
            title: d.name || "Deadline",
            date: new Date(d.dueDate),
            type: "deadline",
            priority: d.completionStatus === "overdue" ? "high" : "medium",
            category: d.groupName || "Academic",
            groupName: d.groupName,
            raw: d,
          })),
          ...announcements.map((a) => ({
            id: a._id,
            title: a.title || a.subject || "Announcement",
            date: new Date(a.createdAt),
            type: "announcement",
            priority: "low",
            category: "Broadcast",
            raw: a,
          })),
        ];
      } else if (role === "admin") {
        const announcementsRes = await adminApi
          .fetchAnnouncements()
          .catch(() => ({ announcements: [] }));
        const announcements = announcementsRes.announcements || [];
        aggregatedSignals = announcements.map((a) => ({
          id: a._id,
          title: a.title || a.subject || "Announcement",
          date: new Date(a.createdAt),
          type: "announcement",
          priority: "low",
          category: "Broadcast",
          raw: a,
        }));
      }

      aggregatedSignals = aggregatedSignals.filter(
        (s) => s.date && !isNaN(s.date.getTime()),
      );
      setSignals(aggregatedSignals);
      setStatus("succeeded");
    } catch (error) {
      console.error("Temporal Sync Failure:", error);
      setStatus("failed");
    }
  }, [user]);

  useEffect(() => {
    loadTemporalSignals();
  }, [loadTemporalSignals]);

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
    const totalDays = new Date(viewDate.year, viewDate.month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ type: "empty", id: `empty-${i}` });
    }
    for (let i = 1; i <= totalDays; i++) {
      const daySignals = filteredSignals.filter(
        (s) =>
          s.date.getDate() === i &&
          s.date.getMonth() === viewDate.month &&
          s.date.getFullYear() === viewDate.year,
      );
      const intensity = Math.min(daySignals.length, 3);
      days.push({
        type: "day",
        date: i,
        fullDate: new Date(viewDate.year, viewDate.month, i),
        id: `day-${i}`,
        signals: daySignals,
        intensity,
      });
    }
    return days;
  }, [viewDate, filteredSignals]);

  const stats = useMemo(() => {
    const total = filteredSignals.length;
    const critical = filteredSignals.filter(
      (s) => s.priority === "high",
    ).length;
    const upcoming = filteredSignals.filter((s) => s.date >= new Date()).length;
    return [
      {
        label: "Active Signals",
        value: total,
        sub: "Filtered Nodes",
        icon: FiCalendar,
        color: "text-slate-600",
      },
      {
        label: "Upcoming",
        value: upcoming,
        sub: "Future Events",
        icon: FiActivity,
        color: "text-indigo-600",
      },
      {
        label: "Critical",
        value: critical,
        sub: "High Priority",
        icon: FiZap,
        color: "text-rose-600",
      },
      {
        label: "System Sync",
        value: status === "loading" ? "..." : "Live",
        sub: "Real-time",
        icon: FiCheckCircle,
        color: "text-emerald-600",
      },
    ];
  }, [filteredSignals, status]);

  const selectedDaySignals = useMemo(() => {
    return filteredSignals.filter(
      (s) =>
        s.date.getDate() === selectedDate.getDate() &&
        s.date.getMonth() === selectedDate.getMonth() &&
        s.date.getFullYear() === selectedDate.getFullYear(),
    );
  }, [selectedDate, filteredSignals]);

  // Today's signals for the sidebar
  const todaySignals = useMemo(() => {
    const today = new Date();
    return filteredSignals.filter(
      (s) =>
        s.date.getDate() === today.getDate() &&
        s.date.getMonth() === today.getMonth() &&
        s.date.getFullYear() === today.getFullYear(),
    );
  }, [filteredSignals]);

  // AI Briefing for today
  useEffect(() => {
    if (status !== "succeeded") return;
    const today = todaySignals;
    if (today.length === 0) {
      setAiBriefing(
        "No active signals detected for today. Optimal window for deep-focus work or strategic planning.",
      );
    } else {
      const high = today.filter((s) => s.priority === "high");
      const meetings = today.filter((s) => s.type === "meeting");
      const deadlines = today.filter((s) => s.type === "deadline");
      let brief = `${today.length} signal${today.length > 1 ? "s" : ""} active today.`;
      if (high.length > 1) {
        brief += ` Warning: ${high.length} high-priority nodes detected — potential resource conflict.`;
      } else if (meetings.length > 0 && deadlines.length > 0) {
        brief += ` Alert: Concurrent meeting and deadline pressure. Prioritize time-sensitive deliverables.`;
      } else if (deadlines.length > 0) {
        brief += ` ${deadlines.length} deadline${deadlines.length > 1 ? "s" : ""} due — focus on critical submissions.`;
      } else {
        brief +=
          " Operational volume is manageable. Proceed with standard protocol.";
      }
      setAiBriefing(brief);
    }
  }, [todaySignals, status]);

  const nextMonth = () =>
    setCurrentDate(new Date(viewDate.year, viewDate.month + 1, 1));
  const prevMonth = () =>
    setCurrentDate(new Date(viewDate.year, viewDate.month - 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getSignalTypeIcon = (type) => {
    if (type === "deadline") return <FiTarget size={8} className="shrink-0" />;
    if (type === "meeting") return <FiUsers size={8} className="shrink-0" />;
    if (type === "announcement")
      return <FiBell size={8} className="shrink-0" />;
    return <FiZap size={8} className="shrink-0" />;
  };

  const getFilterIcon = (type) => {
    if (type === "meeting") return <FiUsers size={12} />;
    if (type === "deadline") return <FiTarget size={12} />;
    if (type === "announcement") return <FiBell size={12} />;
    return <FiZap size={12} />;
  };

  const getFilterColor = (type, isActive) => {
    if (!isActive)
      return "bg-white text-slate-400 hover:text-slate-600 border border-slate-100";
    if (type === "meeting")
      return "bg-indigo-600 text-white shadow-lg shadow-indigo-100";
    if (type === "deadline")
      return "bg-rose-600 text-white shadow-lg shadow-rose-100";
    if (type === "announcement")
      return "bg-amber-500 text-white shadow-lg shadow-amber-100";
    if (type === "task")
      return "bg-emerald-600 text-white shadow-lg shadow-emerald-100";
    return "bg-slate-800 text-white shadow-lg shadow-slate-200";
  };

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Orchestrator Header */}
        <StudentPageHeader
          protocolName={`Temporal_Chronology_v2.0_${user?.role?.charAt(0).toUpperCase()}`}
          title="Mission Calendar"
          subtitle="Unified Event Intelligence & Temporal Synchronization"
          groupName={user?.role?.toUpperCase()}
          rightSide={
            <div className="flex items-center gap-3">
              <button
                onClick={goToToday}
                className="h-10 px-5 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
              >
                Today
              </button>
            </div>
          }
        />

        {/* Strategy KPI Layer */}
        <StatsCards
          stats={stats}
          status={status === "loading" ? "loading" : "succeeded"}
        />

        {/* Tactical Filter Registry */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            {availableFilters.map((type) => (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${getFilterColor(type, activeFilters.includes(type))}`}
              >
                {getFilterIcon(type)}
                {type}s
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <FiFilter size={12} />
            {activeFilters.length}/{availableFilters.length} Active
          </div>
        </div>

        {/* Main Layout: Calendar Grid + Mission Briefing Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar Grid */}
          <div className="flex-1 min-w-0">
            <div className="glass-card bg-white/70 backdrop-blur-md rounded-3xl border-none shadow-sm overflow-hidden">
              {/* Grid Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                      {MONTHS[viewDate.month]}{" "}
                      <span className="text-slate-300 font-bold">
                        {viewDate.year}
                      </span>
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={prevMonth}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                      >
                        <FiChevronLeft size={14} />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                      >
                        <FiChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="hidden md:flex items-center gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />{" "}
                      Meetings
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />{" "}
                      Deadlines
                    </span>
                    {role === "student" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                        Tasks
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />{" "}
                        Announcements
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />{" "}
                      System Alerts
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                      status === "loading"
                        ? "bg-amber-50 border-amber-100 text-amber-600"
                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        status === "loading"
                          ? "bg-amber-500 animate-spin"
                          : "bg-emerald-500 animate-pulse"
                      }`}
                    />
                    {status === "loading" ? "Syncing..." : "Live"}
                  </div>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-white/50">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Cells */}
              <div className="grid grid-cols-7 bg-slate-50/10">
                {daysInMonth.map((cell, idx) => {
                  const hasCritical = cell.signals?.some(
                    (s) => s.priority === "high",
                  );
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        cell.type === "day" && handleDateClick(cell.fullDate)
                      }
                      className={`min-h-[130px] p-2 border-r border-b border-slate-200/80 transition-all cursor-pointer relative group ${
                        cell.type === "empty"
                          ? "bg-slate-50/30"
                          : isSelected(cell.fullDate)
                            ? "bg-indigo-50/40 ring-2 ring-inset ring-indigo-200"
                            : cell.intensity >= 3
                              ? "bg-indigo-50/30"
                              : cell.intensity === 2
                                ? "bg-indigo-50/15"
                                : "bg-white"
                      } ${cell.type === "day" ? "hover:bg-indigo-50/50" : ""} ${idx % 7 === 6 ? "border-r-0" : ""}`}
                    >
                      {cell.type === "day" && (
                        <>
                          <div className="flex items-center justify-between px-1 pt-1 pb-1">
                            <span
                              className={`h-8 w-8 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                                isToday(cell.fullDate)
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                  : isSelected(cell.fullDate)
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 group-hover:text-slate-900"
                              }`}
                            >
                              {cell.date}
                            </span>
                            {cell.signals?.length > 0 && (
                              <div className="flex items-center gap-1">
                                {hasCritical && (
                                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                )}
                                <span
                                  className={`text-[10px] font-black ${hasCritical ? "text-rose-600" : "text-slate-500"}`}
                                >
                                  {cell.signals.length}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-0.5 space-y-0.5 px-0.5 overflow-hidden">
                            {cell.signals?.slice(0, 3).map((signal) => (
                              <div
                                key={signal.id}
                                className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[8px] font-bold truncate transition-all ${
                                  signal.type === "deadline"
                                    ? "bg-rose-50 text-rose-700 border border-rose-100/60"
                                    : signal.type === "meeting"
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100/60"
                                      : signal.type === "announcement"
                                        ? "bg-amber-50 text-amber-700 border border-amber-100/60"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100/60"
                                }`}
                              >
                                {getSignalTypeIcon(signal.type)}
                                <span className="truncate">{signal.title}</span>
                              </div>
                            ))}
                            {cell.signals?.length > 3 && (
                              <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-center py-0.5">
                                +{cell.signals.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tactical Mission Briefing Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-4">
            <div className="glass-card bg-white/70 backdrop-blur-md rounded-2xl border-none shadow-sm p-5 flex flex-col gap-4 sticky top-6">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
                    <FiClock size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      Today's Mission
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    todaySignals.length > 0
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {todaySignals.length} Signals
                </div>
              </div>

              {/* AI Briefing */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 border-dashed">
                <div className="flex items-start gap-3">
                  <FiZap
                    className="text-indigo-500 mt-0.5 shrink-0"
                    size={14}
                  />
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                      AI Briefing
                    </h4>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                      "{aiBriefing}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Signal List */}
              <div className="space-y-3 flex-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex justify-between">
                  <span>Operational Nodes</span>
                  <span>{todaySignals.length} Active</span>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                  {todaySignals.length > 0 ? (
                    todaySignals.map((signal) => (
                          <div
                            key={signal.id}
                            onClick={() => handleSignalClick(signal)}
                            className="group p-2.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                          >
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                                signal.priority === "high"
                                  ? "bg-rose-500"
                                  : signal.priority === "medium"
                                    ? "bg-amber-500"
                                    : signal.type === "task"
                                      ? "bg-emerald-500"
                                      : "bg-indigo-500"
                              }`}
                            />
                            <div className="pl-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                    signal.priority === "high"
                                      ? "bg-rose-50 text-rose-500"
                                      : signal.priority === "medium"
                                        ? "bg-amber-50 text-amber-500"
                                        : signal.type === "task"
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-indigo-50 text-indigo-500"
                                  }`}
                                >
                                  {signal.category}
                                </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {signal.time || "All Day"}
                            </span>
                          </div>
                          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-0.5">
                            {signal.title}
                          </h5>
                          <p className="text-[9px] font-bold text-slate-400">
                            {signal.type === "meeting"
                              ? "Meeting Protocol"
                              : signal.type === "deadline"
                                ? "Deadline Target"
                                : signal.type === "announcement"
                                  ? "Broadcast Signal"
                                  : "Task Execution"}
                          </p>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                          <FiExternalLink
                            size={12}
                            className="text-indigo-400"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 flex flex-col items-center text-center">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                        <FiCalendar size={24} className="text-slate-200" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        No Signals Today
                      </span>
                      <p className="text-[9px] font-bold text-slate-300 mt-1">
                        Clear schedule — optimal for focus work
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <TemporalDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        date={selectedDate}
        signals={selectedDaySignals}
        onNavigate={handleSignalClick}
      />
    </DashboardShell>
  );
};

export default TemporalChronologyPage;
