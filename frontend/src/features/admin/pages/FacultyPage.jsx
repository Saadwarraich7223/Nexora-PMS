import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import {
  fetchFaculty,
  fetchFacultyById,
  createFaculty,
  updateFaculty,
  updateFacultyCapacity,
  deleteFaculty,
  fetchGroupsByStatus,
  fetchSupervisors,
} from "../slices/adminSlice.js";
import adminApi from "../api/adminApi.js";
import FacultyTablePanel from "../components/faculty/FacultyTablePanel.jsx";
import WorkloadHeatmap from "../components/faculty/WorkloadHeatmap.jsx";
import GroupRequestsPanel from "../components/faculty/GroupRequestsPanel.jsx";
import AssignSupervisorPanel from "../components/faculty/AssignSupervisorPanel.jsx";
import AddFacultyPanel from "../components/faculty/AddFacultyPanel.jsx";
import FacultyDetailDrawer from "../components/faculty/FacultyDetailDrawer.jsx";
import SupervisorRequestDrawer from "../components/faculty/SupervisorRequestDrawer.jsx";
import StatsCards from "../components/StatsCards.jsx";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const FacultyPage = () => {
  const dispatch = useDispatch();
  const {
    faculty,
    facultyStatus,
    facultyDetail,
    facultyDetailStatus,
    facultyActionStatus,
    groupsByStatus,
    groupsStatus,
    supervisors,
    supervisorsStatus,
  } = useSelector((state) => state.admin);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    supervisorCapacity: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    department: "",
    supervisorCapacity: "",
  });
  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignSupervisorId, setAssignSupervisorId] = useState("");
  const [assignStatus, setAssignStatus] = useState("idle");
  const [assignDepartment, setAssignDepartment] = useState("");
  const [recommended, setRecommended] = useState([]);
  const [assignError, setAssignError] = useState("");
  const [supervisorRequests, setSupervisorRequests] = useState([]);
  const [supervisorRequestsStatus, setSupervisorRequestsStatus] =
    useState("idle");
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestActionStatus, setRequestActionStatus] = useState("idle");

  useEffect(() => {
    dispatch(fetchFaculty());
    dispatch(fetchSupervisors());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchGroupsByStatus("pending"));
    dispatch(fetchGroupsByStatus("active"));
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const loadSupervisorRequests = async () => {
      setSupervisorRequestsStatus("loading");
      try {
        const data = await adminApi.fetchSupervisorRequests("pending");
        if (!active) return;
        setSupervisorRequests(data.requests || []);
        setSupervisorRequestsStatus("succeeded");
      } catch {
        if (!active) return;
        setSupervisorRequests([]);
        setSupervisorRequestsStatus("failed");
      }
    };

    loadSupervisorRequests();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    dispatch(fetchFacultyById(selectedId));
  }, [dispatch, selectedId]);

  useEffect(() => {
    if (!facultyDetail) return;
    setEditForm({
      name: facultyDetail.name || "",
      email: facultyDetail.email || "",
      department: facultyDetail.department || "",
      supervisorCapacity: facultyDetail.supervisorCapacity ?? 0,
    });
  }, [facultyDetail]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!assignDepartment || assignDepartment === "all") {
        setRecommended([]);
        return;
      }
      try {
        const res =
          await adminApi.fetchSupervisorRecommendations(assignDepartment);
        setRecommended(res.supervisors || res || []);
      } catch (error) {
        setRecommended([]);
        showError(getErrorMessage(error, "Failed to load recommendations."));
      }
    };
    fetchRecommendations();
  }, [assignDepartment]);

  const departments = useMemo(() => {
    const set = new Set(faculty.map((t) => t.department).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [faculty]);

  const rows = useMemo(() => {
    const normalized = faculty.map((t) => {
      const assigned = Array.isArray(t.assignedGroups)
        ? t.assignedGroups.length
        : 0;
      const capacity = t.supervisorCapacity ?? 0;
      const availability = Math.max(capacity - assigned, 0);
      const status =
        capacity === 0
          ? "no-capacity"
          : assigned >= capacity
            ? "at-capacity"
            : "available";
      return { ...t, assigned, capacity, availability, status };
    });

    return normalized
      .filter((t) =>
        departmentFilter === "all" ? true : t.department === departmentFilter,
      )
      .filter((t) => {
        if (availabilityFilter === "available") return t.status === "available";
        if (availabilityFilter === "at-capacity")
          return t.status === "at-capacity";
        if (availabilityFilter === "no-capacity")
          return t.status === "no-capacity";
        return true;
      })
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.name?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q)
        );
      });
  }, [faculty, departmentFilter, availabilityFilter, search]);

  const statusPill = (status) => {
    if (status === "available") return "bg-emerald-100 text-emerald-700";
    if (status === "at-capacity") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-600";
  };

  const handleOpenDrawer = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department) {
      showError("Please fill all required fields.");
      return;
    }
    try {
      await dispatch(
        createFaculty({
          name: form.name,
          email: form.email,
          password: form.password,
          department: form.department,
          supervisorCapacity: Number(form.supervisorCapacity || 0),
        }),
      ).unwrap();
      dispatch(fetchFaculty());
      setForm({
        name: "",
        email: "",
        department: "",
        password: "",
        supervisorCapacity: "",
      });
      showSuccess("Faculty created.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to create faculty."));
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    try {
      await dispatch(
        updateFaculty({
          teacherId: selectedId,
          payload: {
            name: editForm.name,
            email: editForm.email,
            department: editForm.department,
          },
        }),
      ).unwrap();
      dispatch(fetchFaculty());
      dispatch(fetchFacultyById(selectedId));
      showSuccess("Faculty updated.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to update faculty."));
    }
  };

  const handleCapacityUpdate = async () => {
    if (!selectedId) return;
    try {
      await dispatch(
        updateFacultyCapacity({
          teacherId: selectedId,
          supervisorCapacity: Number(editForm.supervisorCapacity || 0),
        }),
      ).unwrap();
      dispatch(fetchFaculty());
      dispatch(fetchFacultyById(selectedId));
      showSuccess("Capacity updated.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to update capacity."));
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await dispatch(deleteFaculty(selectedId)).unwrap();
      dispatch(fetchFaculty());
      handleCloseDrawer();
      showSuccess("Faculty deleted.");
    } catch (error) {
      showError(getErrorMessage(error, "Failed to delete faculty."));
    }
  };

  const handleAssign = async () => {
    if (!assignGroupId || !assignSupervisorId) return;
    setAssignStatus("loading");
    setAssignError("");
    try {
      await adminApi.assignSupervisor({
        groupId: assignGroupId,
        supervisorId: assignSupervisorId,
      });
      setAssignStatus("succeeded");
      setAssignGroupId("");
      setAssignSupervisorId("");
      dispatch(fetchGroupsByStatus("pending"));
      dispatch(fetchGroupsByStatus("active"));
      dispatch(fetchFaculty());
      dispatch(fetchSupervisors());
      try {
        const data = await adminApi.fetchSupervisorRequests("pending");
        setSupervisorRequests(data.requests || []);
        setSupervisorRequestsStatus("succeeded");
      } catch {
        setSupervisorRequests([]);
        setSupervisorRequestsStatus("failed");
      }
      showSuccess("Supervisor assigned.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to assign supervisor.");
      setAssignStatus("failed");
      setAssignError(message);
      showError(message);
    }
  };

  const handleRequestAssign = (item) => {
    const request = supervisorRequests.find((r) => r._id === item.id) || item;
    setSelectedRequest(request);
    setRequestDrawerOpen(true);
  };

  const handleApproveRequest = async (request) => {
    setRequestActionStatus("loading");
    try {
      await adminApi.reviewSupervisorRequest({
        requestId: request._id,
        approve: true,
        reviewNote: "Approved via Faculty Hub Dashboard",
      });
      await reloadSupervisorRequests();
      dispatch(fetchFaculty());
      dispatch(fetchSupervisors());
      dispatch(fetchGroupsByStatus("pending"));
      dispatch(fetchGroupsByStatus("active"));
      setRequestActionStatus("succeeded");
      setRequestDrawerOpen(false);
      showSuccess("Supervisor request approved and group assigned.");
    } catch (error) {
      setRequestActionStatus("failed");
      showError(
        getErrorMessage(error, "Failed to approve supervisor request."),
      );
    }
  };

  const handleRejectRequest = async (request) => {
    setRequestActionStatus("loading");
    try {
      await adminApi.reviewSupervisorRequest({
        requestId: request._id,
        approve: false,
        reviewNote: "Rejected via Faculty Hub Dashboard",
      });
      await reloadSupervisorRequests();
      setRequestActionStatus("succeeded");
      setRequestDrawerOpen(false);
      showSuccess("Supervisor request rejected.");
    } catch (error) {
      setRequestActionStatus("failed");
      showError(getErrorMessage(error, "Failed to reject supervisor request."));
    }
  };

  const reloadSupervisorRequests = async () => {
    try {
      const data = await adminApi.fetchSupervisorRequests("pending");
      setSupervisorRequests(data.requests || []);
      setSupervisorRequestsStatus("succeeded");
    } catch {
      setSupervisorRequests([]);
      setSupervisorRequestsStatus("failed");
    }
  };

  const unassignedGroups = useMemo(() => {
    const pending = groupsByStatus?.pending || [];
    const active = groupsByStatus?.active || [];
    return [...pending, ...active].filter((g) => !g.supervisor);
  }, [groupsByStatus]);

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

  const recommendedSupervisors = useMemo(() => {
    if (!recommended.length) return supervisorsRanked;
    return recommended;
  }, [recommended, supervisorsRanked]);

  const groupRequests = useMemo(() => {
    return supervisorRequests.map((request) => ({
      id: request._id,
      name: request.group?.name || "Unnamed group",
      department: request.group?.department || "Unknown",
      semester: request.group?.semester || "-",
      requestedBy: request.requestedBy?.name || "Student",
      requestedSupervisor: request.supervisorId?.name || "Not specified",
      group: request.group,
      supervisorId: request.supervisorId,
    }));
  }, [supervisorRequests]);

  const facultyStats = useMemo(() => {
    const withCapacity = rows.filter((item) => item.capacity > 0);
    const availableSupervisors = withCapacity.filter(
      (item) => item.availability > 0,
    );

    return [
      { label: "Faculty", value: faculty.length, sub: "Total" },
      { label: "Supervisors", value: withCapacity.length, sub: "Configured" },
      {
        label: "Available Supervisors",
        value: availableSupervisors.length,
        sub: "Can take groups",
      },
      {
        label: "Unassigned Groups",
        value: unassignedGroups.length,
        sub: "Pending + Active",
      },
    ];
  }, [faculty.length, rows, unassignedGroups.length]);

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Faculty Hub
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Resource & Capacity Management
        </p>
      </div>

      <div className="space-y-6">
        {/* Strategy Layer */}
        <StatsCards
          stats={facultyStats}
          status={
            facultyStatus === "loading" || groupsStatus === "loading"
              ? "loading"
              : "succeeded"
          }
        />

        {/* Intelligence Layer: Workload Heatmap */}
        <WorkloadHeatmap faculty={faculty} status={facultyStatus} />

        {/* Operational Layer: Requests */}
        {groupRequests.length > 0 && (
          <GroupRequestsPanel
            groupRequests={groupRequests}
            groupsStatus={
              supervisorRequestsStatus === "loading" ? "loading" : groupsStatus
            }
            onAssign={handleRequestAssign}
          />
        )}

        {/* Management Layer: Hub & Tables */}
        <FacultyTablePanel
          search={search}
          setSearch={setSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
          departments={departments}
          rows={rows}
          facultyStatus={facultyStatus}
          statusPill={statusPill}
          onView={handleOpenDrawer}
        />

        {/* Action Layer */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <AssignSupervisorPanel
            groupsStatus={groupsStatus}
            supervisorsStatus={supervisorsStatus}
            unassignedGroups={unassignedGroups}
            supervisorsRanked={recommendedSupervisors}
            assignGroupId={assignGroupId}
            setAssignGroupId={setAssignGroupId}
            assignSupervisorId={assignSupervisorId}
            setAssignSupervisorId={setAssignSupervisorId}
            onAssign={handleAssign}
            assignStatus={assignStatus}
            assignError={assignError}
            assignDepartment={assignDepartment}
            setAssignDepartment={setAssignDepartment}
            departments={departments}
          />
          <AddFacultyPanel
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            actionStatus={facultyActionStatus}
          />
        </div>
      </div>

      <FacultyDetailDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        detailStatus={facultyDetailStatus}
        detail={facultyDetail}
        editForm={editForm}
        setEditForm={setEditForm}
        onUpdate={handleUpdate}
        onCapacityUpdate={handleCapacityUpdate}
        onDelete={handleDelete}
        actionStatus={facultyActionStatus}
      />

      <SupervisorRequestDrawer
        open={requestDrawerOpen}
        onClose={() => setRequestDrawerOpen(false)}
        request={selectedRequest}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        actionStatus={requestActionStatus}
      />
    </DashboardShell>
  );
};

export default FacultyPage;
