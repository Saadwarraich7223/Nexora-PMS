import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiTarget,
  FiActivity,
  FiZap,
  FiCalendar,
  FiLayers,
  FiTrash2,
  FiEdit,
  FiAward,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import { fetchTeacherWorkspace } from "../slices/teacherSlice.js";
import teacherApi from "../api/teacherApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import "../teacherTheme.css";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getDaysRemaining = (dateValue) => {
  if (!dateValue) return "";
  const diff = new Date(dateValue).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due Today";
  if (days === 1) return "Due Tomorrow";
  return `${days} days remaining`;
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const TeacherDeadlinesPage = () => {
  const dispatch = useDispatch();
  const { groups, status: workspaceStatus } = useSelector(
    (state) => state.teacher,
  );

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [deadlines, setDeadlines] = useState([]);
  const [status, setStatus] = useState("idle");
  const [actionStatus, setActionStatus] = useState("idle");
  const [features, setFeatures] = useState([]);
  const [form, setForm] = useState({
    name: "",
    dueDate: toDateInput(new Date()),
    linkedFeatureId: "",
  });
  const [overrideModal, setOverrideModal] = useState({
    open: false,
    deadlineId: null,
    status: "",
    note: "",
  });
  const [gradeModal, setGradeModal] = useState({
    open: false,
    deadlineId: null,
    grade: "",
    maxGrade: 100,
  });
  const [activeTab, setActiveTab] = useState("pending"); // pending, attention, archived

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

  const selectedGroup = useMemo(
    () =>
      groups.find((group) => String(group._id) === String(selectedGroupId)) ||
      null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    const projectId = selectedGroup?.project?._id || "";
    setSelectedProjectId(String(projectId));
  }, [selectedGroup]);

  const loadDeadlinesAndFeatures = async (projectId, groupId) => {
    if (!projectId) {
      setDeadlines([]);
      setFeatures([]);
      return;
    }
    setStatus("loading");
    try {
      const [deadlinesData, workspaceData] = await Promise.all([
        teacherApi.fetchProjectDeadlines(projectId),
        teacherApi
          .fetchGroupWorkspace(groupId)
          .catch(() => ({ data: { features: [] } })),
      ]);
      setDeadlines(deadlinesData.deadlines || []);
      setFeatures(workspaceData?.data?.features || []);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setDeadlines([]);
      showError(getErrorMessage(error, "Failed to load deadlines."));
    }
  };

  useEffect(() => {
    loadDeadlinesAndFeatures(selectedProjectId, selectedGroupId);
  }, [selectedProjectId, selectedGroupId]);

  const handleCreateDeadline = async (event) => {
    event.preventDefault();
    if (!selectedProjectId) return;
    if (!form.name.trim() || !form.dueDate) {
      showError("Name and due date are required.");
      return;
    }
    setActionStatus("loading");
    try {
      await teacherApi.createProjectDeadline(selectedProjectId, {
        name: form.name.trim(),
        dueDate: new Date(form.dueDate).toISOString(),
        linkedFeatureId: form.linkedFeatureId || undefined,
      });
      showSuccess("Deadline established.");
      setForm({
        name: "",
        dueDate: toDateInput(new Date()),
        linkedFeatureId: "",
      });
      await loadDeadlinesAndFeatures(selectedProjectId, selectedGroupId);
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to create deadline."));
    }
  };

  const handleDeleteDeadline = async (deadlineId) => {
    if (!window.confirm("Confirm node deletion? This action is irreversible."))
      return;
    setActionStatus("loading");
    try {
      await teacherApi.deleteDeadline(deadlineId);
      showSuccess("Deadline removed.");
      await loadDeadlinesAndFeatures(selectedProjectId, selectedGroupId);
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to delete deadline."));
    }
  };

  const segments = useMemo(() => {
    const list = deadlines.map((d) => {
      const isOverridden = d.isOverridden;
      const status = isOverridden
        ? d.overrideStatus
        : d.completionStatus || "pending";
      const needsAttention = status !== "pending" && d.grade === null;
      const isArchived = status !== "pending" && d.grade !== null;
      const isPending = status === "pending";

      return {
        ...d,
        activeStatus: status,
        needsAttention,
        isArchived,
        isPending,
      };
    });

    return {
      pending: list.filter((d) => d.isPending),
      attention: list.filter((d) => d.needsAttention),
      archived: list.filter((d) => d.isArchived),
      all: list,
    };
  }, [deadlines]);

  const stats = useMemo(() => {
    const total = deadlines.length;
    const completed = segments.all.filter((d) =>
      d.activeStatus.startsWith("completed"),
    ).length;
    const overdue = segments.all.filter(
      (d) => d.activeStatus === "overdue",
    ).length;
    const health = total > 0 ? Math.round((completed / total) * 100) : 100;

    return [
      { label: "Total Nodes", value: total, sub: "/ Active Registry" },
      { label: "Overdue Alerts", value: overdue, sub: "Delayed Targets" },
      { label: "Fulfilled", value: completed, sub: "Closed Checkpoints" },
      {
        label: "Registry Health",
        value: `${health}%`,
        sub: "Operational Integrity",
      },
    ];
  }, [deadlines, segments]);

  const currentItems = segments[activeTab] || [];

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700 pb-12">
        {/* Orchestrator Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FiTarget className="text-indigo-600" />
              Deadline Command
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Lifecycle Orchestration & Milestone Intelligence
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                loadDeadlinesAndFeatures(selectedProjectId, selectedGroupId)
              }
              className="h-8 w-8 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
            >
              <FiActivity
                size={14}
                className={status === "loading" ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Strategy Layer (KPIs) */}
        <StatsCards
          stats={stats}
          status={status === "loading" ? "loading" : "succeeded"}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr] items-stretch">
          {/* Control Hub (Form) */}
          <div className="space-y-6 flex flex-col h-full">
            <div className="glass-card flex flex-col flex-1 overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                  Configure Node
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Target Cohort
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase shadow-sm"
                  >
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedProjectId ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                    <FiAlertCircle
                      className="text-amber-600 shrink-0"
                      size={16}
                    />
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">
                      Cohort has no linked project. Node creation blocked.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateDeadline} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                        Node Identifier
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="E.G. PROPOSAL_SUBMISSION"
                        className="h-9 w-full rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-300 transition-all placeholder:text-slate-300 uppercase shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                        Temporal Node (Due Date)
                      </label>
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            dueDate: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-300 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                        Linked Feature Linkage
                      </label>
                      <select
                        value={form.linkedFeatureId}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            linkedFeatureId: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-300 transition-all uppercase shadow-sm"
                        disabled={features.length === 0}
                      >
                        <option value="">-- NO_FEATURE_LINK --</option>
                        {features.map((feature) => (
                          <option
                            key={feature._id}
                            value={feature._id}
                            disabled={feature.status === "completed"}
                          >
                            {feature.name.toUpperCase()}{" "}
                            {feature.status === "completed"
                              ? "(DONE)"
                              : `(${feature.status.toUpperCase()})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={actionStatus === "loading"}
                      className="w-full h-9 bg-slate-900 border border-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {actionStatus === "loading" ? (
                        <FiActivity className="animate-spin" />
                      ) : (
                        <FiPlus />
                      )}
                      Establish Node
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Registry Hub (List) */}
          <div className="glass-card overflow-hidden flex flex-col h-full bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 p-1 bg-white/60 backdrop-blur-md rounded-xl border border-slate-100">
                {[
                  {
                    id: "pending",
                    label: "Active",
                    count: segments.pending.length,
                  },
                  {
                    id: "attention",
                    label: "Attention",
                    count: segments.attention.length,
                    pulse: segments.attention.length > 0,
                  },
                  {
                    id: "archived",
                    label: "Archive",
                    count: segments.archived.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeTab === tab.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {tab.count}
                    </span>
                    {tab.pulse && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {selectedGroup && (
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {selectedGroup.name}
                  </p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                    COHORT_REGISTRY
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3 flex-1">
              {status === "loading" && (
                <LoadingSkeleton className="h-64 rounded-xl" />
              )}

              {currentItems.length === 0 && status !== "loading" && (
                <div className="h-full flex flex-col items-center justify-center py-20 grayscale opacity-40">
                  <FiTarget size={32} className="text-slate-200 mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    No signals in current registry
                  </p>
                </div>
              )}

              {currentItems.map((deadline) => {
                const activeState = deadline.activeStatus;

                let badgeClass = "bg-slate-50 text-slate-500 border-slate-100";
                if (activeState === "completed_early")
                  badgeClass =
                    "bg-emerald-50 text-emerald-600 border-emerald-100";
                else if (activeState === "completed_on_time")
                  badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                else if (activeState === "overdue")
                  badgeClass = "bg-rose-50 text-rose-600 border-rose-100";

                return (
                  <div
                    key={deadline._id}
                    className="group relative p-3.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 transition-all shadow-sm flex items-start gap-4 overflow-hidden"
                  >
                    {deadline.needsAttention && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 animate-pulse" />
                    )}
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors border border-slate-50">
                      <FiZap size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate">
                          {deadline.name}
                        </h3>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${badgeClass}`}
                        >
                          {activeState.replace("_", " ")}
                        </span>
                        {deadline.isOverridden && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[7px] font-black uppercase tracking-widest">
                            Override
                          </span>
                        )}
                        {deadline.needsAttention && (
                          <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[7px] font-black uppercase tracking-widest animate-pulse">
                            <FiAlertCircle size={8} /> Needs Attention
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <FiCalendar size={11} className="text-slate-300" />{" "}
                          {formatDate(deadline.dueDate)}
                        </span>
                        {activeState === "pending" && (
                          <span className="text-indigo-600">
                            {getDaysRemaining(deadline.dueDate)}
                          </span>
                        )}
                        {deadline.grade !== null && (
                          <span className="text-emerald-600 flex items-center gap-1.5">
                            <FiAward size={11} /> {deadline.grade} /{" "}
                            {deadline.maxGrade}
                          </span>
                        )}
                      </div>
                      {deadline.linkedFeature && (
                        <div className="mt-2 flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          <FiLayers size={10} className="text-indigo-300" />
                          <span>Linkage: {deadline.linkedFeature.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          let suggestedGrade = deadline.grade ?? "";
                          if (
                            suggestedGrade === "" &&
                            deadline.activeStatus !== "pending"
                          ) {
                            const maxG = deadline.maxGrade || 100;
                            if (deadline.activeStatus?.startsWith("completed"))
                              suggestedGrade = maxG;
                            else if (deadline.activeStatus === "overdue")
                              suggestedGrade = Math.max(
                                0,
                                maxG - Math.abs(deadline.daysVariance || 0) * 5,
                              );
                          }
                          setGradeModal({
                            open: true,
                            deadlineId: deadline._id,
                            grade: suggestedGrade,
                            maxGrade: deadline.maxGrade || 100,
                          });
                        }}
                        className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <FiAward size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          Score
                        </span>
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            setOverrideModal({
                              open: true,
                              deadlineId: deadline._id,
                              status: activeState,
                              note: deadline.overrideNote || "",
                            })
                          }
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          <FiEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeadline(deadline._id)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Drawers (Faculty UI Style) */}
      {(overrideModal.open || gradeModal.open) && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4">
          <div className="flex h-full w-full max-w-sm flex-col overflow-hidden p-5 border-none shadow-2xl bg-white rounded-2xl animate-in slide-in-from-right duration-500">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-inner border ${overrideModal.open ? "bg-amber-50 text-amber-500 border-amber-100" : "bg-emerald-50 text-emerald-500 border-emerald-100"}`}
                >
                  {overrideModal.open ? (
                    <FiEdit size={20} />
                  ) : (
                    <FiAward size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">
                    {overrideModal.open
                      ? "Protocol Calibration"
                      : "Node Scoring"}
                  </h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                    Checkpoint:{" "}
                    {
                      deadlines.find(
                        (d) =>
                          d._id ===
                          (overrideModal.deadlineId || gradeModal.deadlineId),
                      )?.name
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOverrideModal({ open: false });
                  setGradeModal({ open: false });
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-300 border border-slate-100"
              >
                <FiXCircle size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1">
              <div
                className={`p-3 rounded-xl border ${overrideModal.open ? "bg-amber-50 text-amber-800 border-amber-100" : "bg-emerald-50 text-emerald-800 border-emerald-100"}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-tight leading-relaxed">
                  {overrideModal.open
                    ? "Warning: Manual calibration supersedes automated lifecycle tracking. Audit logging active."
                    : "Intelligence: Score suggestion based on temporal performance. Teacher manual entry required for final lock."}
                </p>
              </div>

              {overrideModal.open ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      Calibrated Status
                    </label>
                    <select
                      value={overrideModal.status}
                      onChange={(e) =>
                        setOverrideModal((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-[10px] font-black text-slate-700 outline-none uppercase"
                    >
                      <option value="pending">PENDING</option>
                      <option value="completed_early">COMPLETED EARLY</option>
                      <option value="completed_on_time">
                        COMPLETED ON TIME
                      </option>
                      <option value="overdue">OVERDUE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      Audit Justification
                    </label>
                    <textarea
                      value={overrideModal.note}
                      onChange={(e) =>
                        setOverrideModal((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-700 outline-none resize-none min-h-[100px]"
                      placeholder="Reason for protocol adjustment..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      Asset Score
                    </label>
                    <input
                      type="number"
                      value={gradeModal.grade}
                      onChange={(e) =>
                        setGradeModal((prev) => ({
                          ...prev,
                          grade: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-[10px] font-black text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      Max Scale
                    </label>
                    <input
                      type="number"
                      value={gradeModal.maxGrade}
                      onChange={(e) =>
                        setGradeModal((prev) => ({
                          ...prev,
                          maxGrade: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-[10px] font-black text-slate-700 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={async () => {
                  setActionStatus("loading");
                  try {
                    const payload = overrideModal.open
                      ? {
                          overrideStatus: overrideModal.status,
                          overrideNote: overrideModal.note,
                        }
                      : {
                          grade:
                            gradeModal.grade === ""
                              ? null
                              : Number(gradeModal.grade),
                          maxGrade: Number(gradeModal.maxGrade) || 100,
                        };
                    await teacherApi.overrideDeadlineStatus(
                      overrideModal.open
                        ? overrideModal.deadlineId
                        : gradeModal.deadlineId,
                      payload,
                    );
                    showSuccess("Protocol updated.");
                    await loadDeadlinesAndFeatures(
                      selectedProjectId,
                      selectedGroupId,
                    );
                    overrideModal.open
                      ? setOverrideModal({ open: false })
                      : setGradeModal({ open: false });
                    setActionStatus("succeeded");
                  } catch (err) {
                    setActionStatus("failed");
                    showError(
                      getErrorMessage(err, "Protocol synchronization failure."),
                    );
                  }
                }}
                disabled={actionStatus === "loading"}
                className="w-full h-10 rounded-lg bg-slate-900 shadow-lg shadow-slate-900/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {actionStatus === "loading" ? (
                  <FiActivity className="animate-spin" />
                ) : (
                  <FiCheckCircle />
                )}
                {overrideModal.open ? "Commit Calibration" : "Lock Asset Score"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default TeacherDeadlinesPage;
