import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiUsers,
  FiClipboard,
  FiCalendar,
  FiClock,
  FiFileText,
  FiArrowRight,
  FiLayers,
  FiZap,
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import AnnouncementsPanel from "../../../components/ui/AnnouncementsPanel.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import StudentDetailDrawer from "../../student/components/shared/StudentDetailDrawer.jsx";
import notificationApi from "../../../services/api/notificationApi.js";
import teacherApi from "../api/teacherApi.js";
import {
  fetchTeacherWorkspace,
  fetchAtRiskGroups,
} from "../slices/teacherSlice.js";
import SupervisorAtRiskPanel from "../components/SupervisorAtRiskPanel.jsx";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import getErrorMessage from "../../../utils/error.js";
import { showError } from "../../../components/ui/toast.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import "../teacherTheme.css";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groups, projects, atRiskGroups, atRiskStatus, status } = useSelector(
    (state) => state.teacher,
  );
  const { user } = useSelector((state) => state.auth);

  const [announcements, setAnnouncements] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [meetingsStatus, setMeetingsStatus] = useState("idle");

  const [groupDrawer, setGroupDrawer] = useState({
    open: false,
    loading: false,
    group: null,
    project: null,
    files: [],
  });
  const [projectDrawer, setProjectDrawer] = useState({
    open: false,
    loading: false,
    project: null,
    feedback: [],
  });
  const [meetingDrawer, setMeetingDrawer] = useState({
    open: false,
    meeting: null,
  });

  useEffect(() => {
    dispatch(fetchTeacherWorkspace())
      .unwrap()
      .catch((err) =>
        showError(getErrorMessage(err, "Failed to load teacher dashboard.")),
      );
    dispatch(fetchAtRiskGroups());
  }, [dispatch]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await notificationApi.fetchNotifications();
        const list = data.notifications || [];
        setAnnouncements(list.filter((item) => item.type === "announcement"));
      } catch (error) {
        showError(getErrorMessage(error, "Failed to load announcements."));
      }
    };

    loadAnnouncements();
  }, []);

  useEffect(() => {
    const loadUpcomingMeetings = async () => {
      if (groups.length === 0) {
        setUpcomingMeetings([]);
        setMeetingsStatus("succeeded");
        return;
      }

      setMeetingsStatus("loading");
      try {
        const settled = await Promise.allSettled(
          groups.map((group) => teacherApi.fetchGroupMeetings(group._id)),
        );

        const now = Date.now();
        const merged = [];

        settled.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const group = groups[index];
          const logs = result.value.logs || [];

          logs.forEach((log) => {
            const when = new Date(log.date || log.createdAt).getTime();
            if (Number.isNaN(when) || when < now) return;
            merged.push({ ...log, groupName: group?.name || "Group" });
          });
        });

        merged.sort(
          (a, b) =>
            new Date(a.date || a.createdAt).getTime() -
            new Date(b.date || b.createdAt).getTime(),
        );

        setUpcomingMeetings(merged);
        setMeetingsStatus("succeeded");
      } catch (error) {
        setMeetingsStatus("failed");
        setUpcomingMeetings([]);
        showError(getErrorMessage(error, "Failed to load upcoming meetings."));
      }
    };

    loadUpcomingMeetings();
  }, [groups]);

  const teacherStats = useMemo(() => {
    const maxCapacity = Number(user?.supervisorCapacity ?? 0);
    const assignedGroups = groups.length;
    const remainingCapacity =
      maxCapacity > 0 ? Math.max(0, maxCapacity - assignedGroups) : null;

    return [
      {
        label: "Supervised Groups",
        value: assignedGroups,
        sub: "/ Managed Cohorts",
        icon: <FiUsers />,
      },
      {
        label: "Proposal Queue",
        value: projects.length,
        sub: "Pending Review",
        icon: <FiFileText />,
      },
      {
        label: "Upcoming Agenda",
        value: upcomingMeetings.length,
        sub: "Scheduled Sessions",
        icon: <FiCalendar />,
      },
      {
        label: "Supervisor Load",
        value:
          maxCapacity > 0
            ? `${assignedGroups}/${maxCapacity}`
            : `${assignedGroups}`,
        sub:
          maxCapacity > 0 ? `${remainingCapacity} slots free` : "Limit not set",
        icon: <FiLayers />,
      },
    ];
  }, [groups, projects, upcomingMeetings, user?.supervisorCapacity]);

  const capacityMeta = useMemo(() => {
    const assigned = groups.length;
    const max = Number(user?.supervisorCapacity ?? 0);
    const remaining = max > 0 ? Math.max(0, max - assigned) : null;
    const percent =
      max > 0 ? Math.min(100, Math.round((assigned / max) * 100)) : 0;
    return { assigned, max, remaining, percent };
  }, [groups.length, user?.supervisorCapacity]);

  const handleOpenGroup = async (group) => {
    setGroupDrawer({
      open: true,
      loading: true,
      group: null,
      project: null,
      files: [],
    });
    try {
      const [detailsRes, filesRes] = await Promise.all([
        teacherApi.fetchGroupDetails(group._id),
        teacherApi.fetchGroupResources(group._id),
      ]);
      setGroupDrawer({
        open: true,
        loading: false,
        group: detailsRes.data?.group || group,
        project: detailsRes.data?.project || null,
        files: filesRes.files || [],
      });
    } catch (error) {
      showError(getErrorMessage(error, "Failed to load group details."));
      setGroupDrawer({
        open: true,
        loading: false,
        group,
        project: null,
        files: [],
      });
    }
  };

  const handleOpenProject = async (project) => {
    setProjectDrawer({ open: true, loading: true, project, feedback: [] });
    try {
      const feedbackRes = await teacherApi.fetchProjectFeedback(project._id);
      setProjectDrawer({
        open: true,
        loading: false,
        project,
        feedback: feedbackRes.feedback || [],
      });
    } catch {
      setProjectDrawer({ open: true, loading: false, project, feedback: [] });
    }
  };

  const toolkitMatrix = [
    {
      title: "Active Cohorts",
      subtitle: "Manage assigned groups",
      path: "/teacher/groups",
      icon: <FiUsers className="h-4 w-4" />,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      title: "Review Queue",
      subtitle: "Evaluate project proposals",
      path: "/teacher/projects",
      icon: <FiFileText className="h-4 w-4" />,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      title: "Agenda Master",
      subtitle: "Monitor all schedule sessions",
      path: "/teacher/meetings",
      icon: <FiCalendar className="h-4 w-4" />,
      color: "text-sky-500",
      bg: "bg-sky-50",
    },
    {
      title: "Strategic Deadlines",
      subtitle: "Set academic milestones",
      path: "/teacher/deadlines",
      icon: <FiClipboard className="h-4 w-4" />,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
  ];

  return (
    <DashboardShell>
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          Welcome back,{" "}
          <span className="text-indigo-600">{user.name || "Scholar"}</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Academic Oversight & Portfolio Management
        </p>
      </div>

      <div className="space-y-6">
        {/* KPI Layer */}
        <StatsCards
          stats={teacherStats}
          status={status === "loading" ? "loading" : "succeeded"}
        />

        {/* At-Risk Insight Layer */}
        <SupervisorAtRiskPanel
          atRiskGroups={atRiskGroups}
          atRiskStatus={atRiskStatus}
        />

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            {/* Toolkit Matrix */}
            <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                  Toolkit Matrix
                </h2>
              </div>
              <div className="p-6 grid gap-3 md:grid-cols-2">
                {toolkitMatrix.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="p-4 rounded-2xl bg-white border border-slate-100 hove:border-indigo-200 transition-all group shadow-sm flex items-start gap-4"
                  >
                    <div
                      className={`h-10 w-10 shrink-0 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        {item.title}{" "}
                        <FiArrowRight className="h-3 w-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Active Cohorts Registry */}
              <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                    Active Cohorts
                  </h2>
                  <button
                    onClick={() => navigate("/teacher/groups")}
                    className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    Master Registry
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  {status === "loading" && (
                    <LoadingSkeleton className="h-32 rounded-2xl" />
                  )}
                  {groups.slice(0, 4).map((group) => (
                    <button
                      key={group._id}
                      onClick={() => handleOpenGroup(group)}
                      className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                          {group.name}
                        </p>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                          {group.status || "active"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {group.department} | S{group.semester}
                      </p>
                    </button>
                  ))}
                  {status !== "loading" && groups.length === 0 && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-8 text-center italic">
                      No active cohorts
                    </p>
                  )}
                </div>
              </div>

              {/* Review Queue */}
              <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                    Review Queue
                  </h2>
                  <button
                    onClick={() => navigate("/teacher/projects")}
                    className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    Queue Master
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  {status === "loading" && (
                    <LoadingSkeleton className="h-32 rounded-2xl" />
                  )}
                  {projects.slice(0, 4).map((project) => (
                    <button
                      key={project._id}
                      onClick={() => handleOpenProject(project)}
                      className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-all text-left shadow-sm group"
                    >
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                        {project.title}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {project.group?.name || "Unknown group"}
                      </p>
                    </button>
                  ))}
                  {status !== "loading" && projects.length === 0 && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-8 text-center italic">
                      Queue is clear
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Live Agenda */}
            <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                  Live Agenda
                </h2>
                <button
                  onClick={() => navigate("/teacher/meetings")}
                  className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  Full Schedule
                </button>
              </div>

              <div className="p-6 space-y-3">
                {meetingsStatus === "loading" && (
                  <LoadingSkeleton className="h-40 rounded-3xl" />
                )}

                {upcomingMeetings.slice(0, 4).map((meeting) => {
                  const meetingDate = new Date(
                    meeting.date || meeting.createdAt,
                  );
                  const today = new Date();
                  const startOfToday = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                  ).getTime();
                  const startOfMeetingDay = new Date(
                    meetingDate.getFullYear(),
                    meetingDate.getMonth(),
                    meetingDate.getDate(),
                  ).getTime();
                  const daysRemaining = Math.max(
                    0,
                    Math.round((startOfMeetingDay - startOfToday) / 86400000),
                  );

                  let toneClass = "bg-slate-50 border-slate-100";
                  let badgeClass = "bg-slate-100 text-slate-600";
                  let badgeText = `In ${daysRemaining} days`;

                  if (daysRemaining === 0) {
                    toneClass =
                      "bg-indigo-50 border-indigo-100 shadow-indigo-100/20";
                    badgeClass = "bg-indigo-100 text-indigo-600";
                    badgeText = "Today";
                  } else if (daysRemaining === 1) {
                    toneClass =
                      "bg-emerald-50 border-emerald-100 shadow-emerald-100/20";
                    badgeClass = "bg-emerald-100 text-emerald-600";
                    badgeText = "Tomorrow";
                  }

                  return (
                    <button
                      key={meeting._id}
                      onClick={() => setMeetingDrawer({ open: true, meeting })}
                      className={`w-full p-4 rounded-2xl border transition-all text-left shadow-sm flex items-start gap-4 hover:scale-[1.01] ${toneClass}`}
                    >
                      <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 bg-white rounded-xl shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {meetingDate.toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          {meetingDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                            {meeting.type || "Academic Sync"}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${badgeClass}`}
                          >
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                          {meeting.agenda || "General project review"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <FiClock size={10} />{" "}
                            {meetingDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                            {meeting.groupName}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {meetingsStatus !== "loading" &&
                  upcomingMeetings.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center">
                      <div className="h-12 w-12 mb-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                        <FiCalendar size={24} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                        Clear Agenda
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <AnnouncementsPanel items={announcements.slice(0, 5)} />

            {/* Strategic Performance Panel */}
            <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                  <FiZap size={14} />
                </div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                  Performance Pulse
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm transition-all hover:border-indigo-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Portfolio Intensity
                    </p>
                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                      {groups.length > 0
                        ? `${Math.round((projects.length / groups.length) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm transition-all hover:border-emerald-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Agenda Density
                    </p>
                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                      {groups.length > 0
                        ? `${Math.min(100, Math.round((upcomingMeetings.length / groups.length) * 100))}%`
                        : "0%"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                      Supervisor Capacity
                    </p>
                    <span className="text-[11px] font-black text-indigo-600">
                      {capacityMeta.percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${capacityMeta.percent}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {capacityMeta.assigned} / {capacityMeta.max || "..."}{" "}
                      Assigned
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      {capacityMeta.remaining} Units Available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers retain structural layout but match new aesthetic */}
      <StudentDetailDrawer
        open={groupDrawer.open}
        onClose={() =>
          setGroupDrawer({
            open: false,
            loading: false,
            group: null,
            project: null,
            files: [],
          })
        }
        title={groupDrawer.group?.name || "Group Detail"}
        subtitle={
          groupDrawer.group
            ? `${groupDrawer.group.department} | S${groupDrawer.group.semester}`
            : ""
        }
      >
        {groupDrawer.loading ? (
          <LoadingSkeleton className="h-40 rounded-3xl" />
        ) : (
          groupDrawer.group && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Team Leader
                </p>
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                  {groupDrawer.group.leader?.name || "N/A"}
                </p>
                <p className="text-[10px] font-bold text-slate-400">
                  {groupDrawer.group.leader?.email || "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Core Project
                </p>
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                  {groupDrawer.project?.title || "No submitted project"}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {groupDrawer.project?.status || "Discovery Phase"}
                </span>
              </div>

              <button
                onClick={() => navigate("/teacher/groups")}
                className="w-full h-10 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                Open Workspace
              </button>
            </div>
          )
        )}
      </StudentDetailDrawer>

      <StudentDetailDrawer
        open={projectDrawer.open}
        onClose={() =>
          setProjectDrawer({
            open: false,
            loading: false,
            project: null,
            feedback: [],
          })
        }
        title={projectDrawer.project?.title || "Proposal Detail"}
        subtitle={projectDrawer.project?.group?.name || ""}
      >
        {projectDrawer.loading ? (
          <LoadingSkeleton className="h-40 rounded-3xl" />
        ) : (
          projectDrawer.project && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Technical Description
                </p>
                <div
                  data-color-mode="light"
                  className="p-3 bg-white border border-slate-100 rounded-xl max-h-[300px] overflow-y-auto"
                >
                  <MDEditor.Markdown
                    source={
                      projectDrawer.project.description || "No description"
                    }
                    rehypePlugins={[[rehypeSanitize]]}
                    style={{
                      background: "transparent",
                      fontSize: "11px",
                      color: "#1e293b",
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => navigate("/teacher/projects")}
                className="w-full h-10 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                Open Queue
              </button>
            </div>
          )
        )}
      </StudentDetailDrawer>

      <StudentDetailDrawer
        open={meetingDrawer.open}
        onClose={() => setMeetingDrawer({ open: false, meeting: null })}
        title={meetingDrawer.meeting?.type || "Meeting Detail"}
        subtitle={
          meetingDrawer.meeting
            ? formatDate(
                meetingDrawer.meeting.date || meetingDrawer.meeting.createdAt,
              )
            : ""
        }
      >
        {meetingDrawer.meeting && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Academic Unit
              </p>
              <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                {meetingDrawer.meeting.groupName}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Session Agenda
              </p>
              <p className="text-[11px] font-bold text-slate-600 line-height-relaxed">
                {meetingDrawer.meeting.agenda || "No agenda set"}
              </p>
            </div>

            <button
              onClick={() => navigate("/teacher/meetings")}
              className="w-full h-10 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
            >
              Open Schedule
            </button>
          </div>
        )}
      </StudentDetailDrawer>
    </DashboardShell>
  );
};

export default TeacherDashboard;
