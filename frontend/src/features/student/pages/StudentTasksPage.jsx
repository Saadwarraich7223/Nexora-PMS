import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import { fetchStudentPreview } from "../slices/studentSlice.js";
import studentApi from "../api/studentApi.js";
import StudentDetailDrawer from "../components/shared/StudentDetailDrawer.jsx";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import TaskKanbanBoard from "../components/tasks/TaskKanbanBoard.jsx";
import TaskTimelineBoard from "../components/tasks/TaskTimelineBoard.jsx";
import FeatureWorkspacePanel from "../components/tasks/FeatureWorkspacePanel.jsx";
import {
  FiColumns,
  FiCalendar,
  FiZap,
  FiTrendingUp,
  FiAlertTriangle,
  FiRepeat,
  FiCheckCircle,
  FiInfo,
  FiActivity,
  FiDatabase,
  FiPlus,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import "../studentTheme.css";

const COLUMN_ORDER = ["todo", "in-progress", "review", "completed"];

const COLUMN_META = {
  todo: {
    label: "To Do",
    hint: "Planned tasks",
    className: "student-kanban-todo",
  },
  "in-progress": {
    label: "In Progress",
    hint: "Currently being worked",
    className: "student-kanban-progress",
  },
  review: {
    label: "Review",
    hint: "Awaiting validation",
    className: "student-kanban-review",
  },
  completed: {
    label: "Completed",
    hint: "Done tasks",
    className: "student-kanban-completed",
  },
};

const priorityBadgeClass = {
  high: "student-priority-high",
  medium: "student-priority-medium",
  low: "student-priority-low",
};

const normalizeStatus = (status) => {
  const value = String(status || "todo").toLowerCase();
  if (value === "in_progress") return "in-progress";
  if (["done", "completed"].includes(value)) return "completed";
  if (["to_do", "open", "pending"].includes(value)) return "todo";
  if (["todo", "in-progress", "review", "completed"].includes(value))
    return value;
  return "todo";
};

const normalizePriority = (priority) => {
  const value = String(priority || "medium").toLowerCase();
  if (["high", "medium", "low"].includes(value)) return value;
  return "medium";
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toTaskForm = (task) => ({
  title: task?.title || "",
  description: task?.description || "",
  status: normalizeStatus(task?.status),
  priority: normalizePriority(task?.priority),
  deadline: formatDateInput(task?.deadline),
  assignedTo: task?.assignedTo?._id || task?.assignedTo || "",
  dependencies: (task?.dependencies || []).map((d) => String(d?._id || d)),
});

const getFeatureTaskBuckets = (feature, tasksById) => {
  const counts = { pending: 0, inProgress: 0, completed: 0 };
  (feature?.relatedTasks || []).forEach((featureTask) => {
    const taskId = String(featureTask?._id || featureTask);
    const linkedTask = tasksById[taskId] || featureTask;
    const status = normalizeStatus(linkedTask?.status);

    if (status === "completed") {
      counts.completed += 1;
      return;
    }
    if (status === "in-progress" || status === "review") {
      counts.inProgress += 1;
      return;
    }
    counts.pending += 1;
  });

  const total = counts.pending + counts.inProgress + counts.completed;
  let dominant = "pending";
  if (total > 0 && counts.completed === total) dominant = "completed";
  else if (counts.inProgress > 0) dominant = "in-progress";

  return { counts, dominant };
};

const StudentTasksPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { preview } = useSelector((state) => state.student);

  const [viewMode, setViewMode] = useState("kanban");
  const [tasks, setTasks] = useState([]);
  const [tasksStatus, setTasksStatus] = useState("idle");
  const [taskActionStatus, setTaskActionStatus] = useState("idle");
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createFeatureDrawerOpen, setCreateFeatureDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
    assignedTo: "",
    dependencies: [],
  });
  const [editForm, setEditForm] = useState(toTaskForm(null));
  const [features, setFeatures] = useState([]);
  const [featuresStatus, setFeaturesStatus] = useState("idle");
  const [featureActionStatus, setFeatureActionStatus] = useState("idle");
  const [featureForm, setFeatureForm] = useState({
    name: "",
    description: "",
    relatedTasks: [],
  });
  const [featureEditorOpen, setFeatureEditorOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState("");
  const [featureEditForm, setFeatureEditForm] = useState({
    name: "",
    description: "",
    status: "pending",
  });
  const [featureLinkTaskId, setFeatureLinkTaskId] = useState("");
  const [resources, setResources] = useState([]);
  const [resourcesStatus, setResourcesStatus] = useState("idle");
  const [selectedTaskResourceIds, setSelectedTaskResourceIds] = useState([]);
  const [taskDrawerTab, setTaskDrawerTab] = useState("briefing");
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [prioritizationResults, setPrioritizationResults] = useState(null);
  const [prioritizeDrawerOpen, setPrioritizeDrawerOpen] = useState(false);
  const [teamBalance, setTeamBalance] = useState(null);
  const [isBalancing, setIsBalancing] = useState(false);
  const featureSelectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        featureSelectorRef.current &&
        !featureSelectorRef.current.contains(event.target)
      ) {
        const list = document.getElementById("feature-task-selector-list");
        if (list) list.style.display = "none";
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const group = preview.group;
  const currentUserId = String(user?._id || "");

  const members = useMemo(
    () => (group?.members || []).map((m) => m.user || m).filter(Boolean),
    [group?.members],
  );

  const isLeader = Boolean(
    group &&
    currentUserId &&
    String(group.leader?._id || group.leader) === currentUserId,
  );
  const canManageFeatures = Boolean(
    group && (isLeader || user?.role === "admin"),
  );

  const loadTasks = async () => {
    setTasksStatus("loading");
    try {
      const data = await studentApi.fetchTasks();
      setTasks(data.tasks || []);
      setTasksStatus("succeeded");
    } catch (error) {
      setTasks([]);
      setTasksStatus("failed");
      showError(getErrorMessage(error, "Failed to load tasks."));
    }
  };
  const loadFeatures = async () => {
    setFeaturesStatus("loading");
    try {
      const data = await studentApi.fetchFeatures();
      setFeatures(data.features || []);
      setFeaturesStatus("succeeded");
    } catch (error) {
      setFeatures([]);
      setFeaturesStatus("failed");
      showError(getErrorMessage(error, "Failed to load features."));
    }
  };

  const loadResources = async () => {
    setResourcesStatus("loading");
    try {
      const data = await studentApi.fetchResources();
      setResources(data.files || []);
      setResourcesStatus("succeeded");
    } catch {
      setResources([]);
      setResourcesStatus("failed");
    }
  };

  useEffect(() => {
    dispatch(fetchStudentPreview())
      .unwrap()
      .catch((err) => {
        showError(getErrorMessage(err, "Failed to load task workspace."));
      });
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!active) return;
      if (!group?._id) {
        setTasks([]);
        setTasksStatus("idle");
        setFeatures([]);
        setFeaturesStatus("idle");
        return;
      }
      await Promise.all([loadTasks(), loadFeatures(), loadResources()]);
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [group?._id]);

  const tasksByColumn = useMemo(() => {
    const grouped = {
      todo: [],
      "in-progress": [],
      review: [],
      completed: [],
    };

    tasks.forEach((task) => {
      const key = normalizeStatus(task.status);
      grouped[key].push(task);
    });

    return grouped;
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const myTasks = tasks.filter((task) => {
      const assignedTo = task.assignedTo?._id || task.assignedTo;
      return assignedTo && String(assignedTo) === currentUserId;
    });

    const mine = myTasks.length;
    const mineDone = myTasks.filter(
      (t) => normalizeStatus(t.status) === "completed",
    ).length;
    const mineRemaining = mine - mineDone;

    const unassignedTasks = tasks.filter(
      (t) => !t.assignedTo?._id && !t.assignedTo,
    ).length;

    const cards = [
      {
        label: "Mission Registry",
        value: total,
        sub:
          unassignedTasks > 0
            ? `${unassignedTasks} Unassigned Missions`
            : "Operational Integrity",
        icon: unassignedTasks > 0 ? <FiAlertTriangle /> : <FiZap />,
        color:
          unassignedTasks > 0 ? "text-amber-500 font-black" : "text-slate-400",
      },
      {
        label: "Personal Load",
        value: mine,
        sub: `${mineDone} Done / ${mineRemaining} Left`,
        icon: <FiTrendingUp />,
        color: "text-indigo-600 font-bold",
      },
      {
        label: "Awaiting Review",
        value: tasksByColumn.review.length,
        sub: "Pending Validation",
        icon: <FiRepeat />,
      },
      {
        label: "Finalized",
        value: tasksByColumn.completed.length,
        sub: "Closed Operations",
        icon: <FiCheckCircle />,
      },
    ];

    return cards;
  }, [tasks, tasksByColumn, currentUserId]);

  const featureStats = useMemo(() => {
    const total = features.length;
    const linked = features.reduce(
      (count, feature) => count + (feature.relatedTasks?.length || 0),
      0,
    );
    const mine = features.filter((feature) => {
      const implementerId = feature.implementedBy?._id || feature.implementedBy;
      return implementerId && String(implementerId) === currentUserId;
    }).length;

    return {
      total,
      linked,
      mine,
    };
  }, [features, currentUserId]);

  const refreshTasksWorkspace = async () => {
    await Promise.all([loadTasks(), loadFeatures(), loadResources()]);
  };

  const runWithAuthRetry = async (request) => {
    try {
      return await request();
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 180);
      });

      return await request();
    }
  };
  const runTaskAction = async (action, successText, fallbackText) => {
    setTaskActionStatus("loading");
    try {
      await action();
      await refreshTasksWorkspace();
      setTaskActionStatus("succeeded");
      if (successText) showSuccess(successText);
      return true;
    } catch (error) {
      setTaskActionStatus("failed");
      showError(getErrorMessage(error, fallbackText));
      return false;
    }
  };

  const runFeatureAction = async (action, successText, fallbackText) => {
    setFeatureActionStatus("loading");
    try {
      await action();
      await refreshTasksWorkspace();
      setFeatureActionStatus("succeeded");
      if (successText) showSuccess(successText);
      return true;
    } catch (error) {
      setFeatureActionStatus("failed");
      showError(getErrorMessage(error, fallbackText));
      return false;
    }
  };

  const openTaskDrawer = (task) => {
    setSelectedTask(task);
    setEditForm(toTaskForm(task));
    setSelectedTaskResourceIds(
      (task?.linkedResources || []).map((resource) =>
        String(resource?._id || resource),
      ),
    );
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!createForm.title.trim() || !createForm.description.trim()) {
      showError("Task title and description are required.");
      return;
    }

    const success = await runTaskAction(
      () =>
        runWithAuthRetry(() =>
          studentApi.createTask({
            title: createForm.title.trim(),
            description: createForm.description.trim(),
            priority: normalizePriority(createForm.priority),
            deadline: createForm.deadline || undefined,
            assignedTo: createForm.assignedTo || undefined,
            dependencies: createForm.dependencies,
          }),
        ),
      "Task created.",
      "Failed to create task.",
    );

    if (!success) return;

    setCreateForm({
      title: "",
      description: "",
      priority: "medium",
      deadline: "",
      assignedTo: "",
      dependencies: [],
    });
    setCreateDrawerOpen(false);
  };

  const isTaskOwnedByCurrentUser = (task) => {
    const assignedTo = task?.assignedTo?._id || task?.assignedTo;
    return Boolean(assignedTo && String(assignedTo) === currentUserId);
  };

  const canDeleteTask = () => isLeader;
  const canDragTask = (task) => isLeader || isTaskOwnedByCurrentUser(task);
  const canManageTaskResources = Boolean(
    selectedTask && (isLeader || isTaskOwnedByCurrentUser(selectedTask)),
  );

  const tasksById = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      map[String(task._id)] = task;
    });
    return map;
  }, [tasks]);

  const handleSaveTask = async () => {
    if (!selectedTask?._id) return;

    const isOwnTask = isTaskOwnedByCurrentUser(selectedTask);
    if (!isLeader && !isOwnTask) {
      showError("You can only update your own assigned tasks.");
      return;
    }

    let payload;
    if (isLeader) {
      if (!editForm.title.trim() || !editForm.description.trim()) {
        showError("Task title and description are required.");
        return;
      }

      payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        status: normalizeStatus(editForm.status),
        priority: normalizePriority(editForm.priority),
        deadline: editForm.deadline || undefined,
        assignedTo: editForm.assignedTo || undefined,
        dependencies: editForm.dependencies,
      };
    } else {
      payload = {
        status: normalizeStatus(editForm.status),
      };
    }

    const success = await runTaskAction(
      () =>
        runWithAuthRetry(() =>
          studentApi.updateTask(selectedTask._id, payload),
        ),
      isLeader ? "Task updated." : "Task status updated.",
      "Failed to update task.",
    );

    if (!success) return;

    const updated = {
      ...selectedTask,
      ...payload,
      assignedTo:
        members.find((m) => String(m._id) === String(payload.assignedTo)) ||
        selectedTask.assignedTo,
    };
    setSelectedTask(updated);
    setEditForm(toTaskForm(updated));
  };

  const handleDeleteTask = async (taskId) => {
    const success = await runTaskAction(
      () => runWithAuthRetry(() => studentApi.deleteTask(taskId)),
      "Task deleted.",
      "Failed to delete task.",
    );

    if (!success) return;

    if (selectedTask?._id === taskId) {
      setSelectedTask(null);
      setEditForm(toTaskForm(null));
      setSelectedTaskResourceIds([]);
    }
  };

  const handleSaveTaskResources = async () => {
    if (!selectedTask?._id) return;

    if (!canManageTaskResources) {
      showError(
        "You can only manage linked resources for your own assigned tasks.",
      );
      return;
    }

    setTaskActionStatus("loading");
    try {
      const response = await runWithAuthRetry(() =>
        studentApi.setTaskResources(selectedTask._id, selectedTaskResourceIds),
      );

      await refreshTasksWorkspace();
      const updatedTask = response?.task || selectedTask;
      setSelectedTask(updatedTask);
      setSelectedTaskResourceIds(
        (updatedTask.linkedResources || []).map((resource) =>
          String(resource?._id || resource),
        ),
      );
      setTaskActionStatus("succeeded");
      showSuccess("Task resource links updated.");
    } catch (error) {
      setTaskActionStatus("failed");
      showError(
        getErrorMessage(error, "Failed to update task resource links."),
      );
    }
  };

  const handleAIGenerateTasks = async (
    featureId,
    featureName,
    featureDescription,
    taskCount,
  ) => {
    setIsGeneratingTasks(true);
    try {
      const { tasks: suggestedTasks } = await runWithAuthRetry(() =>
        studentApi.generateAITaskBreakdown(
          (featureDescription || "").trim() || (featureName || "").trim(),
          taskCount,
        ),
      );

      if (!suggestedTasks || suggestedTasks.length === 0) {
        showError("AI could not generate tasks for this description.");
        setIsGeneratingTasks(false);
        return;
      }

      let countLinked = 0;
      for (const t of suggestedTasks) {
        try {
          const created = await runWithAuthRetry(() =>
            studentApi.createTask({
              title: t.title,
              description: t.description,
              priority: normalizePriority(t.priority),
            }),
          );
          if (created && created.task) {
            await runWithAuthRetry(() =>
              studentApi.attachTaskToFeature(
                featureId,
                String(created.task._id),
              ),
            );
            countLinked++;
          }
        } catch (e) {
          // Continue with next task
        }
      }

      await refreshTasksWorkspace();
      showSuccess(`AI generated and linked ${countLinked} tasks!`);
    } catch (e) {
      showError(getErrorMessage(e, "Failed to generate tasks using AI."));
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleCreateFeature = async (e) => {
    e.preventDefault();

    if (!canManageFeatures) {
      showError("Only the group leader can create features.");
      return;
    }

    if (!featureForm.name.trim()) {
      showError("Feature name is required.");
      return;
    }

    const success = await runFeatureAction(
      () =>
        runWithAuthRetry(() =>
          studentApi.createFeature({
            name: featureForm.name.trim(),
            description: featureForm.description.trim() || undefined,
            relatedTasks: featureForm.relatedTasks,
          }),
        ),
      "Feature created.",
      "Failed to create feature.",
    );

    if (!success) return;

    setFeatureForm({
      name: "",
      description: "",
      relatedTasks: [],
    });
    setCreateFeatureDrawerOpen(false);
  };

  const openFeatureEditor = (feature) => {
    setEditingFeatureId(String(feature?._id || ""));
    setFeatureEditForm({
      name: feature?.name || "",
      description: feature?.description || "",
      status: feature?.status || "pending",
    });
    setFeatureLinkTaskId("");
    setFeatureEditorOpen(true);
  };

  const selectedFeature = useMemo(
    () =>
      features.find((feature) => String(feature._id) === editingFeatureId) ||
      null,
    [features, editingFeatureId],
  );

  const selectedFeatureRelatedTaskIds = useMemo(
    () =>
      (selectedFeature?.relatedTasks || []).map((task) =>
        String(task?._id || task),
      ),
    [selectedFeature],
  );

  const selectedFeatureAvailableTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !selectedFeatureRelatedTaskIds.includes(String(task._id)),
      ),
    [tasks, selectedFeatureRelatedTaskIds],
  );

  const handleUpdateFeature = async () => {
    if (!selectedFeature?._id) return;

    if (!canManageFeatures) {
      showError("Only the group leader can update features.");
      return;
    }

    if (!featureEditForm.name.trim()) {
      showError("Feature name is required.");
      return;
    }

    const success = await runFeatureAction(
      () =>
        runWithAuthRetry(() =>
          studentApi.updateFeature(selectedFeature._id, {
            name: featureEditForm.name.trim(),
            description: featureEditForm.description.trim() || undefined,
            status: featureEditForm.status,
          }),
        ),
      "Feature updated.",
      "Failed to update feature.",
    );

    if (!success) return;
  };

  const handleAttachTaskToFeature = async () => {
    if (!selectedFeature?._id) return;

    if (!featureLinkTaskId) {
      showError("Select a task to link.");
      return;
    }

    const success = await runFeatureAction(
      () =>
        runWithAuthRetry(() =>
          studentApi.attachTaskToFeature(
            selectedFeature._id,
            featureLinkTaskId,
          ),
        ),
      "Task linked to feature.",
      "Failed to link task.",
    );

    if (!success) return;

    setFeatureLinkTaskId("");
  };

  const handleDetachTaskFromFeature = async (taskId) => {
    if (!selectedFeature?._id) return;

    await runFeatureAction(
      () =>
        runWithAuthRetry(() =>
          studentApi.detachTaskFromFeature(selectedFeature._id, taskId),
        ),
      "Task unlinked from feature.",
      "Failed to unlink task.",
    );
  };

  const handleDeleteFeature = async () => {
    if (!selectedFeature?._id) return;

    const success = await runFeatureAction(
      () =>
        runWithAuthRetry(() => studentApi.deleteFeature(selectedFeature._id)),
      "Feature deleted.",
      "Failed to delete feature.",
    );

    if (!success) return;

    setFeatureEditorOpen(false);
    setEditingFeatureId("");
  };
  const updateTaskStatusWithRetry = async (taskId, targetStatus) => {
    try {
      return await studentApi.updateTask(taskId, { status: targetStatus });
    } catch {
      await new Promise((resolve) => {
        setTimeout(resolve, 180);
      });
      return await studentApi.updateTask(taskId, { status: targetStatus });
    }
  };

  const handleDropTask = async (taskId, targetStatus) => {
    const task = tasks.find((item) => String(item._id) === String(taskId));
    if (!task) return;
    if (!isLeader && !isTaskOwnedByCurrentUser(task)) {
      showError("You can only move your own assigned tasks.");
      return;
    }
    const current = normalizeStatus(task.status);
    if (current === targetStatus) return;

    await runTaskAction(
      () => updateTaskStatusWithRetry(task._id, targetStatus),
      `Task moved to ${COLUMN_META[targetStatus].label}.`,
      "Failed to move task.",
    );
  };

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const data = await studentApi.fetchPrioritizedTasks();
      setPrioritizationResults(data);
      setPrioritizeDrawerOpen(true);
    } catch (err) {
      showError(getErrorMessage(err, "Failed to prioritize tasks."));
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleAnalyzeBalance = async () => {
    setIsBalancing(true);
    try {
      const data = await studentApi.fetchTeamBalance();
      setTeamBalance(data);
      showSuccess("Team Intelligence updated.");
    } catch (err) {
      showError(getErrorMessage(err, "Failed to analyze team balance."));
    } finally {
      setIsBalancing(false);
    }
  };

  return (
    <DashboardShell>
      <div className="student-role space-y-4">
        {/* Standardized Orchestrator Header */}
        <StudentPageHeader
          protocolName="Operations_Command_v4.1"
          title="Operations Command Center"
          subtitle="Task Management & Prioritization"
          groupName={group?.name}
          rightSide={
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrioritize}
                disabled={!group || isPrioritizing}
                className="h-10 px-4 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 group/btn"
              >
                <FiZap
                  className={`transition-colors ${isPrioritizing ? "text-indigo-500 animate-pulse" : "text-slate-400 group-hover/btn:text-indigo-500"}`}
                  size={14}
                />
                {isPrioritizing ? "Analyzing Strategy..." : "AI Prioritization"}
              </button>

              <button
                onClick={() => setCreateDrawerOpen(true)}
                disabled={!group || !isLeader}
                className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-slate-800"
              >
                <FiPlus size={14} />
                Initialize Task
              </button>
            </div>
          }
        />

        {/* Layer 2: Strategy KPI Layer */}
        <StatsCards stats={stats} status={tasksStatus} />

        {/* Layer 3: Operation Registry */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-indigo-600 rounded-full" />
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                Mission Dispatch Registry
              </h2>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                  viewMode === "kanban"
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <FiColumns size={12} />
                Kanban
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                  viewMode === "timeline"
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <FiCalendar size={12} />
                Timeline
              </button>
            </div>
          </div>

          <div className="min-h-[400px]">
            {viewMode === "kanban" ? (
              <TaskKanbanBoard
                tasksByColumn={tasksByColumn}
                canDragTask={canDragTask}
                isTaskOwnedByCurrentUser={isTaskOwnedByCurrentUser}
                handleDropTask={handleDropTask}
                openTaskDrawer={openTaskDrawer}
              />
            ) : (
              <TaskTimelineBoard
                tasks={tasks}
                openTaskDrawer={openTaskDrawer}
              />
            )}
          </div>

          <FeatureWorkspacePanel
            features={features}
            featureStats={featureStats}
            canManageFeatures={canManageFeatures}
            group={group}
            featuresStatus={featuresStatus}
            tasksById={tasksById}
            featureActionStatus={featureActionStatus}
            openFeatureEditor={openFeatureEditor}
            setCreateFeatureDrawerOpen={setCreateFeatureDrawerOpen}
            handleAIGenerateTasks={handleAIGenerateTasks}
            isGeneratingTasks={isGeneratingTasks}
          />
        </div>

        {isLeader && (
          <div className="mt-6 border-t border-slate-200/60 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/50 bg-indigo-50/50 shadow-inner">
                  <div className="absolute inset-0 animate-ping rounded-xl bg-indigo-400 opacity-20"></div>
                  <FiTrendingUp size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-800">
                    Team Intelligence Diagnostic
                  </h3>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    AI-powered bottleneck detection & load balancing
                  </p>
                </div>
              </div>
              <button
                onClick={handleAnalyzeBalance}
                disabled={isBalancing}
                className="group flex h-9 items-center gap-2 rounded-lg border border-indigo-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                <span className="text-sm">✨</span>
                {isBalancing ? "Synthesizing..." : "Initialize Diagnostic"}
              </button>
            </div>

            {teamBalance ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {/* Team Health Card */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 transition-all hover:shadow-md group/health">
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-500" />
                  <div className="flex items-center justify-between mb-3 pl-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                      Team Balance Health
                    </span>
                    <span className="text-lg font-black text-indigo-600">
                      {teamBalance.healthScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-indigo-200/50 bg-indigo-100/50 mb-3 ml-1">
                    <div
                      className="h-full transition-all duration-700 ease-out bg-indigo-500"
                      style={{ width: `${teamBalance.healthScore}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic pl-1">
                    "{teamBalance.diagnostic}"
                  </p>
                </div>

                {/* Bottlenecks Card */}
                <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-rose-50/20 p-4 transition-all hover:shadow-md group/bottle">
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-rose-500" />
                  <p className="pl-1 mb-3 text-[9px] font-black uppercase tracking-widest text-rose-400">
                    Bottleneck Alerts
                  </p>
                  <div className="space-y-2 pl-1 custom-scrollbar max-h-[120px] overflow-y-auto pr-1">
                    {teamBalance.bottlenecks?.length > 0 ? (
                      teamBalance.bottlenecks.map((b, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-1 rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 transition-colors hover:bg-rose-100/30"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <FiAlertTriangle
                                size={12}
                                className="text-rose-500"
                              />
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                                {b.studentName}
                              </span>
                            </div>
                            <span
                              className={`text-[7px] px-1.5 py-0.5 rounded-md border font-black uppercase tracking-widest ${b.severity === "High" ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}
                            >
                              {b.severity}
                            </span>
                          </div>
                          <p className="text-[9px] font-medium text-slate-500 leading-tight border-t border-rose-100/50 pt-1.5 mt-0.5">
                            {b.reason}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-100/50 bg-emerald-50/50 p-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                          All nodes nominal
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Re-assignments */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 transition-all hover:shadow-md group/suggest">
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-500" />
                  <p className="pl-1 mb-3 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    Suggested Re-assignments
                  </p>
                  <div className="space-y-2 pl-1 custom-scrollbar max-h-[120px] overflow-y-auto pr-1">
                    {teamBalance.suggestions?.length > 0 ? (
                      teamBalance.suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2 transition-colors hover:bg-emerald-100/30"
                        >
                          <p className="text-[10px] font-black uppercase tracking-tight text-slate-700 truncate">
                            {s.taskTitle}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-emerald-100/50">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-500 uppercase">
                                {s.from}
                              </span>
                              <FiRepeat size={10} className="text-slate-400" />
                              <span className="text-[9px] font-black text-emerald-600 uppercase">
                                {s.to}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const t = tasks.find(
                                  (it) => String(it._id) === String(s.taskId),
                                );
                                if (t) openTaskDrawer(t);
                              }}
                              className="text-[9px] font-black uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-700"
                            >
                              View Task
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-100/50 bg-emerald-50/50 p-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                          Team is perfectly balanced
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-6 text-center">
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                  <HiSparkles
                    className="animate-pulse text-indigo-500"
                    size={24}
                  />
                </div>
                <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">
                  Leader Intelligence Dashboard
                </p>
                <p className="mt-1.5 max-w-[280px] text-[10px] font-medium text-slate-500 leading-relaxed">
                  Run a balance check to see if your team has any hidden
                  bottlenecks or potential dependency risks.
                </p>
              </div>
            )}

            {teamBalance?.summary && (
              <div className="mt-4 flex items-start gap-4 rounded-xl bg-slate-900 p-4 font-black shadow-xs text-white">
                <FiZap className="mt-1 shrink-0 text-amber-400" size={16} />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                    Consultant Summary
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed">
                    {teamBalance.summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <StudentDetailDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Create Task"
        subtitle="Leader can create and assign group tasks"
      >
        <form onSubmit={handleCreateTask} className="space-y-3">
          <input
            value={createForm.title}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Task title"
            className="student-form-control w-full rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
            disabled={!isLeader || taskActionStatus === "loading"}
          />

          <textarea
            rows={4}
            value={createForm.description}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Task description"
            className="student-form-control w-full resize-none rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
            disabled={!isLeader || taskActionStatus === "loading"}
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={createForm.priority}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="student-form-control rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
              disabled={!isLeader || taskActionStatus === "loading"}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="date"
              value={createForm.deadline}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, deadline: e.target.value }))
              }
              className="student-form-control rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
              disabled={!isLeader || taskActionStatus === "loading"}
            />
          </div>

          <select
            value={createForm.assignedTo}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, assignedTo: e.target.value }))
            }
            className="student-form-control w-full rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
            disabled={!isLeader || taskActionStatus === "loading"}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>

          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-700">
              Dependencies (Optional)
            </p>
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white/70 p-2">
              {tasks.length === 0 && (
                <p className="px-1 py-2 text-[11px] text-slate-500">
                  No active tasks available to link.
                </p>
              )}
              {tasks.map((t) => {
                const tId = String(t._id);
                const checked = createForm.dependencies.includes(tId);
                return (
                  <label
                    key={tId}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 hover:bg-white/80"
                  >
                    <span className="text-xs font-semibold text-slate-700 truncate pr-2">
                      {t.title}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!isLeader || taskActionStatus === "loading"}
                      onChange={() =>
                        setCreateForm((prev) => ({
                          ...prev,
                          dependencies: checked
                            ? prev.dependencies.filter((id) => id !== tId)
                            : [...prev.dependencies, tId],
                        }))
                      }
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isLeader || taskActionStatus === "loading"}
            className="h-10 w-full bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {taskActionStatus === "loading"
              ? "Status: Creating Mission..."
              : "Confirm & Initialize Mission"}
          </button>
        </form>
      </StudentDetailDrawer>

      <StudentDetailDrawer
        open={createFeatureDrawerOpen}
        onClose={() => setCreateFeatureDrawerOpen(false)}
        title="Create Feature"
        subtitle="Leader/admin can define implementation scope and link existing tasks"
      >
        <form onSubmit={handleCreateFeature} className="space-y-3">
          <input
            value={featureForm.name}
            onChange={(e) =>
              setFeatureForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Feature name"
            className="student-form-control w-full rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
            disabled={!canManageFeatures || featureActionStatus === "loading"}
          />

          <textarea
            rows={4}
            value={featureForm.description}
            onChange={(e) =>
              setFeatureForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Feature description"
            className="student-form-control w-full resize-none rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
            disabled={!canManageFeatures || featureActionStatus === "loading"}
          />

          <div>
            <div className="mb-2  flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Link Existing Tasks (Optional)
              </label>
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-[10px] font-black text-indigo-600 border border-indigo-100">
                {featureForm.relatedTasks.length}
              </div>
            </div>

            <div className="relative z-10 rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-inner">
              <div className="mb-3 relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Filter available mission nodes..."
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase();
                    const els = document.querySelectorAll(".task-selector-row");
                    els.forEach((el) => {
                      const text = el.getAttribute("data-search").toLowerCase();
                      el.style.display = text.includes(val) ? "flex" : "none";
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                {tasks.length === 0 ? (
                  <p className="px-1 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    No mission nodes available.
                  </p>
                ) : (
                  tasks.map((task) => {
                    const taskId = String(task._id);
                    const checked = featureForm.relatedTasks.includes(taskId);
                    const tStatus = normalizeStatus(task.status);
                    const owner =
                      task.assignedTo?.name ||
                      task.createdBy?.name ||
                      "Unassigned";

                    return (
                      <div
                        key={taskId}
                        className="task-selector-row flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all hover:bg-slate-50 hover:border-slate-100 cursor-pointer"
                        data-search={`${task.title} ${owner}`}
                        onClick={() => {
                          setFeatureForm((prev) => ({
                            ...prev,
                            relatedTasks: checked
                              ? prev.relatedTasks.filter((id) => id !== taskId)
                              : [...prev.relatedTasks, taskId],
                          }));
                        }}
                      >
                        <div
                          className={`shrink-0 h-4 w-4 rounded-md border flex items-center justify-center transition-all ${
                            checked
                              ? "bg-indigo-600 border-indigo-600"
                              : "bg-white border-slate-300"
                          }`}
                        >
                          {checked && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[10px] font-black uppercase tracking-tight ${checked ? "text-slate-900 font-black" : "text-slate-600"}`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  tStatus === "completed"
                                    ? "bg-emerald-500"
                                    : tStatus === "in-progress" ||
                                        tStatus === "review"
                                      ? "bg-indigo-500"
                                      : "bg-slate-300"
                                }`}
                              ></div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                {tStatus.replace("-", " ")}
                              </span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              /
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[80px]">
                              {owner}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canManageFeatures || featureActionStatus === "loading"}
            className="rounded-full bg-indigo-700 px-4 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {featureActionStatus === "loading"
              ? "Creating..."
              : "Create Feature"}
          </button>
        </form>
      </StudentDetailDrawer>

      <StudentDetailDrawer
        open={featureEditorOpen}
        onClose={() => {
          setFeatureEditorOpen(false);
          setEditingFeatureId("");
        }}
        title={selectedFeature?.name || "Update Feature"}
        subtitle="Leader/admin can update feature details and manage linked tasks"
      >
        {selectedFeature && (
          <div className="flex flex-col gap-6 pb-4 pt-1">
            {/* Core Details */}
            <div className="space-y-4 rounded-2xl border border-slate-200/60 bg-white/40 p-4 shadow-sm backdrop-blur-sm">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Feature Name
                </label>
                <input
                  value={featureEditForm.name}
                  onChange={(e) =>
                    setFeatureEditForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Feature name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-inner outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    !canManageFeatures || featureActionStatus === "loading"
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={featureEditForm.description}
                  onChange={(e) =>
                    setFeatureEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Feature description"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12px] leading-relaxed text-slate-700 shadow-inner outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    !canManageFeatures || featureActionStatus === "loading"
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Feature Status
                </label>
                <select
                  value={featureEditForm.status}
                  onChange={(e) =>
                    setFeatureEditForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-bold text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    !canManageFeatures || featureActionStatus === "loading"
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Link Tasks Block */}
            <div
              ref={featureSelectorRef}
              className="relative z-20 rounded-2xl border border-indigo-100 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition-all"
            >
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
                    🔗
                  </span>
                  Link Mission Node
                </label>
                <span className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                  Deployment Interface
                </span>
              </div>

              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search available nodes..."
                    value={
                      featureLinkTaskId
                        ? tasksById[featureLinkTaskId]?.title || ""
                        : ""
                    }
                    onFocus={(e) => {
                      const list = document.getElementById(
                        "feature-task-selector-list",
                      );
                      if (list) list.style.display = "block";
                    }}
                    readOnly
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-[11px] font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all cursor-pointer"
                  />

                  {/* Dropdown Results */}
                  <div
                    id="feature-task-selector-list"
                    className="absolute top-full left-0 right-0 z-[90] mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden hidden animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="p-2 border-b border-slate-100">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type to filter..."
                        onChange={(e) => {
                          const v = e.target.value.toLowerCase();
                          const items =
                            document.querySelectorAll(".task-link-item");
                          items.forEach((it) => {
                            const t = it
                              .getAttribute("data-search")
                              .toLowerCase();
                            it.style.display = t.includes(v) ? "flex" : "none";
                          });
                        }}
                        className="w-full px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {selectedFeatureAvailableTasks.length === 0 ? (
                        <p className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                          No unlinked nodes detected.
                        </p>
                      ) : (
                        selectedFeatureAvailableTasks.map((task) => {
                          const status = normalizeStatus(task.status);
                          const owner =
                            task.assignedTo?.name ||
                            task.createdBy?.name ||
                            "Unassigned";
                          return (
                            <div
                              key={task._id}
                              data-search={`${task.title} ${owner}`}
                              onClick={() => {
                                setFeatureLinkTaskId(String(task._id));
                                document.getElementById(
                                  "feature-task-selector-list",
                                ).style.display = "none";
                              }}
                              className="task-link-item flex items-center justify-between gap-3 p-2.5 mx-1 my-1 rounded-xl hover:bg-indigo-50 group/item cursor-pointer transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black uppercase tracking-tight text-slate-700 group-hover/item:text-indigo-700 truncate">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    By {owner}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`shrink-0 px-2 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-widest ${
                                  status === "completed"
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                    : status === "in-progress" ||
                                        status === "review"
                                      ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                                      : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                              >
                                {status.replace("-", " ")}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      const list = document.getElementById(
                        "feature-task-selector-list",
                      );
                      if (list)
                        list.style.display =
                          list.style.display === "none" ? "block" : "none";
                    }}
                    className="flex-1 h-10 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
                  >
                    {featureLinkTaskId
                      ? "Change Target Node"
                      : "Select Mission Node"}
                  </button>
                  <button
                    onClick={handleAttachTaskToFeature}
                    disabled={
                      !canManageFeatures ||
                      featureActionStatus === "loading" ||
                      !featureLinkTaskId
                    }
                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Command Link
                  </button>
                </div>
              </div>
            </div>

            {/* Linked Tasks List */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/10 p-4 shadow-sm backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <FiCheckCircle size={80} />
              </div>

              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-lg bg-emerald-100 border border-emerald-200">
                    🎯
                  </span>
                  Linked Registry
                </label>
                <div className="px-2 py-0.5 rounded-md bg-emerald-100 text-[8px] font-black text-emerald-700 uppercase tracking-widest border border-emerald-200">
                  {selectedFeature.relatedTasks?.length || 0} Synchronized
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {(selectedFeature.relatedTasks || []).length === 0 ? (
                  <div className="py-8 text-center bg-white/40 border border-dashed border-emerald-200 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Zero Linkages Detected
                    </p>
                    <p className="mt-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                      Mission nodes must be initialized <br /> for deployment
                      synchronization.
                    </p>
                  </div>
                ) : (
                  (selectedFeature.relatedTasks || []).map((featureTask) => {
                    const linkedTaskId = String(
                      featureTask?._id || featureTask,
                    );
                    const linkedTask = tasksById[linkedTaskId] || featureTask;
                    const status = normalizeStatus(linkedTask?.status);

                    return (
                      <div
                        key={`${selectedFeature._id}-${linkedTaskId}`}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition-all hover:shadow-md hover:border-indigo-200"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[10px] font-black uppercase tracking-tight ${status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}
                          >
                            {linkedTask?.title || "Operational Node"}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div
                              className={`h-1 w-1 rounded-full ${status === "completed" ? "bg-emerald-500" : "bg-indigo-500"}`}
                            ></div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              {status.replace("-", " ")}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                              /
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 truncate">
                              {linkedTask?.assignedTo?.name || "Unassigned"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleDetachTaskFromFeature(linkedTaskId)
                          }
                          className="h-7 px-3 rounded-lg border border-rose-100 bg-rose-50 text-[8px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-xs"
                        >
                          Unlink
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={handleDeleteFeature}
                disabled={
                  !canManageFeatures || featureActionStatus === "loading"
                }
                className="rounded-full border border-rose-200 bg-white px-5 py-2.5 text-[11px] font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Feature
              </button>

              <button
                onClick={handleUpdateFeature}
                disabled={
                  !canManageFeatures || featureActionStatus === "loading"
                }
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-2.5 text-[11px] font-bold text-white shadow-md transition-all hover:from-indigo-700 hover:to-indigo-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {featureActionStatus === "loading"
                  ? "Saving..."
                  : "Save Feature Changes"}
              </button>
            </div>
          </div>
        )}
      </StudentDetailDrawer>
      <StudentDetailDrawer
        open={Boolean(selectedTask)}
        onClose={() => {
          setSelectedTask(null);
          setTaskDrawerTab("briefing");
        }}
        title="Mission Intelligence Hub"
        subtitle="Tactical Node Control"
      >
        {selectedTask && (
          <div className="flex flex-col gap-4 pb-2">
            {/* --- Mission Detail Header --- */}
            <div className="glass-card bg-slate-50 border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center gap-4 w-full">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-md font-black shadow-lg border border-slate-800">
                  {selectedTask.title?.charAt(0).toUpperCase() || "T"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[220px]">
                      {selectedTask.title}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest shrink-0 ${
                        selectedTask.status === "completed"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : selectedTask.status === "in-progress"
                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      {selectedTask.status?.replace("-", " ")}
                    </span>
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">
                    Synthesized Mission Node Identity
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-inner">
              {[
                { id: "briefing", label: "Briefing", icon: FiInfo },
                { id: "tactical", label: "Tactical", icon: FiZap },
                { id: "intelligence", label: "Intelligence", icon: FiActivity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTaskDrawerTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    taskDrawerTab === tab.id
                      ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <tab.icon
                    size={12}
                    className={
                      taskDrawerTab === tab.id ? "text-indigo-600" : ""
                    }
                  />
                  {tab.label}
                </button>
              ))}
            </div>

            {taskDrawerTab === "briefing" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/40 p-4 shadow-sm">
                  <div>
                    <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Node Title
                    </label>
                    <input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-800 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                      disabled={!isLeader || taskActionStatus === "loading"}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Mission Parameters
                    </label>
                    <textarea
                      rows={4}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-[11px] leading-relaxed text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                      disabled={!isLeader || taskActionStatus === "loading"}
                    />
                  </div>
                </div>
              </div>
            )}

            {taskDrawerTab === "tactical" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="rounded-2xl border border-slate-200 bg-white/40 p-4 shadow-sm">
                  <label className="mb-3 block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Configuration Matrix
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[7px] font-black text-slate-400 uppercase tracking-widest">
                        Operational Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                        disabled={
                          taskActionStatus === "loading" ||
                          (!isLeader && !isTaskOwnedByCurrentUser(selectedTask))
                        }
                      >
                        <option value="todo">Planned</option>
                        <option value="in-progress">In Execution</option>
                        <option value="review">Validation</option>
                        <option value="completed">Finalized</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[7px] font-black text-slate-400 uppercase tracking-widest">
                        Priority Index
                      </label>
                      <select
                        value={editForm.priority}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            priority: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                        disabled={!isLeader || taskActionStatus === "loading"}
                      >
                        <option value="high">Critical</option>
                        <option value="medium">Standard</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[7px] font-black text-slate-400 uppercase tracking-widest">
                        Temporal Deadline
                      </label>
                      <input
                        type="date"
                        value={editForm.deadline}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            deadline: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-700 shadow-sm outline-none"
                        disabled={!isLeader || taskActionStatus === "loading"}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[7px] font-black text-slate-400 uppercase tracking-widest">
                        Assigned Operator
                      </label>
                      <select
                        value={editForm.assignedTo}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            assignedTo: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] font-black text-indigo-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                        disabled={!isLeader || taskActionStatus === "loading"}
                      >
                        <option value="">Unassigned</option>
                        {members.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200/60 bg-amber-50/20 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-amber-700">
                      Tactical Dependencies
                    </label>
                    <span className="text-[7px] font-black text-amber-600/50 tracking-[0.2em]">
                      PREREQUISITES
                    </span>
                  </div>
                  <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-amber-100 bg-white p-2 shadow-inner custom-scrollbar">
                    {tasks.filter(
                      (t) => String(t._id) !== String(selectedTask?._id),
                    ).length === 0 ? (
                      <p className="px-2 py-3 text-center text-[10px] font-semibold text-slate-400">
                        No other tasks available to link.
                      </p>
                    ) : (
                      tasks
                        .filter(
                          (t) => String(t._id) !== String(selectedTask?._id),
                        )
                        .map((t) => {
                          const tId = String(t._id);
                          const checked = editForm.dependencies.includes(tId);
                          return (
                            <label
                              key={tId}
                              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-all ${checked ? "bg-amber-50 border border-amber-200/50" : "hover:bg-slate-50 border border-transparent"}`}
                            >
                              <span
                                className={`truncate pr-2 text-[10px] font-black uppercase tracking-tight ${checked ? "text-amber-800" : "text-slate-500"}`}
                              >
                                {t.title}
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={
                                  !isLeader || taskActionStatus === "loading"
                                }
                                className="rounded text-amber-600"
                                onChange={() =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    dependencies: checked
                                      ? prev.dependencies.filter(
                                          (id) => id !== tId,
                                        )
                                      : [...prev.dependencies, tId],
                                  }))
                                }
                              />
                            </label>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            )}

            {taskDrawerTab === "intelligence" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="rounded-2xl border border-cyan-200/60 bg-cyan-50/20 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-700">
                      Intelligence Resources
                    </label>
                    <span className="rounded-full bg-cyan-100/70 px-2 py-1 text-[7px] font-black text-cyan-700 tracking-widest">
                      {selectedTaskResourceIds.length} ATTACHED
                    </span>
                  </div>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-cyan-100 bg-white p-2 shadow-inner custom-scrollbar">
                    {(() => {
                      if (resourcesStatus === "loading")
                        return (
                          <p className="py-2 text-center text-[10px] font-semibold text-slate-400">
                            Loading Intelligence...
                          </p>
                        );

                      const manageableResources = resources.filter(
                        (resource) => {
                          if (isLeader) return true;
                          return (
                            String(
                              resource.uploadedBy?._id ||
                                resource.uploadedBy ||
                                "",
                            ) === currentUserId
                          );
                        },
                      );

                      const unmanageableLinkedResources = (
                        selectedTask?.linkedResources || []
                      ).filter((linkedRes) => {
                        if (isLeader) return false;
                        return (
                          String(
                            linkedRes.uploadedBy?._id ||
                              linkedRes.uploadedBy ||
                              "",
                          ) !== currentUserId
                        );
                      });

                      if (
                        manageableResources.length === 0 &&
                        unmanageableLinkedResources.length === 0
                      ) {
                        return (
                          <p className="py-2 text-center text-[10px] font-semibold text-slate-400">
                            No resources available in current workspace.
                          </p>
                        );
                      }

                      return (
                        <>
                          {unmanageableLinkedResources.map((resource) => (
                            <div
                              key={`readonly-${resource._id}`}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100/50 px-3 py-2 opacity-80"
                            >
                              <div>
                                <p className="truncate text-[11px] font-black text-slate-700">
                                  {resource.originalName || resource.fileName}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400">
                                  Source:{" "}
                                  {resource.uploadedBy?.name || "Member"}
                                </p>
                              </div>
                              <span className="text-[8px] font-black text-slate-400">
                                LOCKED
                              </span>
                            </div>
                          ))}
                          {manageableResources.map((resource) => {
                            const checked = selectedTaskResourceIds.includes(
                              String(resource._id),
                            );
                            return (
                              <label
                                key={resource._id}
                                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 transition-all ${checked ? "border-cyan-200 bg-cyan-50/50" : "border-slate-50 bg-slate-50/50 hover:bg-slate-100/50"}`}
                              >
                                <div>
                                  <p
                                    className={`truncate text-[11px] font-black uppercase tracking-tight ${checked ? "text-cyan-800" : "text-slate-700"}`}
                                  >
                                    {resource.originalName || resource.fileName}
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                    Uploaded via{" "}
                                    {resource.uploadedBy?.name || "Terminal"}
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={taskActionStatus === "loading"}
                                  onChange={() =>
                                    setSelectedTaskResourceIds((prev) =>
                                      checked
                                        ? prev.filter(
                                            (id) => id !== String(resource._id),
                                          )
                                        : [...prev, String(resource._id)],
                                    )
                                  }
                                  className="rounded text-cyan-600"
                                />
                              </label>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleSaveTaskResources}
                      disabled={
                        !canManageTaskResources ||
                        taskActionStatus === "loading"
                      }
                      className="h-10 px-5 bg-white border border-cyan-200 text-cyan-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 transition-all shadow-xs flex items-center gap-2"
                    >
                      <FiDatabase size={14} />
                      Link Proto-Intelligence
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- Mission Tactical Actions --- */}
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              {canDeleteTask(selectedTask) ? (
                <button
                  onClick={() => handleDeleteTask(selectedTask._id)}
                  disabled={taskActionStatus === "loading"}
                  className="h-10 px-5 border border-rose-200 bg-white text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-xs disabled:opacity-50"
                >
                  Decommission Node
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={handleSaveTask}
                disabled={
                  taskActionStatus === "loading" ||
                  (!isLeader && !isTaskOwnedByCurrentUser(selectedTask))
                }
                className="h-10 px-8 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95 flex items-center gap-2 group/save"
              >
                <FiZap
                  size={14}
                  className="text-indigo-400 group-hover:text-white transition-colors"
                />
                {taskActionStatus === "loading"
                  ? "Executing..."
                  : "Synchronize State"}
              </button>
            </div>
          </div>
        )}
      </StudentDetailDrawer>

      <StudentDetailDrawer
        open={prioritizeDrawerOpen}
        onClose={() => setPrioritizeDrawerOpen(false)}
        title="🤖 Smart Task Prioritization"
        subtitle="AI-ranked focus list based on deadlines and blockers."
      >
        {prioritizationResults && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3 shadow-sm">
              <HiSparkles
                className="text-indigo-500 shrink-0 mt-0.5"
                size={16}
              />
              <p className="text-[11px] font-medium text-indigo-700 italic leading-relaxed">
                {prioritizationResults.summary}
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Ranked Recommendations
              </p>
              {prioritizationResults.recommendations.map((rec, idx) => (
                <div
                  key={rec.taskId}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FiZap size={40} className="text-indigo-500" />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800">
                          {rec.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter ${
                            rec.impact === "High"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : rec.impact === "Medium"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {rec.impact} Impact
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                        {rec.reasoning}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                          <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500"
                              style={{ width: `${rec.priorityScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 capitalize">
                            Score: {rec.priorityScore}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const t = tasks.find(
                              (it) => String(it._id) === String(rec.taskId),
                            );
                            if (t) openTaskDrawer(t);
                            setPrioritizeDrawerOpen(false);
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                        >
                          View Task
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[9px] text-slate-500 leading-tight">
                Note: Priorities are calculated based on upcoming deadlines,
                task dependency chains, and overall feature progression.
              </p>
            </div>
          </div>
        )}
      </StudentDetailDrawer>
    </DashboardShell>
  );
};

export default StudentTasksPage;
