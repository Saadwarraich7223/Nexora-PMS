import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
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
  FiEdit3,
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import studentApi from "../api/studentApi.js";
import StudentDetailDrawer from "../components/shared/StudentDetailDrawer.jsx";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import { HiSparkles } from "react-icons/hi";
import "../studentTheme.css";
import StatsCards from "../../admin/components/StatsCards.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
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

const isPast = (dateValue) => {
  if (!dateValue) return false;
  return new Date(dateValue).getTime() < Date.now();
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getMeetingTime = (meeting) => {
  const date = new Date(meeting?.date || meeting?.createdAt || 0);
  return date.getTime();
};

const StudentMeetingsPage = () => {
  const { user } = useSelector((state) => state.auth);

  const [meetings, setMeetings] = useState([]);
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [features, setFeatures] = useState([]);

  const [status, setStatus] = useState("idle");
  const [actionStatus, setActionStatus] = useState("idle");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [attendanceDraft, setAttendanceDraft] = useState([]);

  const [pendingLogs, setPendingLogs] = useState([]);
  const [pendingStatus, setPendingStatus] = useState("idle");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [activeTab, setActiveTab] = useState("upcoming");
  const [personaFilter, setPersonaFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [summaryViewer, setSummaryViewer] = useState({
    open: false,
    summary: null,
    logType: "",
  });

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: toDateTimeLocal(new Date()),
    location: "",
    agenda: "",
    discussionPoints: "",
    includeAllMembers: true,
    attendees: [],
  });
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [taskNotes, setTaskNotes] = useState({});
  const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);
  const [featureNotes, setFeatureNotes] = useState({});
  const [featureProgress, setFeatureProgress] = useState({});

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    date: "",
    location: "",
    agenda: "",
    discussionPoints: "",
  });

  const currentUserId = String(user?._id || "");

  const members = useMemo(() => {
    const raw = (group?.members || []).map((m) => m.user || m).filter(Boolean);
    const seen = new Set();
    return raw.filter((member) => {
      const id = String(member._id || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [group?.members]);

  const memberIds = useMemo(
    () => members.map((member) => String(member._id)),
    [members],
  );

  const isLeader = useMemo(() => {
    if (!group || !currentUserId) return false;
    return String(group.leader?._id || group.leader) === currentUserId;
  }, [group, currentUserId]);

  useEffect(() => {
    if (!createForm.includeAllMembers) return;
    setCreateForm((prev) => ({ ...prev, attendees: memberIds }));
  }, [createForm.includeAllMembers, memberIds]);

  const loadMeetingsWorkspace = async () => {
    setStatus("loading");
    try {
      const [meetingRes, groupRes, tasksRes, featuresRes] = await Promise.all([
        studentApi.fetchMeetings(),
        studentApi.fetchMyGroup(),
        studentApi.fetchTasks().catch(() => ({ tasks: [] })),
        studentApi.fetchFeatures().catch(() => ({ features: [] })),
      ]);

      setMeetings(meetingRes.logs || meetingRes.meetings || []);
      setGroup(groupRes.group || null);
      setTasks(tasksRes.tasks || []);
      setFeatures(featuresRes.features || []);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMeetings([]);
      setGroup(null);
      setTasks([]);
      setFeatures([]);
      showError(getErrorMessage(error, "Failed to load meeting logs."));
    }
  };

  const loadPending = async () => {
    if (!isLeader) return;
    setPendingStatus("loading");
    try {
      const data = await studentApi.fetchPendingAttendanceMeetings();
      setPendingLogs(data.logs || []);
      setPendingStatus("succeeded");
    } catch (error) {
      setPendingStatus("failed");
      setPendingLogs([]);
    }
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!active) return;
      await Promise.all([loadMeetingsWorkspace(), loadPending()]);
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isLeader]);

  useEffect(() => {
    if (!selectedMeeting) {
      setAttendanceDraft([]);
      return;
    }
    setAttendanceDraft(
      (selectedMeeting.attendees || []).map((member) =>
        String(member?._id || member),
      ),
    );
  }, [selectedMeeting]);

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter((item) => {
        if (personaFilter === "all") return true;

        // Supervisor Meeting Filter
        if (personaFilter === "supervisor") {
          return String(item.type || "")
            .toLowerCase()
            .includes("supervisor");
        }

        // Leader (Team) Meeting Filter - meetings created by user (implied as leader) or not supervisor
        if (personaFilter === "leader") {
          return !String(item.type || "")
            .toLowerCase()
            .includes("supervisor");
        }

        return true;
      })
      .filter((item) => {
        if (!search.trim()) return true;
        const haystack =
          `${item.agenda || ""} ${item.location || ""} ${item.type || ""}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => getMeetingTime(b) - getMeetingTime(a));
  }, [meetings, personaFilter, search]);

  const segments = useMemo(() => {
    const now = Date.now();
    const filtered = filteredMeetings;

    const upcoming = filtered.filter((log) => getMeetingTime(log) >= now);

    // Attention: Past meetings where the student is the creator (leader) but no attendance
    const attention = filtered.filter((log) => {
      const isPast = getMeetingTime(log) < now;
      const createdByMe =
        String(log.createdBy?._id || log.createdBy) === currentUserId;
      const noAttendance = (log.attendees || []).length === 0;
      return isPast && createdByMe && noAttendance;
    });

    const completed = filtered.filter((log) => {
      const isPast = getMeetingTime(log) < now;
      const hasAttendance = (log.attendees || []).length > 0;
      const createdByOthers =
        String(log.createdBy?._id || log.createdBy) !== currentUserId;

      // It's completed if it's past AND (has attendance OR student didn't create it so they don't need to "sync" it)
      return isPast && (hasAttendance || createdByOthers);
    });

    return { upcoming, attention, completed };
  }, [filteredMeetings, currentUserId]);

  const stats = useMemo(() => {
    return [
      {
        label: "Upcoming Missions",
        value: segments.upcoming.length,
        sub: "Future Sessions",
      },
      {
        label: "Needs Sync",
        value: segments.attention.length,
        sub: "Action Required",
      },
      {
        label: "Archived Logs",
        value: segments.completed.length,
        sub: "Completed Nodes",
      },
      {
        label: "Global Registry",
        value: meetings.length,
        sub: "Total Datapoints",
      },
    ];
  }, [segments, meetings]);

  const selectedMeetingIsPast = useMemo(() => {
    if (!selectedMeeting) return false;
    return getMeetingTime(selectedMeeting) < Date.now();
  }, [selectedMeeting]);

  const selectedMeetingAttendeeIds = useMemo(
    () => (selectedMeeting?.attendees || []).map((m) => String(m?._id || m)),
    [selectedMeeting],
  );

  const presentMembers = useMemo(
    () =>
      members.filter((member) =>
        selectedMeetingAttendeeIds.includes(String(member._id)),
      ),
    [members, selectedMeetingAttendeeIds],
  );

  const absentMembers = useMemo(
    () =>
      members.filter(
        (member) => !selectedMeetingAttendeeIds.includes(String(member._id)),
      ),
    [members, selectedMeetingAttendeeIds],
  );

  const runAction = async (action, successText, fallbackText) => {
    setActionStatus("loading");
    try {
      await action();
      await loadMeetingsWorkspace();
      setActionStatus("succeeded");
      if (successText) showSuccess(successText);
      return true;
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, fallbackText));
      return false;
    }
  };

  const handleAISummarize = async () => {
    if (!createForm.discussionPoints.trim()) {
      showError("Please enter some raw discussion points first.");
      return;
    }

    setIsSummarizing(true);
    try {
      const discussionArray = createForm.discussionPoints
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const agenda = createForm.agenda;
      const date = createForm.date;
      
      const result = await studentApi.generateAIMeetingSummary(
        discussionArray,
        agenda,
        date
      );

      if (!result || !result.summary) {
        showError("AI could not generate a summary.");
        setIsSummarizing(false);
        return;
      }

      setCreateForm((prev) => ({
        ...prev,
        discussionPoints: result.summary,
      }));

      const suggestedTasks = result.actionItems || result.suggestedTasks || [];
      const suggestedCount = suggestedTasks.length;

      if (suggestedCount > 0) {
        const createdIds = [];
        for (const t of suggestedTasks) {
          try {
            // Robust mapping for task title and description
            const taskTitle = t.title || t.item || "Strategic Action Item";
            const taskDesc = t.description || `Auto-generated from meeting: ${agenda || "Untitled Sync"}`;

            const v = String(t.priority || "medium").toLowerCase();
            const priorityVal = ["high", "medium", "low"].includes(v)
              ? v
              : "medium";

            const created = await studentApi.createTask({
              title: taskTitle,
              description: taskDesc,
              priority: priorityVal,
            });

            if (created && created.task) {
              createdIds.push(String(created.task._id));
            }
          } catch (e) {
            console.error("Failed to auto-create task:", e);
          }
        }

        if (createdIds.length > 0) {
          await loadMeetingsWorkspace();
          setSelectedTaskIds((prev) => [...prev, ...createdIds]);
          showSuccess(
            `Meeting summarized! AI also created and linked ${createdIds.length} tasks from action items.`,
          );
        } else {
          showSuccess("Meeting summarized!");
        }
      } else {
        showSuccess("Meeting summarized!");
      }
    } catch (e) {
      showError(getErrorMessage(e, "Failed to summarize meeting using AI."));
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();

    if (!isLeader) {
      showError("Only the group leader can create team meetings.");
      return;
    }

    if (!createForm.date) {
      showError("Meeting date and time are required.");
      return;
    }

    const taskUpdates = selectedTaskIds.map((taskId) => ({
      task: taskId,
      note: taskNotes[taskId]?.trim() || undefined,
    }));

    const featureUpdates = selectedFeatureIds.map((featureId) => ({
      feature: featureId,
      note: featureNotes[featureId]?.trim() || undefined,
      progress:
        featureProgress[featureId] === "" ||
        featureProgress[featureId] === undefined
          ? undefined
          : Number(featureProgress[featureId]),
    }));

    const success = await runAction(
      () =>
        studentApi.createMeeting({
          date: new Date(createForm.date).toISOString(),
          location: createForm.location.trim() || undefined,
          agenda: createForm.agenda.trim() || undefined,
          discussionPoints: createForm.discussionPoints
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          includeAllMembers: createForm.includeAllMembers,
          attendees: createForm.includeAllMembers ? [] : createForm.attendees,
          taskUpdates,
          featureUpdates,
        }),
      "Team meeting created.",
      "Failed to create meeting.",
    );

    if (!success) return;

    setCreateDrawerOpen(false);
    setCreateForm({
      date: toDateTimeLocal(new Date()),
      location: "",
      agenda: "",
      discussionPoints: "",
      includeAllMembers: true,
      attendees: memberIds,
    });
    setSelectedTaskIds([]);
    setTaskNotes({});
    setSelectedFeatureIds([]);
    setFeatureNotes({});
    setFeatureProgress({});
  };

  const handleEditOpen = (meeting) => {
    setEditForm({
      id: meeting._id,
      date: toDateTimeLocal(meeting.date || meeting.createdAt),
      location: meeting.location || "",
      agenda: meeting.agenda || "",
      discussionPoints: (meeting.discussionPoints || []).join("\n"),
    });
    setEditDrawerOpen(true);
    setSelectedMeeting(null);
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    if (!editForm.date) {
      showError("Meeting date and time are required.");
      return;
    }
    const success = await runAction(
      () =>
        studentApi.updateMeeting(editForm.id, {
          date: new Date(editForm.date).toISOString(),
          location: editForm.location.trim() || undefined,
          agenda: editForm.agenda.trim() || undefined,
          discussionPoints: editForm.discussionPoints
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      "Meeting updated.",
      "Failed to update meeting.",
    );
    if (success) setEditDrawerOpen(false);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to delete this meeting?"))
      return;
    const success = await runAction(
      () => studentApi.deleteMeeting(meetingId),
      "Meeting deleted.",
      "Failed to delete meeting.",
    );
    if (success && selectedMeeting?._id === meetingId) {
      setSelectedMeeting(null);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedMeeting?._id) return;

    const success = await runAction(
      () =>
        studentApi.markMeetingAttendance(selectedMeeting._id, attendanceDraft),
      "Attendance updated.",
      "Failed to update attendance.",
    );

    if (!success) return;

    setSelectedMeeting((prev) =>
      prev
        ? {
            ...prev,
            attendees: members.filter((m) =>
              attendanceDraft.includes(String(m._id)),
            ),
          }
        : prev,
    );
    loadPending();
  };

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        {/* Standardized Orchestrator Header */}
        <StudentPageHeader
          protocolName="Meeting_Command_v3.2"
          title="Meeting Command"
          subtitle="Strategic Cohort & Session Intelligence"
          groupName={group?.name}
          rightSide={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="FILTER_SESSION_REGISTRY..."
                  className="h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all w-full md:w-64 shadow-sm"
                />
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 shadow-inner">
                {[
                  { id: "all", label: "Global" },
                  { id: "leader", label: "By Leader" },
                  { id: "supervisor", label: "By Supervisor" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPersonaFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      personaFilter === f.id
                        ? "bg-white text-indigo-600 shadow-sm border border-indigo-100/50"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {/* Strategy Layer (KPIs) */}
        <StatsCards
          stats={stats}
          status={status === "loading" ? "loading" : "succeeded"}
        />

        {/* Pending Attendance Reminder with Loading State */}
        {status === "loading" && pendingLogs.length === 0 ? (
          <div className="h-24 rounded-2xl bg-white border border-slate-100 animate-pulse" />
        ) : (
          isLeader &&
          pendingLogs.length > 0 && (
            <div className="bg-amber-100/50 backdrop-blur-md border border-amber-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                <FiZap size={80} className="text-amber-600" />
              </div>
              <div className="flex items-start gap-5 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-center shrink-0">
                  <FiAlertCircle className="text-amber-600" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none text-amber-700">
                    Sync Threshold Detected
                  </h2>
                  <p className="text-[10px] font-bold text-amber-900/60 uppercase tracking-tight mt-2 pb-2">
                    {pendingLogs.length} Meeting sessions require manual
                    presence synchronization to finalize group telemetry.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {pendingLogs.map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/80 border border-amber-200/50 p-3.5 transition-all hover:shadow-lg hover:shadow-amber-500/5 group/alert"
                      >
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">
                            {formatDate(log.date)}
                          </span>
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">
                            {log.type}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedMeeting(log)}
                          className="h-8 px-4 rounded-xl bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/10 active:scale-95 flex items-center gap-2"
                        >
                          SYNC
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        <div className="flex flex-col xl:flex-row gap-6 items-start w-full min-w-0">
          {/* Create Meeting Log (Sidebar Form) */}
          <div className="w-full xl:w-[450px] shrink-0 space-y-6">
            <div
              className={`bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 space-y-6 transition-opacity ${!isLeader ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
                  {isLeader ? "Schedule Session" : "Schedule Restricted"}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-70">
                  {isLeader
                    ? "Initialize new meeting telemetry for the target cohort."
                    : "Only group leaders can initialize new meeting tokens."}
                </p>
              </div>

              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <input
                      type="datetime-local"
                      value={createForm.date}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all font-mono"
                      disabled={!isLeader || actionStatus === "loading"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Session Protocol
                    </label>
                    <select
                      value={createForm.type || "Team Meeting"}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all font-mono"
                      disabled={!isLeader || actionStatus === "loading"}
                    >
                      <option value="Supervisor Meeting">
                        SUPERVISOR_SYNC
                      </option>
                      <option value="Team Meeting">TEAM_SCRUM</option>
                      <option value="Demo">TACTICAL_DEMO</option>
                      <option value="Other">OTHER_PROTOCOL</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Geographic/Digital Node
                  </label>
                  <input
                    value={createForm.location}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="e.g. Lab 4B, Zoom Node 1..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all placeholder:text-slate-300 shadow-sm"
                    disabled={!isLeader || actionStatus === "loading"}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Strategic Agenda
                  </label>
                  <textarea
                    rows={2}
                    value={createForm.agenda}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        agenda: e.target.value,
                      }))
                    }
                    placeholder="Draft the primary objective for this session..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all placeholder:text-slate-300 resize-none shadow-sm"
                    disabled={!isLeader || actionStatus === "loading"}
                  />
                </div>

                <div className="space-y-2 bg-slate-50/50 rounded-2xl border border-slate-200/40 p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <label className="ml-1">
                      Tactical Points (One per line)
                    </label>
                    <button
                      type="button"
                      onClick={handleAISummarize}
                      disabled={
                        !isLeader ||
                        actionStatus === "loading" ||
                        isSummarizing ||
                        !createForm.discussionPoints?.trim()
                      }
                      className="group/ai relative flex items-center gap-2 pr-4 pl-1.5 py-1.5 rounded-full bg-indigo-50/50 border border-indigo-100 hover:bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all disabled:opacity-50 active:scale-95"
                    >
                      <div
                        className={`h-6 w-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 transition-transform group-hover/ai:rotate-12 ${isSummarizing ? "animate-spin" : ""}`}
                      >
                        <HiSparkles size={12} />
                      </div>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.15em]">
                        {isSummarizing ? "Synthesizing..." : "AI_STRATEGY"}
                      </span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={createForm.discussionPoints}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        discussionPoints: e.target.value,
                      }))
                    }
                    placeholder="Node 1: Implementation verification..."
                    className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all placeholder:text-slate-300 resize-none shadow-sm"
                    disabled={
                      !isLeader || actionStatus === "loading" || isSummarizing
                    }
                  />
                </div>

                {/* Linked Assets Registry - NEW SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Asset Synergy Index
                    </span>
                    <FiLayers className="text-slate-200" size={14} />
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                    {/* Tasks */}
                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        Tactical Tasks
                      </span>
                      {tasks.map((task) => {
                        const taskId = String(task._id);
                        const isSelected = selectedTaskIds.includes(taskId);
                        return (
                          <div
                            key={taskId}
                            className={`p-2 rounded-xl border transition-all ${isSelected ? "bg-white border-indigo-200 shadow-sm" : "border-transparent hover:bg-white/40"}`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedTaskIds((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== taskId)
                                      : [...prev, taskId],
                                  )
                                }
                                className="w-3.5 h-3.5 rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                              />
                              <span
                                className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? "text-slate-800" : "text-slate-400"}`}
                              >
                                {task.title}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    {/* Features */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-amber-500" />
                        Feature Registry
                      </span>
                      {features.map((f) => {
                        const fId = String(f._id);
                        const isSelected = selectedFeatureIds.includes(fId);
                        return (
                          <div
                            key={fId}
                            className={`p-2 rounded-xl border transition-all ${isSelected ? "bg-white border-indigo-200 shadow-sm" : "border-transparent hover:bg-white/40"}`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedFeatureIds((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== fId)
                                      : [...prev, fId],
                                  )
                                }
                                className="w-3.5 h-3.5 rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                              />
                              <span
                                className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? "text-slate-800" : "text-slate-400"}`}
                              >
                                {f.name}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    !isLeader || actionStatus === "loading" || isSummarizing
                  }
                  className="h-12 w-full rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {actionStatus === "loading" ? (
                    <FiActivity className="animate-spin text-indigo-400" />
                  ) : (
                    <FiCalendar className="text-white/60" />
                  )}
                  {actionStatus === "loading"
                    ? "INITIALIZING..."
                    : "Initialize Session Log"}
                </button>
              </form>
            </div>
          </div>

          {/* Meeting History (Main Registry) */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            <div className="bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 space-y-6 min-h-[600px]">
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
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeTab === "upcoming"
                        ? "bg-indigo-500"
                        : activeTab === "attention"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  ></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {segments[activeTab]?.length || 0} Entries Detected
                  </span>
                </div>
              </div>

              <div className="grid gap-4 max-h-[1000px] overflow-y-auto pr-1 custom-scrollbar">
                {status === "loading" ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-32 rounded-2xl bg-white border border-slate-100 animate-pulse flex items-center p-4 gap-4"
                      >
                        <div className="h-10 w-10 rounded-2xl bg-slate-50" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/3 bg-slate-50 rounded" />
                          <div className="h-3 w-1/2 bg-slate-50 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : segments[activeTab].length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                      <FiInfo className="text-slate-300" size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Zero Data Points Found in this Sector
                    </p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight mt-2 text-center max-w-xs">
                      No sessions detected for the selected tactical filter.
                    </p>
                  </div>
                ) : (
                  segments[activeTab].map((log) => {
                    const meetingPast = isPast(log.date);
                    const attendeesCount = Array.isArray(log.attendees)
                      ? log.attendees.length
                      : 0;
                    const totalMembers = members.length;
                    const hasAttendance = attendeesCount > 0;

                    return (
                      <div
                        key={log._id}
                        className="group/item flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover/item:opacity-[0.05] transition-opacity">
                          <FiCalendar size={40} className="text-slate-900" />
                        </div>

                        <div
                          className={`h-11 w-11 shrink-0 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                            meetingPast
                              ? "bg-slate-50 border-slate-100 text-slate-400 group-hover/item:text-slate-500 group-hover/item:border-slate-200"
                              : "bg-indigo-50 border-indigo-100 text-indigo-500 shadow-sm group-hover/item:bg-indigo-100"
                          }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-70">
                            {new Date(log.date).toLocaleString("default", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-[14px] font-black leading-none opacity-90">
                            {new Date(log.date).getDate()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 relative z-10">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate">
                                  {log.type}
                                </h3>
                                {meetingPast ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                                      hasAttendance
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                    }`}
                                  >
                                    {hasAttendance ? (
                                      <FiCheck size={10} />
                                    ) : (
                                      <FiAlertCircle size={10} />
                                    )}
                                    {hasAttendance
                                      ? "Verified"
                                      : "Sync Required"}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1.5 shadow-sm">
                                    <FiClock size={10} />{" "}
                                    {getDaysRemaining(log.date)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span className="flex items-center gap-2 text-indigo-600">
                                  <FiCalendar
                                    size={12}
                                    className="opacity-80"
                                  />
                                  {getDayName(log.date)},{" "}
                                  {new Date(log.date).toLocaleDateString()}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-2">
                                  <FiClock size={12} className="opacity-60" />{" "}
                                  {new Date(log.date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {meetingPast && isLeader && (
                                <button
                                  onClick={() => setSelectedMeeting(log)}
                                  className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-900 text-[9px] font-black text-white uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                                >
                                  <FiUsers size={12} />
                                  {hasAttendance ? "RE-SYNC" : "SYNC NOW"}
                                </button>
                              )}
                              {!meetingPast && isLeader && (
                                <button
                                  onClick={() => handleEditOpen(log)}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 transition-all border border-slate-100 active:scale-90"
                                >
                                  <FiEdit3 size={13} />
                                </button>
                              )}
                              {isLeader && (
                                <button
                                  onClick={() => handleDeleteMeeting(log._id)}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all border border-rose-100 active:scale-90"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-3 line-clamp-2">
                            {log.agenda ||
                              "No agenda objectives defined for this session."}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 border-t border-slate-50 pt-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                Presence Index
                              </span>
                              <span
                                className={`text-[10px] font-black tabular-nums ${hasAttendance ? "text-indigo-600" : "text-amber-600 opacity-50"}`}
                              >
                                {attendeesCount} / {totalMembers}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                Linked Assets
                              </span>
                              <span className="text-[10px] font-black text-slate-600 tabular-nums">
                                {(log.taskUpdates?.length || 0) +
                                  (log.featureUpdates?.length || 0)}
                              </span>
                            </div>
                            {log.aiSummary?.executiveSummary && (
                              <>
                                <div className="w-px h-2.5 bg-slate-100" />
                                <button
                                  onClick={() =>
                                    setSummaryViewer({
                                      open: true,
                                      summary: log.aiSummary,
                                      logType: log.type,
                                    })
                                  }
                                  className="flex items-center gap-1.5 group/intel"
                                >
                                  <div className="h-4 w-4 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover/intel:bg-indigo-600 group-hover/intel:text-white transition-all">
                                    <FiZap size={10} />
                                  </div>
                                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest group-hover/intel:underline">
                                    View Intelligence Narrative
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance / Sync Drawer */}
      <StudentDetailDrawer
        open={Boolean(selectedMeeting)}
        onClose={() => setSelectedMeeting(null)}
        title={selectedMeeting?.type || "Session Intelligence"}
        subtitle={selectedMeeting ? formatDate(selectedMeeting.date) : ""}
      >
        <div className="space-y-6 pb-20">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Session Protocol
              </span>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <FiLayers size={14} className="text-indigo-500" />
                {selectedMeeting?.type}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Temporal Node
              </span>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <FiClock size={14} className="text-emerald-500" />
                {new Date(selectedMeeting?.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center justify-between">
                Presence Synchronization
                <span className="text-indigo-600 font-mono">
                  {attendanceDraft.length} / {members.length}
                </span>
              </h4>
              <div className="grid gap-2">
                {members.map((member) => {
                  const mId = String(member._id);
                  const isPresent = attendanceDraft.includes(mId);
                  return (
                    <label
                      key={mId}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isPresent
                          ? "bg-indigo-50 border-indigo-200 outline outline-4 outline-indigo-500/5"
                          : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black ${isPresent ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white text-slate-400 border border-slate-100"}`}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <span
                          className={`text-[11px] font-black ${isPresent ? "text-indigo-900" : "text-slate-500"}`}
                        >
                          {member.name}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isPresent}
                        onChange={() =>
                          setAttendanceDraft((prev) =>
                            isPresent
                              ? prev.filter((id) => id !== mId)
                              : [...prev, mId],
                          )
                        }
                        className="w-4 h-4 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                        disabled={actionStatus === "loading"}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Linked Strategic Objectives
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedMeeting?.taskUpdates?.length > 0 ? (
                  selectedMeeting.taskUpdates.map((t, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <FiCheck size={10} /> {t.taskTitle || "Task Update"}
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight italic">
                    No tasks linked.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3">
            <button
              onClick={handleSaveAttendance}
              disabled={actionStatus === "loading"}
              className="flex-1 h-12 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <FiCheck className="text-emerald-400" />
              {actionStatus === "loading"
                ? "SYNCING..."
                : "COMMIT_SYNCHRONIZATION"}
            </button>
            <button
              onClick={() => setSelectedMeeting(null)}
              className="h-12 px-6 rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      </StudentDetailDrawer>

      {/* Edit Drawer */}
      <StudentDetailDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title="Override Session Node"
        subtitle="Operational parameter adjustments"
      >
        <form onSubmit={handleUpdateMeeting} className="space-y-6 pb-20">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Temporal Node
            </label>
            <input
              type="datetime-local"
              value={editForm.date}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Geographic/Digital Node
            </label>
            <input
              value={editForm.location}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Update node location..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Strategic Agenda
            </label>
            <textarea
              rows={3}
              value={editForm.agenda}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, agenda: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all resize-none shadow-sm"
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3">
            <button
              type="submit"
              disabled={actionStatus === "loading"}
              className="flex-1 h-12 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <FiCheck className="text-indigo-400" />
              {actionStatus === "loading" ? "UPDATING..." : "COMMIT_OVERRIDE"}
            </button>
            <button
              type="button"
              onClick={() => setEditDrawerOpen(false)}
              className="h-12 px-6 rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              ABORT
            </button>
          </div>
        </form>
      </StudentDetailDrawer>
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
                  <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                    Intelligence Narrative
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1.5">
                    {summaryViewer.logType}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSummaryViewer({ open: false, summary: null, logType: "" })
                }
                className="p-2 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 text-slate-400"
              >
                <FiXCircle size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Executive Summary
                </h4>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {summaryViewer.summary?.executiveSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Key Decisions
                  </h4>
                  <div className="space-y-2">
                    {summaryViewer.summary?.keyDecisions?.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-[11px] font-medium"
                      >
                        <FiCheckCircle
                          size={14}
                          className="shrink-0 mt-0.5 text-emerald-500"
                        />
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Next Focal Point
                  </h4>
                  <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100/50 relative overflow-hidden">
                    <FiCalendar
                      className="absolute -bottom-2 -right-2 text-indigo-500/10"
                      size={60}
                    />
                    <p className="text-xs font-bold text-indigo-900 relative z-10">
                      {summaryViewer.summary?.nextMeetingFocus}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Action Inventory
                </h4>
                <div className="grid gap-3">
                  {summaryViewer.summary?.actionItems?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            {item.item}
                          </p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Assignee: {item.assignee || "General"}
                          </p>
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
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">
                Generated by Llama-3.3-70b Strategic Brain
              </p>
              <button
                onClick={() =>
                  setSummaryViewer({ open: false, summary: null, logType: "" })
                }
                className="h-10 px-6 rounded-xl bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default StudentMeetingsPage;
