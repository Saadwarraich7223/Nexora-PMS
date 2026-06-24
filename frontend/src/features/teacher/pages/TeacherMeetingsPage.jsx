import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiAlertCircle,
  FiCheck,
  FiUsers,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiSearch,
  FiLayers,
  FiZap,
  FiTrash2,
  FiActivity,
  FiArrowRight,
  FiInfo,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import { fetchTeacherWorkspace } from "../slices/teacherSlice.js";
import teacherApi from "../api/teacherApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import "../teacherTheme.css";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const isPast = (dateValue) => {
  if (!dateValue) return false;
  return new Date(dateValue).getTime() < Date.now();
};

const getDayName = (dateValue) => {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString("en-US", { weekday: "long" });
};

const getDaysRemaining = (dateValue) => {
  if (!dateValue) return "";
  const diff = new Date(dateValue).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days remaining`;
};

const MeetingsSkeleton = () => (
  <div className="space-y-6">
    {/* Orchestrator Header Skeleton */}
    <div className="min-w-0">
      <h1 className="text-2xl font-black text-slate-800 tracking-tight">
        Meeting Command
      </h1>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
        Session Intelligence & Outcomes
        <span className="h-1 w-1 rounded-full bg-slate-200"></span>
        Synchronized Logs
      </p>
    </div>

    {/* Pending Attendance Reminder Skeleton */}
    <LoadingSkeleton className="h-24 w-full rounded-2xl" />

    {/* Main Workspace Skeleton */}
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full min-w-0">
      <div className="w-full xl:w-[450px] shrink-0 space-y-6">
        <div className="glass-card bg-white/90 border border-slate-100 rounded-2xl p-6 space-y-6">
          <LoadingSkeleton className="h-5 w-40" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <LoadingSkeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-6 min-w-0">
        <div className="glass-card bg-white/90 border border-slate-100 rounded-2xl p-6 space-y-6">
          <LoadingSkeleton className="h-5 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TeacherMeetingsPage = () => {
  const dispatch = useDispatch();
  const { groups } = useSelector((state) => state.teacher);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [logs, setLogs] = useState([]);
  const [logsStatus, setLogsStatus] = useState("idle");
  const [actionStatus, setActionStatus] = useState("idle");

  const [pendingLogs, setPendingLogs] = useState([]);
  const [pendingStatus, setPendingStatus] = useState("idle");

  // Attendance drawer state
  const [attendanceDrawer, setAttendanceDrawer] = useState({
    open: false,
    log: null,
    groupMembers: [],
    selected: [],
  });

  // AI Summary state
  const [summaryViewer, setSummaryViewer] = useState({
    open: false,
    summary: null,
    logType: '',
  });

  const [form, setForm] = useState({
    date: toDateTimeLocal(new Date()),
    type: "Supervisor Meeting",
    location: "",
    agenda: "",
    discussionPoints: "",
  });

  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming, attention, completed
  const [searchQuery, setSearchQuery] = useState("");

  // Protocol Edit State
  const [protocolDrawer, setProtocolDrawer] = useState({
    open: false,
    logId: null,
    agenda: "",
    discussionPoints: "",
  });

  useEffect(() => {
    dispatch(fetchTeacherWorkspace())
      .unwrap()
      .catch((err) =>
        showError(getErrorMessage(err, "Failed to load groups.")),
      );
  }, [dispatch]);

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(String(groups[0]._id));
    }
  }, [groups, selectedGroupId]);

  // Load pending attendance meetings
  const loadPending = async () => {
    setPendingStatus("loading");
    try {
      const data = await teacherApi.fetchPendingAttendanceMeetings();
      setPendingLogs(data.logs || []);
      setPendingStatus("succeeded");
    } catch (error) {
      setPendingStatus("failed");
      setPendingLogs([]);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const loadLogs = async (groupId) => {
    if (!groupId) {
      setLogs([]);
      return;
    }

    setLogsStatus("loading");
    try {
      const data = await teacherApi.fetchGroupMeetings(groupId);
      setLogs(data.logs || []);
      setLogsStatus("succeeded");
    } catch (error) {
      setLogsStatus("failed");
      setLogs([]);
      showError(getErrorMessage(error, "Failed to load meeting logs."));
    }
  };

  useEffect(() => {
    loadLogs(selectedGroupId);
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () =>
      groups.find((group) => String(group._id) === String(selectedGroupId)) ||
      null,
    [groups, selectedGroupId],
  );

  // Split and Sort Logs into Strategy Segments
  const segments = useMemo(() => {
    const now = Date.now();
    const filtered = logs.filter((log) => {
      const searchStr =
        `${log.type} ${log.agenda} ${log.group?.name || ""}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });

    const upcoming = filtered
      .filter((log) => new Date(log.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const attention = filtered
      .filter(
        (log) =>
          new Date(log.date).getTime() < now &&
          (log.attendees || []).length === 0,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const completed = filtered
      .filter(
        (log) =>
          new Date(log.date).getTime() < now &&
          (log.attendees || []).length > 0,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcoming, attention, completed, all: filtered };
  }, [logs, searchQuery]);

  // Strategic KPIs
  const stats = useMemo(() => {
    return {
      total: logs.length,
      pending: pendingLogs.length,
      nextMissions: segments.upcoming.length,
      completed: segments.completed.length,
    };
  }, [logs, pendingLogs, segments]);

  const getRelativeTimeLabel = (dateValue) => {
    const now = Date.now();
    const target = new Date(dateValue).getTime();
    const diff = target - now;
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (diff > 0) {
      if (days > 0) return `Target: T-${days}d`;
      if (hrs > 0) return `Target: T-${hrs}h`;
      return `Target: T-${mins}m`;
    } else {
      if (days > 0) return `Logged: ${days}d ago`;
      if (hrs > 0) return `Logged: ${hrs}h ago`;
      return `Logged: ${mins}m ago`;
    }
  };

  const handleCreateMeeting = async (event) => {
    event.preventDefault();
    if (!selectedGroupId) return;

    if (!form.date) {
      showError("Meeting date is required.");
      return;
    }

    setActionStatus("loading");
    try {
      await teacherApi.createGroupMeeting(selectedGroupId, {
        date: new Date(form.date).toISOString(),
        type: form.type,
        location: form.location.trim() || undefined,
        agenda: form.agenda.trim() || undefined,
        discussionPoints: form.discussionPoints
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });

      showSuccess("Meeting log created.");
      setForm({
        date: toDateTimeLocal(new Date()),
        type: "Supervisor Meeting",
        location: "",
        agenda: "",
        discussionPoints: "",
      });
      await Promise.all([loadLogs(selectedGroupId), loadPending()]);
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to create meeting log."));
    }
  };

  const handleDeleteLog = async (logId) => {
    setActionStatus("loading");
    try {
      await teacherApi.deleteMeetingLog(logId);
      showSuccess("Meeting log deleted.");
      await Promise.all([loadLogs(selectedGroupId), loadPending()]);
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to delete meeting log."));
    }
  };

  // Open the attendance drawer for a given meeting log
  const openAttendanceDrawer = (log, members = []) => {
    const existingIds = (log.attendees || []).map((a) =>
      typeof a === "object" ? String(a._id) : String(a),
    );
    setAttendanceDrawer({
      open: true,
      log,
      groupMembers: members,
      selected: existingIds,
    });
  };

  // Open drawer from the main meeting history (need to fetch group members)
  const handleOpenAttendance = async (log) => {
    // Find group in local state
    const group = groups.find(
      (g) => String(g._id) === String(log.group?._id || log.group),
    );
    if (group && group.members?.length) {
      openAttendanceDrawer(log, group.members);
    } else {
      // Fetch details
      try {
        const res = await teacherApi.fetchGroupDetails(
          log.group?._id || log.group,
        );
        openAttendanceDrawer(log, res.data?.group?.members || []);
      } catch {
        openAttendanceDrawer(log, []);
      }
    }
  };

  // Open drawer from pending panel (group is already populated)
  const handleOpenPendingAttendance = (log) => {
    const members = log.group?.members || [];
    openAttendanceDrawer(log, members);
  };

  const toggleMember = (memberId) => {
    setAttendanceDrawer((prev) => {
      const id = String(memberId);
      const next = prev.selected.includes(id)
        ? prev.selected.filter((s) => s !== id)
        : [...prev.selected, id];
      return { ...prev, selected: next };
    });
  };

  const selectAll = () => {
    setAttendanceDrawer((prev) => ({
      ...prev,
      selected: prev.groupMembers.map((m) => String(m.user?._id || m.user)),
    }));
  };

  const deselectAll = () => {
    setAttendanceDrawer((prev) => ({ ...prev, selected: [] }));
  };

  const handleSaveAttendance = async () => {
    if (!attendanceDrawer.log) return;
    setActionStatus("loading");
    try {
      await teacherApi.markMeetingAttendance(
        attendanceDrawer.log._id,
        attendanceDrawer.selected,
      );
      showSuccess("Attendance marked successfully.");
      setAttendanceDrawer({
        open: false,
        log: null,
        groupMembers: [],
        selected: [],
      });
      await Promise.all([loadLogs(selectedGroupId), loadPending()]);
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to save attendance."));
    }
  };

  const handleFinalizeWithAI = async (logId, payload = {}) => {
    setActionStatus("loading");
    try {
      const data = await teacherApi.finalizeMeetingWithAI(logId, payload);
      showSuccess("AI Intelligence Narrator has summarized this meeting.");
      await loadLogs(selectedGroupId);
      setActionStatus("succeeded");
      // Open the viewer immediately
      if (data.log?.aiSummary) {
        setSummaryViewer({
          open: true,
          summary: data.log.aiSummary,
          logType: data.log.type
        });
      }
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to generate AI summary."));
    }
  };

  const handleOpenProtocolEdit = (log) => {
    setProtocolDrawer({
      open: true,
      logId: log._id,
      agenda: log.agenda || "",
      discussionPoints: (log.discussionPoints || []).join("\n"),
    });
  };

  const handleSaveProtocol = async (finalize = false) => {
    if (!protocolDrawer.logId) return;
    setActionStatus("loading");
    try {
      const payload = {
        agenda: protocolDrawer.agenda.trim(),
        discussionPoints: protocolDrawer.discussionPoints
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      };

      if (finalize) {
        await handleFinalizeWithAI(protocolDrawer.logId, payload);
      } else {
        await teacherApi.updateMeetingLog(protocolDrawer.logId, payload);
        showSuccess("Meeting protocol updated.");
        await loadLogs(selectedGroupId);
      }

      setProtocolDrawer((prev) => ({ ...prev, open: false }));
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to update protocol."));
    }
  };

  if (logsStatus === "loading" && !logs.length) {
    return (
      <DashboardShell>
        <MeetingsSkeleton />
      </DashboardShell>
    );
  }
  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Meeting Header & Overview Matrix */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Meeting Command
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                Session Intelligence & Outcomes
                <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                Synchronized Logs
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH_REGISTRY..."
                  className="h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all w-full md:w-64 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Strategic Matrix KPI Layer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Sessions", value: stats.total, icon: FiLayers, color: "text-slate-600", bg: "bg-slate-50" },
              { label: "Active Missions", value: stats.nextMissions, icon: FiCalendar, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Sync Required", value: stats.pending, icon: FiAlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Verified Logs", value: stats.completed, icon: FiCheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((stat, idx) => (
              <div key={idx} className="glass-card bg-white/70 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-slate-200/40">
                <div className={`h-10 w-10 shrink-0 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Attendance Reminder */}
        {pendingLogs.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 backdrop-blur-md border border-amber-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-1000">
              <FiZap size={120} className="text-amber-600" />
            </div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-center shrink-0">
                <FiAlertCircle className="text-amber-500" size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
                     Sync Threshold Detected
                   </h2>
                   <div className="h-1 w-1 rounded-full bg-amber-400 animate-pulse"></div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.05em] leading-relaxed opacity-70">
                  {pendingLogs.length} Meeting sessions require biometric/manual
                  attendance locking to finalize group telemetry and archival.
                </p>

                <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {pendingLogs.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-white/60 border border-amber-100/50 p-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-amber-500/5 group/alert"
                    >
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-1">
                          {log.group?.name || "UNNAMED"}
                        </span>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                          {log.type}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenPendingAttendance(log)}
                        className="h-10 px-5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 active:scale-95"
                      >
                        SYNC
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8 items-start w-full min-w-0">
          {/* Create Meeting Log */}
          <div className="w-full xl:w-[420px] shrink-0 space-y-6">
            <div className="bg-gradient-to-b from-white to-slate-50/50 border border-slate-100 shadow-sm rounded-3xl p-7 space-y-8 sticky top-6">
              <div>
                <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-2">
                  Schedule Session
                </h2>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Mission Briefing</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-3 leading-relaxed opacity-70">
                  Initialize new meeting telemetry for the target cohort to track strategic progress.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Target Cohort
                  </label>
                  <div className="relative group">
                    <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[11px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all cursor-pointer appearance-none"
                    >
                      <option value="">SELECT REGISTRY...</option>
                      {groups.map((group) => (
                        <option key={group._id} value={group._id}>
                          {group.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleCreateMeeting} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Temporal Node
                      </label>
                      <input
                        type="datetime-local"
                        value={form.date}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, date: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
                        disabled={
                          !selectedGroupId || actionStatus === "loading"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Session Protocol
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, type: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all cursor-pointer"
                        disabled={
                          !selectedGroupId || actionStatus === "loading"
                        }
                      >
                        <option value="Supervisor Meeting">SUPERVISOR_SYNC</option>
                        <option value="Team Meeting">TEAM_SCRUM</option>
                        <option value="Demo">TACTICAL_DEMO</option>
                        <option value="Other">OTHER_PROTOCOL</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Geographic/Digital Node
                    </label>
                    <div className="relative group">
                       <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                       <input
                         value={form.location}
                         onChange={(e) =>
                           setForm((prev) => ({
                             ...prev,
                             location: e.target.value,
                           }))
                         }
                         placeholder="e.g. Lab 4B, Zoom Node 1..."
                         className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all placeholder:text-slate-300"
                         disabled={!selectedGroupId || actionStatus === "loading"}
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Strategic Agenda
                    </label>
                    <textarea
                      rows={3}
                      value={form.agenda}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, agenda: e.target.value }))
                      }
                      placeholder="Draft the primary objective for this session..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all placeholder:text-slate-300 resize-none"
                      disabled={!selectedGroupId || actionStatus === "loading"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Tactical Points (One per line)
                    </label>
                    <textarea
                      rows={3}
                      value={form.discussionPoints}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          discussionPoints: e.target.value,
                        }))
                      }
                      placeholder="Node 1: Implementation verification..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all placeholder:text-slate-300 resize-none"
                      disabled={!selectedGroupId || actionStatus === "loading"}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedGroupId || actionStatus === "loading"}
                    className={`h-12 w-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 ${
                      actionStatus === "loading" 
                        ? "bg-slate-100 text-slate-400" 
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10"
                    }`}
                  >
                    {actionStatus === "loading" ? (
                      <FiActivity className="animate-spin" size={14} />
                    ) : (
                      <FiZap size={14} />
                    )}
                    {actionStatus === "loading"
                      ? "INITIALIZING..."
                      : "Initialize Session Log"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Meeting History */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            <div className="bg-white/90 border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6 min-h-[600px]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("upcoming")}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === "upcoming"
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Upcoming Missions
                  </button>
                  <button
                    onClick={() => setActiveTab("attention")}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === "attention"
                        ? "bg-white text-amber-600 shadow-sm border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Needs Sync
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === "completed"
                        ? "bg-white text-emerald-600 shadow-sm border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Archived Intelligence
                  </button>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    activeTab === 'upcoming' ? 'bg-indigo-500' : 
                    activeTab === 'attention' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {segments[activeTab]?.length || 0} Entries Detected
                  </span>
                </div>
              </div>

              <div className="grid gap-4 max-h-[800px] overflow-y-auto pr-1 custom-scrollbar">
                {segments[activeTab].length === 0 ?
                   <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                         <FiInfo className="text-slate-300" size={24} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zero Data Points Found in this Sector</p>
                   </div>
                  :
                  segments[activeTab].map((log) => {
                    const meetingPast = isPast(log.date);
                    const attendeesCount = Array.isArray(log.attendees)
                      ? log.attendees.length
                      : 0;
                    const hasAttendance = attendeesCount > 0;
                    const groupName = log.group?.name || "UNNAMED_GOUP";
                    const totalMembers = log.group?.members?.length || 0;

                    return (
                      <div
                        key={log._id}
                        className="group/item flex flex-col p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-indigo-100 hover:ring-4 hover:ring-indigo-500/5 transition-all relative overflow-hidden"
                      >
                        {/* Interaction Overlay */}
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2">
                               {meetingPast && (
                                  <button
                                    onClick={() => handleOpenAttendance(log)}
                                    className="h-8 px-3 rounded-lg bg-slate-900 text-[8px] font-black text-white uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                  >
                                    <FiUsers size={10} />
                                    {hasAttendance ? "RE-SYNC" : "SYNC"}
                                  </button>
                               )}
                               {meetingPast && (
                                   log.aiSummary?.executiveSummary ? (
                                    <button
                                      onClick={() => setSummaryViewer({ open: true, summary: log.aiSummary, logType: log.type })}
                                      className="h-8 px-3 rounded-lg bg-indigo-600 text-[8px] font-black text-white uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                      <FiZap size={10} />
                                      VIEW INTEL
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleOpenProtocolEdit(log)}
                                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[8px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                      >
                                        EDIT PROTOCOL
                                      </button>
                                      <button
                                        onClick={() => handleFinalizeWithAI(log._id)}
                                        disabled={actionStatus === 'loading'}
                                        className="h-8 px-3 rounded-lg border border-indigo-200 bg-white text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2"
                                      >
                                        {actionStatus === 'loading' ? (
                                          <FiActivity className="animate-spin" size={10} />
                                        ) : (
                                          <FiZap size={10} />
                                        )}
                                        AI SUMMARIZE
                                      </button>
                                    </div>
                                  )
                               )}
                               <button
                                  onClick={() => handleDeleteLog(log._id)}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all border border-rose-100"
                               >
                                  <FiTrash2 size={12} />
                               </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                          <div className={`h-11 w-11 shrink-0 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                            meetingPast 
                              ? "bg-slate-50 border-slate-100 text-slate-400 group-hover/item:text-slate-500 group-hover/item:border-slate-200" 
                              : "bg-indigo-50 border-indigo-100 text-indigo-500 shadow-sm group-hover/item:bg-indigo-100"
                          }`}>
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-70">
                              {new Date(log.date).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-[14px] font-black leading-none opacity-90">
                              {new Date(log.date).getDate()}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 pr-20">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">
                                {log.type}
                              </h3>
                              <span className="px-2 py-0.5 rounded-lg bg-slate-900/5 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-slate-100">
                                 {groupName}
                              </span>
                              {meetingPast ? (
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                                  hasAttendance ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}>
                                  {hasAttendance ? <FiCheck size={10} /> : <FiAlertCircle size={10} />}
                                  {hasAttendance ? "VERIFIED" : "MANUAL_SYNC_REQUIRED"}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1.5 shadow-sm">
                                  <FiActivity size={10} className="animate-pulse" />
                                  ACTIVE_MISSION
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-2 text-indigo-600/70">
                                <FiCalendar size={12} />
                                {new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-2">
                                <FiClock size={12} />
                                {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {log.location && (
                                <span className="flex items-center gap-2">
                                  <FiMapPin size={12} />
                                  {log.location}
                                </span>
                              )}
                              <span className="flex items-center gap-2 font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                {getRelativeTimeLabel(log.date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Strategic Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Agenda</p>
                             <p className="text-[11px] font-medium text-slate-600 line-clamp-2 italic leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-slate-200">
                               "{log.agenda || "No defined objectives for this session."}"
                             </p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Stats</p>
                             <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                   <FiUsers size={12} className="text-slate-400" />
                                   <span className="text-[10px] font-black text-slate-400 opacity-40 mx-2">--</span>
                                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Personnel Logged</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-900">
                                   {attendeesCount} / {totalMembers || "N/A"}
                                </span>
                             </div>
                          </div>
                        </div>

                        {meetingPast && hasAttendance && (
                          <div className="mt-4 flex flex-wrap gap-1.5 overflow-hidden max-h-[22px]">
                            {log.attendees.slice(0, 5).map((a) => (
                              <span key={typeof a === "object" ? a._id : a} className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                                {typeof a === "object" ? a.name : "Member"}
                              </span>
                            ))}
                            {log.attendees.length > 5 && (
                               <span className="text-[8px] font-black text-slate-300">+{log.attendees.length - 5} MORE</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------ Attendance Drawer (Faculty UI Replication) ------ */}
      {attendanceDrawer.open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4 text-[10px]">
          <div
            className="flex h-full w-full max-w-md flex-col overflow-hidden p-6 border-none shadow-xl bg-white rounded-3xl animate-in slide-in-from-right duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Identity focal point */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-inner">
                  <FiUsers size={24} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">
                    Attendance Registry
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1.5">
                    {attendanceDrawer.log?.type} |{" "}
                    {formatDate(attendanceDrawer.log?.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setAttendanceDrawer({
                    open: false,
                    log: null,
                    groupMembers: [],
                    selected: [],
                  })
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all border border-slate-100"
              >
                <FiXCircle size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
              {/* Identity Details Card (Stats Matrix) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">
                    Protocol Node
                  </p>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                    {attendanceDrawer.log?.type}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                    Session Category
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">
                    Verification
                  </p>
                  <p className="text-xs font-black text-slate-800">
                    {attendanceDrawer.selected.length} /{" "}
                    {attendanceDrawer.groupMembers.length}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                    Assets Present
                  </p>
                </div>
              </div>

              {/* Objective Field */}
              {attendanceDrawer.log?.agenda && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiActivity className="text-slate-400" size={12} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Tactical Agenda
                    </h4>
                  </div>
                  <div className="bg-slate-50/30 p-4 border border-slate-100 rounded-2xl italic">
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                      "{attendanceDrawer.log.agenda}"
                    </p>
                  </div>
                </div>
              )}

              {/* Personnel List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiLayers className="text-slate-400" size={12} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Personnel Matrix
                    </h4>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={selectAll}
                      className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {attendanceDrawer.groupMembers.map((member) => {
                    const userId = String(member.user?._id || member.user);
                    const userName =
                      member.user?.name || member.name || "UNIDENTIFIED";
                    const isChecked =
                      attendanceDrawer.selected.includes(userId);

                    return (
                      <div
                        key={userId}
                        onClick={() => toggleMember(userId)}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-indigo-50/30 border-indigo-200 shadow-sm"
                            : "bg-white border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${
                              isChecked
                                ? "bg-indigo-100 border-indigo-200 text-indigo-600"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}
                          >
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p
                              className={`text-[11px] font-black tracking-tight ${isChecked ? "text-indigo-900" : "text-slate-700"}`}
                            >
                              {userName}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              Authenticated
                            </p>
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-md flex items-center justify-center transition-all border ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                              : "bg-white border-slate-200 text-transparent"
                          }`}
                        >
                          <FiCheck size={10} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Global Actions */}
              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={handleSaveAttendance}
                  disabled={actionStatus === "loading"}
                  className="w-full h-11 rounded-xl bg-slate-900 text-[11px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-200 flex items-center justify-center gap-3"
                >
                  {actionStatus === "loading" ? (
                    <FiActivity className="animate-spin" size={14} />
                  ) : (
                    <FiCheckCircle size={14} />
                  )}
                  {actionStatus === "loading"
                    ? "Syncing..."
                    : `Commit Registry [${attendanceDrawer.selected.length}]`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Summary Viewer Modal */}
      {summaryViewer.open && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                        <FiZap size={24} />
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">Intelligence Narrative</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1.5">{summaryViewer.logType}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setSummaryViewer({ open: false, summary: null, logType: '' })}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 text-slate-400"
                  >
                     <FiXCircle size={20} />
                  </button>
               </div>
               
               <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Executive Summary</h4>
                     <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        {summaryViewer.summary?.executiveSummary}
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Key Decisions</h4>
                        <div className="space-y-2">
                           {summaryViewer.summary?.keyDecisions?.map((d, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-[11px] font-medium">
                                 <FiCheckCircle className="shrink-0 mt-0.5 text-emerald-500" size={14} />
                                 {d}
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Focal Point</h4>
                        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100/50 relative overflow-hidden">
                           <FiCalendar className="absolute -bottom-2 -right-2 text-indigo-500/10" size={60} />
                           <p className="text-xs font-bold text-indigo-900 relative z-10">{summaryViewer.summary?.nextMeetingFocus}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Inventory</h4>
                     <div className="grid gap-3">
                        {summaryViewer.summary?.actionItems?.map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              <div className="flex items-center gap-4">
                                 <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                 <div>
                                    <p className="text-xs font-black text-slate-800">{item.item}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Assignee: {item.assignee || 'General'}</p>
                                 </div>
                              </div>
                              {item.deadline && (
                                 <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    {item.deadline}
                                 </span>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Generated by AI Assistant</p>
                  <button 
                    onClick={() => setSummaryViewer({ open: false, summary: null, logType: '' })}
                    className="h-10 px-6 rounded-xl bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                     Acknowledge & Close
                  </button>
               </div>
            </div>
         </div>
      )}
      {/* Protocol Edit Drawer */}
      {protocolDrawer.open && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4">
          <div
            className="flex h-full w-full max-w-lg flex-col overflow-hidden p-8 border-none shadow-2xl bg-white rounded-3xl animate-in slide-in-from-right duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <FiLayers size={24} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">
                    Refine Protocol
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
                    Strategic Data Alignment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProtocolDrawer((prev) => ({ ...prev, open: false }))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all border border-slate-100 focus:outline-none"
              >
                <FiXCircle size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Strategic Agenda
                </label>
                <textarea
                  rows={5}
                  value={protocolDrawer.agenda}
                  onChange={(e) =>
                    setProtocolDrawer((prev) => ({ ...prev, agenda: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all resize-none italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Tactical Discussion Points (One per line)
                </label>
                <textarea
                  rows={8}
                  value={protocolDrawer.discussionPoints}
                  onChange={(e) =>
                    setProtocolDrawer((prev) => ({
                      ...prev,
                      discussionPoints: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <button
                  onClick={() => handleSaveProtocol(false)}
                  disabled={actionStatus === "loading"}
                  className="h-12 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Save Protocol
                </button>
                <button
                  onClick={() => handleSaveProtocol(true)}
                  disabled={actionStatus === "loading"}
                  className="h-12 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  {actionStatus === "loading" ? (
                    <FiActivity className="animate-spin" size={14} />
                  ) : (
                    <FiZap size={14} />
                  )}
                  Summarize Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default TeacherMeetingsPage;
