import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiPackage,
  FiClock,
  FiCheckSquare,
  FiActivity,
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import { fetchGroupById } from "../slices/adminSlice.js";
import adminApi from "../api/adminApi.js";
import {
  useGetAdminAnalyticsQuery,
  useGetAtRiskGroupsQuery,
  useGetAnalyticsNarrativeQuery,
  useGetFacultyQuery,
  useGetSupervisorsQuery,
  useGetStudentsQuery,
  useGetGroupsByStatusQuery,
  useGetSupervisorRequestsQuery,
  useApproveGroupMutation,
  useRejectGroupMutation,
} from "../api/adminRtkApi.js";
import AdminDataHub from "../components/AdminDataHub.jsx";
import AtRiskGroupsPanel from "../components/AtRiskGroupsPanel.jsx";
import QuickActionsCard from "../components/QuickActionsCard.jsx";
import SystemIntelligenceHub from "../components/analytics/SystemIntelligenceHub.jsx";
import GroupDetailDrawer from "../components/groups/GroupDetailDrawer.jsx";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const DEFAULT_TEXT = "N/A";

const AdminOverview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // transformResponse already unwraps: analyticsData = { users, groups, ... }
  const {
    data: analyticsData = {},
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
  } = useGetAdminAnalyticsQuery();
  const {
    data: atRiskGroups = [],
    isLoading: isAtRiskLoading,
    refetch: refetchAtRisk,
  } = useGetAtRiskGroupsQuery();
  // transformResponse unwraps: narrative = { velocityScore, summary, insights }
  const {
    data: narrative,
    isLoading: isNarrativeLoading,
    isFetching: isNarrativeFetching,
    refetch: refetchNarrative,
  } = useGetAnalyticsNarrativeQuery();
  const { data: faculty = [], isLoading: isFacultyLoadingRaw } =
    useGetFacultyQuery();
  const { data: supervisors = [], isLoading: isSupervisorsLoading } =
    useGetSupervisorsQuery();
  // transformResponse already returns array directly
  const { data: students = [], isLoading: isStudentsLoading } =
    useGetStudentsQuery({ status: "active" });

  const [groupFilter, setGroupFilter] = useState("active");
  const { data: groupsByStatusApi = [], isFetching: isGroupsLoading } =
    useGetGroupsByStatusQuery(groupFilter);
  // transformResponse already returns array directly
  const { data: supervisorRequests = [], isLoading: isRequestsLoading } =
    useGetSupervisorRequestsQuery("pending");

  const [approveGroup] = useApproveGroupMutation();
  const [rejectGroup] = useRejectGroupMutation();

  const [userFilter, setUserFilter] = useState("supervisors");
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // analyticsData is already unwrapped by transformResponse
  const users = analyticsData.users || {};
  const groups = analyticsData.groups || {};

  const stats = [
    {
      label: "Total Users",
      value: users.total ?? 0,
      sub: "Registered",
      icon: <FiUsers className="text-indigo-500" size={16} />,
      color: "border-indigo-500",
      bg: "bg-indigo-50/30",
    },
    {
      label: "Project Groups",
      value: groups.total ?? 0,
      sub: "Total",
      icon: <FiPackage className="text-emerald-500" size={16} />,
      color: "border-indigo-500",
      bg: "bg-indigo-50/30",
    },
    {
      label: "Pending Reviews",
      value: groups.pending ?? 0,
      sub: "Action Required",
      icon: <FiClock className="text-amber-500" size={16} />,
      color: "border-indigo-500",
      bg: "bg-indigo-50/30",
    },
    {
      label: "Active Cohorts",
      value: groups.active ?? 0,
      sub: "Approved",
      icon: <FiCheckSquare className="text-violet-500" size={16} />,
      color: "border-indigo-500",
      bg: "bg-indigo-50/30",
    },
  ];

  const tableRows = useMemo(() => {
    if (userFilter === "students") {
      return students.slice(0, 5).map((student) => ({
        id: student._id || student.id,
        name: student.name || DEFAULT_TEXT,
        department: student.department || DEFAULT_TEXT,
        group: student.activeGroup?.name || "Unassigned",
        semester: student.semester || "N/A",
        email: student.email || "No email",
      }));
    }

    const raw = userFilter === "teachers" ? faculty || [] : supervisors || [];
    if (!Array.isArray(raw)) return [];

    return raw.slice(0, 5).map((item) => ({
      id: item._id || item.id,
      name: item.name || DEFAULT_TEXT,
      department: item.department || DEFAULT_TEXT,
      email: item.email || "No email",
      capacity: item.supervisorCapacity ?? 0,
      assigned: Array.isArray(item.assignedGroups)
        ? item.assignedGroups.length
        : (item.assignedGroups ?? 0),
    }));
  }, [userFilter, faculty, supervisors, students]);

  const groupRows = useMemo(() => {
    return groupsByStatusApi.map((group) => ({
      id: group._id || group.id,
      name: group.name || DEFAULT_TEXT,
      members: group.members?.length ?? 0,
      capacity: group.maxMembers ?? 4,
      department: group.department || DEFAULT_TEXT,
      semester: group.semester ?? DEFAULT_TEXT,
      status: group.status || groupFilter,
      createdAt: group.createdAt,
    }));
  }, [groupsByStatusApi, groupFilter]);

  const unassignedGroups = useMemo(() => {
    return groupsByStatusApi
      .filter((group) => !group.supervisor)
      .map((group) => ({
        id: group._id || group.id || group.name,
        name: group.name || DEFAULT_TEXT,
        department: group.department || DEFAULT_TEXT,
        size: group.members?.length ?? 0,
      }));
  }, [groupsByStatusApi]);

  const supervisorRequestsRows = useMemo(() => {
    return supervisorRequests.map((request) => ({
      id: request._id,
      group: request.group?.name || DEFAULT_TEXT,
      department: request.group?.department || DEFAULT_TEXT,
      requestedBy: request.requestedBy?.name || "Student",
      requestedSupervisor: request.supervisorId?.name || "Not specified",
    }));
  }, [supervisorRequests]);

  const isFacultyLoading =
    (userFilter === "teachers" && isFacultyLoadingRaw) ||
    (userFilter === "supervisors" && isSupervisorsLoading) ||
    (userFilter === "students" && isStudentsLoading);

  const viewAllPath =
    userFilter === "students" ? "/admin/students" : "/admin/faculty";

  const refreshOverview = () => {
    refetchAnalytics();
    refetchAtRisk();
    refetchNarrative();
  };

  const handleOpenGroup = (group) => {
    setSelectedGroup(group);
    setSelectedGroupId(group.id || group._id || "");
    setDrawerOpen(true);
    if (group.id || group._id) {
      dispatch(fetchGroupById(group.id || group._id));
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedGroup(null);
    setSelectedGroupId("");
  };

  const drawerGroup = selectedGroup;

  const handleApprove = async (group) => {
    const groupId = group?.id || group?._id || selectedGroupId;
    if (!groupId) return;
    try {
      await approveGroup(groupId).unwrap();
      showSuccess("Group approved.");
      handleCloseDrawer();
    } catch (error) {
      showError(getErrorMessage(error, "Failed to approve group."));
    }
  };

  const handleReject = async (group) => {
    const groupId = group?.id || group?._id || selectedGroupId;
    if (!groupId) return;
    try {
      await rejectGroup(groupId).unwrap();
      showSuccess("Group rejected.");
      handleCloseDrawer();
    } catch (error) {
      showError(getErrorMessage(error, "Failed to reject group."));
    }
  };

  const handleEditUser = (user) => {
    const path =
      userFilter === "students"
        ? `/admin/students?edit=${user.id}`
        : `/admin/faculty?edit=${user.id}`;
    navigate(path);
  };

  const handleActivate = async (group) => {
    const groupId = group?.id || group?._id || selectedGroupId;
    if (!groupId) return;
    try {
      await approveGroup(groupId).unwrap();
      showSuccess("Group activated.");
      handleCloseDrawer();
    } catch (error) {
      showError(getErrorMessage(error, "Failed to activate group."));
    }
  };

  const handleDelete = async (group) => {
    const groupId = group?.id || group?._id || selectedGroupId;
    if (!groupId) return;
    try {
      await adminApi.deleteGroup(groupId);
      showSuccess("Group deleted.");
      handleCloseDrawer();
      refetchAnalytics(); // Manual refetch for things not handled by mutations yet
    } catch (error) {
      showError(getErrorMessage(error, "Failed to delete group."));
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Command Center
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 ">
            Strategic Oversight | System Operations Hub
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                Telemetry
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-900 tabular-nums">
                  24ms
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  Operational
                </span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10 relative overflow-hidden group/latency">
              <FiActivity
                size={14}
                className="relative z-10 animate-[pulse_2s_infinite]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover/latency:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Strategy Layer */}
        <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr]">
          <div className="flex flex-col gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`glass-card p-4 border-l-4 ${stat.color} ${stat.bg} transition-all hover:shadow-lg active:scale-[0.98]`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {stat.label}
                  </p>
                  {stat.icon}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {stat.value}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {stat.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <SystemIntelligenceHub
              narrative={narrative}
              activeSignals={analyticsData.activeSignals}
              isLoading={isNarrativeLoading}
              isFetching={isNarrativeFetching}
              onRefresh={refreshOverview}
            />
          </div>
        </div>

        {/* Operational Layer */}
        <AtRiskGroupsPanel
          atRiskGroups={atRiskGroups}
          atRiskStatus={isAtRiskLoading ? "loading" : "succeeded"}
          onViewGroup={handleOpenGroup}
        />

        {/* Management & Control Hub */}
        <div className="grid gap-6 lg:grid-cols-[2.5fr_1fr]">
          <div className="glass-card min-h-[600px] overflow-hidden flex flex-col">
            <AdminDataHub
              groupFilter={groupFilter}
              setGroupFilter={setGroupFilter}
              groupRows={groupRows}
              groupsStatus={isGroupsLoading ? "loading" : "succeeded"}
              onViewGroup={handleOpenGroup}
              userFilter={userFilter}
              setUserFilter={setUserFilter}
              tableRows={tableRows}
              isFacultyLoading={isFacultyLoading}
              viewAllPath={viewAllPath}
              onEditUser={handleEditUser}
              supervisorRequests={supervisorRequestsRows}
              unassignedGroups={unassignedGroups}
              showAssignPanel={showAssignPanel}
              setShowAssignPanel={setShowAssignPanel}
              isLoadingRequests={isRequestsLoading}
            />
          </div>

          <div className="flex flex-col gap-6">
            <QuickActionsCard />
            <div className="glass-card p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <FiActivity size={80} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                System Health
              </h3>
              <p className="text-[10px] text-slate-400 mb-6 font-medium">
                Global infrastructure telemetry.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    API Gateway
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-emerald-400">
                      99.9%
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    AI Narrator
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-emerald-400">
                      Active
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Database
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-emerald-400">
                      Nominal
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GroupDetailDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        group={drawerGroup}
        onApprove={handleApprove}
        onReject={handleReject}
        onActivate={handleActivate}
        onAssign={() => navigate("/admin/groups")}
        onDelete={handleDelete}
        actionStatus={isGroupsLoading ? "loading" : "idle"}
      />
    </DashboardShell>
  );
};

export default AdminOverview;
