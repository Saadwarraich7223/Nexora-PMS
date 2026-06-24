import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import {
  fetchGroupsByStatus,
  fetchGroupById,
  fetchFaculty,
  fetchSupervisors,
  approveGroup,
  rejectGroup,
} from "../slices/adminSlice.js";
import adminApi from "../api/adminApi.js";
import StatsCards from "../components/StatsCards.jsx";
import GroupsTablePanel from "../components/groups/GroupsTablePanel.jsx";
import GroupDetailDrawer from "../components/groups/GroupDetailDrawer.jsx";
import AssignSupervisorPanel from "../components/groups/AssignSupervisorPanel.jsx";
import ApprovalQueuePanel from "../components/groups/ApprovalQueuePanel.jsx";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const GroupsPage = () => {
  const dispatch = useDispatch();
  const {
    groupsByStatus,
    groupsStatus,
    supervisors,
    supervisorsStatus,
    groupDetail,
  } = useSelector((state) => state.admin);

  const [statusTab, setStatusTab] = useState("active");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignSupervisorId, setAssignSupervisorId] = useState("");
  const [assignStatus, setAssignStatus] = useState("idle");
  const [assignError, setAssignError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recommendStatus, setRecommendStatus] = useState("idle");
  const [recommendError, setRecommendError] = useState("");
  const [recommendActive, setRecommendActive] = useState(false);
  const [supervisorWorkload, setSupervisorWorkload] = useState(null);

  useEffect(() => {
    dispatch(fetchFaculty());
    dispatch(fetchSupervisors());
    dispatch(fetchGroupsByStatus("active"));
    dispatch(fetchGroupsByStatus("rejected"));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchGroupsByStatus(statusTab));
  }, [dispatch, statusTab]);

  useEffect(() => {
    if (!assignSupervisorId) {
      setSupervisorWorkload(null);
      return;
    }

    let active = true;
    const loadWorkload = async () => {
      try {
        const data = await adminApi.fetchSupervisorWorkload(assignSupervisorId);
        if (active) {
          setSupervisorWorkload(data.workload || data);
        }
      } catch {
        if (active) setSupervisorWorkload(null);
      }
    };
    loadWorkload();
    return () => {
      active = false;
    };
  }, [assignSupervisorId]);

  useEffect(() => {
    if (!assignGroupId && recommendActive) {
      setRecommendActive(false);
    }
  }, [assignGroupId, recommendActive]);

  const rawGroups = useMemo(
    () => groupsByStatus[statusTab] || [],
    [groupsByStatus, statusTab],
  );

  const rows = useMemo(() => {
    return rawGroups
      .map((group) => ({
        id: group._id || group.id || group.name,
        name: group.name || "?",
        members: group.members?.length ?? 0,
        capacity: group.maxMembers ?? 4,
        department: group.department || "?",
        semester: group.semester ?? "?",
        status: group.status || statusTab,
        description: group.description || "No description provided.",
        membersList: group.members || [],
        supervisor: group.supervisor?.name || null,
        project: group.project?.title || null,
        projectStatus: group.project?.status || null,
        createdAt: group.createdAt,
      }))
      .filter((g) =>
        departmentFilter === "all" ? true : g.department === departmentFilter,
      )
      .filter((g) => {
        if (!search.trim()) return true;
        return g.name.toLowerCase().includes(search.toLowerCase());
      });
  }, [rawGroups, departmentFilter, search, statusTab]);

  const allGroups = useMemo(
    () => [
      ...(groupsByStatus.pending || []),
      ...(groupsByStatus.active || []),
      ...(groupsByStatus.rejected || []),
    ],
    [groupsByStatus],
  );

  const stats = useMemo(
    () => [
      {
        label: "Pending",
        value: (groupsByStatus.pending || []).length,
        sub: "Needs review",
      },
      {
        label: "Active",
        value: (groupsByStatus.active || []).length,
        sub: "Approved",
      },
      {
        label: "Rejected",
        value: (groupsByStatus.rejected || []).length,
        sub: "Needs follow-up",
      },
      {
        label: "Unassigned",
        value: allGroups.filter((g) => !g.supervisor).length,
        sub: "Need supervisor",
      },
    ],
    [allGroups, groupsByStatus],
  );

  const departments = useMemo(() => {
    const set = new Set(allGroups.map((g) => g.department).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [allGroups]);

  const unassignedGroups = useMemo(() => {
    return allGroups.filter((g) => !g.supervisor);
  }, [allGroups]);

  const groupSummaryText = useMemo(() => {
    const pendingCount = (groupsByStatus.pending || []).length;
    const activeCount = (groupsByStatus.active || []).length;
    const rejectedCount = (groupsByStatus.rejected || []).length;
    return `About groups: ${pendingCount} pending, ${activeCount} active, ${rejectedCount} rejected, ${unassignedGroups.length} unassigned.`;
  }, [groupsByStatus, unassignedGroups.length]);

  const supervisorsRanked = useMemo(() => {
    const list = supervisors.map((s) => {
      const assigned = Array.isArray(s.assignedGroups)
        ? s.assignedGroups.length
        : 0;
      const capacity = s.supervisorCapacity ?? 0;
      const availability = Math.max(capacity - assigned, 0);
      return { ...s, assigned, capacity, availability };
    });
    return list.sort((a, b) => b.availability - a.availability);
  }, [supervisors]);

  const selectedAssignGroup = useMemo(() => {
    return allGroups.find((g) => (g._id || g.id) === assignGroupId) || null;
  }, [allGroups, assignGroupId]);

  const recommendDepartment =
    selectedAssignGroup?.department ||
    (departmentFilter !== "all" ? departmentFilter : "");

  const supervisorsList = useMemo(() => {
    if (recommendActive && recommendations.length > 0) {
      return recommendations;
    }
    return supervisorsRanked;
  }, [recommendActive, recommendations, supervisorsRanked]);

  const supervisorsLabel = recommendActive
    ? "Recommended Supervisors"
    : "Available Supervisors";

  const handleOpenDrawer = (group) => {
    setSelectedGroup(group);
    setSelectedGroupId(group.id);
    setDrawerOpen(true);
    dispatch(fetchGroupById(group.id));
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedGroup(null);
    setSelectedGroupId("");
  };

  const handleApprove = async (group) => {
    try {
      await dispatch(approveGroup(group._id || group.id)).unwrap();
      refreshGroupLists();
      showSuccess("Group approved.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to approve group."));
    }
  };

  const handleReject = async (group) => {
    try {
      await dispatch(rejectGroup(group._id || group.id)).unwrap();
      refreshGroupLists();
      showSuccess("Group rejected.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to reject group."));
    }
  };

  const handleActivate = async (group) => {
    try {
      await dispatch(approveGroup(group._id || group.id)).unwrap();
      dispatch(fetchGroupsByStatus("rejected"));
      showSuccess("Group activated.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to activate group."));
    }
  };

  const refreshGroupLists = () => {
    const statusesToRefresh = Array.from(
      new Set([statusTab, "pending", "active", "rejected"]),
    );

    statusesToRefresh.forEach((status) => {
      dispatch(fetchGroupsByStatus(status));
    });
  };

  const handleAssign = async () => {
    if (!assignGroupId || !assignSupervisorId) return;
    setAssignStatus("loading");
    setAssignError("");
    try {
      await adminApi.assignGroupSupervisor(assignGroupId, assignSupervisorId);
      setAssignStatus("succeeded");
      setAssignGroupId("");
      setAssignSupervisorId("");
      refreshGroupLists();
      dispatch(fetchSupervisors());
      showSuccess("Supervisor assigned.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to assign supervisor.");
      setAssignStatus("failed");
      setAssignError(message);
      showError(message);
    }
  };

  const handleRecommend = async () => {
    if (!recommendDepartment) return;
    setRecommendStatus("loading");
    setRecommendError("");
    try {
      const data =
        await adminApi.fetchSupervisorRecommendations(recommendDepartment);
      setRecommendations(data.supervisors || data || []);
      setRecommendActive(true);
      setRecommendStatus("succeeded");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load recommendations.");
      setRecommendStatus("failed");
      setRecommendError(message);
      showError(message);
    }
  };

  const handleDelete = async (group) => {
    try {
      await adminApi.deleteGroup(group.id || group._id);
      showSuccess("Group deleted.");
      setDrawerOpen(false);
      refreshGroupLists();
    } catch (error) {
      showError(getErrorMessage(error, "Failed to delete group."));
    }
  };

  const detailPayload = groupDetail?.group || groupDetail || null;
  const detailGroup =
    detailPayload && detailPayload._id === selectedGroupId
      ? detailPayload
      : null;

  const drawerGroup = detailGroup || selectedGroup;

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Cohorts Hub
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Strategic Formation & Supervision Management
        </p>
      </div>

      <div className="space-y-6">
        {/* Strategy Layer */}
        <StatsCards stats={stats} status={groupsStatus} />

        {/* Operational Layer: Approval Queue */}
        {groupsByStatus?.pending?.length > 0 && (
          <ApprovalQueuePanel
            groups={groupsByStatus.pending || []}
            groupsStatus={groupsStatus}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {/* Management Layer: Hub & Tables */}
        <GroupsTablePanel
          statusTab={statusTab}
          setStatusTab={setStatusTab}
          search={search}
          setSearch={setSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          departments={departments}
          rows={rows}
          groupsStatus={groupsStatus}
          onView={handleOpenDrawer}
        />

        {/* Action Layer */}
        <div className="pt-4">
          <AssignSupervisorPanel
            groupsStatus={groupsStatus}
            supervisorsStatus={supervisorsStatus}
            unassignedGroups={unassignedGroups}
            supervisorsList={supervisorsList}
            supervisorsLabel={supervisorsLabel}
            assignGroupId={assignGroupId}
            setAssignGroupId={setAssignGroupId}
            assignSupervisorId={assignSupervisorId}
            setAssignSupervisorId={setAssignSupervisorId}
            onAssign={handleAssign}
            assignStatus={assignStatus}
            assignError={assignError}
            onRecommend={handleRecommend}
            recommendStatus={recommendStatus}
            recommendError={recommendError}
            canRecommend={Boolean(recommendDepartment)}
            selectedSupervisorWorkload={supervisorWorkload}
          />
        </div>
      </div>

      <GroupDetailDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        group={drawerGroup}
        onApprove={handleApprove}
        onReject={handleReject}
        onActivate={handleActivate}
        onAssign={(g) => {
          setAssignGroupId(g.id || g._id);
        }}
        onDelete={handleDelete}
        actionStatus={groupsStatus}
      />
    </DashboardShell>
  );
};

export default GroupsPage;
