import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import { fetchStudentPreview } from "../slices/studentSlice.js";
import StudentDetailDrawer from "../components/shared/StudentDetailDrawer.jsx";
import {
  normalizeNotificationPriority,
  resolveNotificationSender,
} from "../utils/notificationMeta.js";
import getErrorMessage from "../../../utils/error.js";
import { showError } from "../../../components/ui/toast.jsx";
import { FiRefreshCw, FiZap, FiGrid, FiActivity, FiLock } from "react-icons/fi";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import GroupSnapshotPanel from "../components/preview/GroupSnapshotPanel.jsx";

import GroupActionCenterPanel from "../components/preview/GroupActionCenterPanel.jsx";
import ProjectStatusPanel from "../components/preview/ProjectStatusPanel.jsx";
import TaskOverviewPanel from "../components/preview/TaskOverviewPanel.jsx";
import NotificationsPanel from "../components/preview/NotificationsPanel.jsx";
import DeadlinesPanel from "../components/preview/DeadlinesPanel.jsx";
import MeetingsPanel from "../components/preview/MeetingsPanel.jsx";
import MeetingDetailContent from "../components/meetings/MeetingDetailContent.jsx";
import NotificationDetailContent from "../components/notifications/NotificationDetailContent.jsx";

import "../studentTheme.css";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { preview, status, error } = useSelector((state) => state.student);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    dispatch(fetchStudentPreview())
      .unwrap()
      .catch((err) => {
        showError(getErrorMessage(err, "Failed to load student preview."));
      });
  }, [dispatch]);

  const taskStats = useMemo(() => {
    const tasks = preview.tasks || [];
    return {
      total: tasks.length,
      todo: tasks.filter((t) =>
        ["todo", "to_do", "open"].includes(
          String(t.status || "").toLowerCase(),
        ),
      ).length,
      inProgress: tasks.filter((t) =>
        ["in_progress", "in-progress", "progress"].includes(
          String(t.status || "").toLowerCase(),
        ),
      ).length,
      done: tasks.filter((t) =>
        ["done", "completed"].includes(String(t.status || "").toLowerCase()),
      ).length,
      mine: tasks.filter((t) => {
        const assignedId = t.assignedTo?._id || t.assignedTo;
        return (
          assignedId && user?._id && String(assignedId) === String(user._id)
        );
      }).length,
    };
  }, [preview.tasks, user]);

  const group = preview.group;
  const isLeader =
    group &&
    user?._id &&
    String(group.leader?._id || group.leader) === String(user._id);

  const unreadCount = (preview.notifications || []).filter(
    (n) => !n.isRead,
  ).length;

  const handleAction = (type) => {
    const actionRoute = {
      create: "/student/groups?action=create",
      browse: "/student/groups?action=browse",
      invite: "/student/groups?action=invite",
      submit: "/student/groups?action=submit",
      leave: "/student/groups?action=leave",
    };

    navigate(actionRoute[type] || "/student/groups");
  };

  const notificationSender = selectedNotification
    ? resolveNotificationSender(selectedNotification)
    : null;

  return (
    <DashboardShell>
      <main className="max-w-[1400px] mx-auto space-y-6">
        {/* Standardized Orchestrator Header */}
        <StudentPageHeader
          protocolName="Overview_Command_v1.2"
          title={`Welcome Back, ${user?.name?.split(" ")[0] || "Scholar"}`}
          subtitle="Project Monitoring & Overview"
          groupName={group?.name}
          rightSide={
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(fetchStudentPreview())}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-indigo-100 group transition-all"
              >
                <FiRefreshCw
                  size={12}
                  className="text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500"
                />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Protocol Sync
                </span>
              </button>
              <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                <FiLock className="text-slate-400" size={14} />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Secure_Core</span>
              </div>
            </div>
          }
        />

        {status === "failed" && (
          <div className="mx-6 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-widest">
            {error}
          </div>
        )}

        <div className=" space-y-4">
          {/* Strategy & Action Layer */}
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <GroupSnapshotPanel
              group={group}
              isLeader={isLeader}
              supervisorRequest={preview.supervisorRequest}
              loading={status === "loading"}
            />
            <GroupActionCenterPanel
              group={group}
              isLeader={isLeader}
              invitesCount={preview.invites.length}
              joinRequestsCount={preview.joinRequests.length}
              onAction={handleAction}
            />
          </div>

          {/* Pulse Layer */}
          <div className="grid gap-4 lg:grid-cols-3">
            <button
              onClick={() => navigate("/student/projects")}
              className="text-left group transition-all"
            >
              <ProjectStatusPanel project={preview.project} />
            </button>
            <button
              onClick={() => navigate("/student/tasks")}
              className="text-left group transition-all"
            >
              <TaskOverviewPanel taskStats={taskStats} />
            </button>
            <div className="h-full">
              <NotificationsPanel
                notifications={preview.notifications || []}
                unreadCount={unreadCount}
                onOpen={setSelectedNotification}
              />
            </div>
          </div>

          {/* Registry Layer */}
          <div className="grid gap-4 xl:grid-cols-2">
            <DeadlinesPanel
              deadlines={preview.deadlines || []}
              tasks={preview.tasks || []}
              currentUserId={String(user?._id || "")}
            />
            <MeetingsPanel
              meetings={preview.meetings || []}
              onOpen={setSelectedMeeting}
            />
          </div>
        </div>
      </main>

      <StudentDetailDrawer
        open={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        title={
          selectedNotification?.title ||
          selectedNotification?.type ||
          "Notification"
        }
        subtitle={
          selectedNotification
            ? new Date(selectedNotification.createdAt).toLocaleString()
            : ""
        }
      >
        <NotificationDetailContent
          notification={selectedNotification}
          priority={
            selectedNotification
              ? normalizeNotificationPriority(selectedNotification.priority)
              : "low"
          }
          sender={
            selectedNotification
              ? resolveNotificationSender(selectedNotification)
              : null
          }
        />
      </StudentDetailDrawer>

      <StudentDetailDrawer
        open={Boolean(selectedMeeting)}
        onClose={() => setSelectedMeeting(null)}
        title={selectedMeeting?.title || selectedMeeting?.type || "Meeting"}
        subtitle={
          selectedMeeting && selectedMeeting.date
            ? new Date(selectedMeeting.date).toLocaleString()
            : ""
        }
      >
        <MeetingDetailContent
          meeting={selectedMeeting}
          isPast={
            selectedMeeting &&
            new Date(selectedMeeting.date).getTime() < Date.now()
          }
        />
      </StudentDetailDrawer>
    </DashboardShell>
  );
};

export default StudentDashboard;
