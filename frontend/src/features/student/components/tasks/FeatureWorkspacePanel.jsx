import React from "react";
import { FiLayout } from "react-icons/fi";

const normalizeStatus = (status) => {
  const value = String(status || "todo").toLowerCase();
  if (value === "in_progress") return "in-progress";
  if (["done", "completed"].includes(value)) return "completed";
  if (["to_do", "open", "pending"].includes(value)) return "todo";
  if (["todo", "in-progress", "review", "completed"].includes(value))
    return value;
  return "todo";
};

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

const FeatureWorkspacePanel = ({
  features,
  featureStats,
  canManageFeatures,
  group,
  featuresStatus,
  tasksById,
  featureActionStatus,
  openFeatureEditor,
  setCreateFeatureDrawerOpen,
  handleAIGenerateTasks,
  isGeneratingTasks,
}) => {
  const [filter, setFilter] = React.useState("all");
  const [taskCounts, setTaskCounts] = React.useState({});

  const getTaskCount = (id) => taskCounts[id] || 3;
  const updateTaskCount = (id, count) =>
    setTaskCounts((prev) => ({ ...prev, [id]: count }));

  const filteredFeatures = features.filter((feature) => {
    if (filter === "all") return true;
    const { dominant } = getFeatureTaskBuckets(feature, tasksById);
    if (filter === "completed") return dominant === "completed";
    if (filter === "pending") return dominant === "pending";
    if (filter === "in-progress") return dominant === "in-progress";
    return true;
  });

  const activeFeatures = filteredFeatures.filter(
    (f) => (f.relatedTasks || []).length > 0,
  );
  const emptyFeatures = filteredFeatures.filter(
    (f) => (f.relatedTasks || []).length === 0,
  );

  const renderFeatureCard = (feature, isActive) => {
    const featureId = String(feature._id);
    const implementerName = feature.implementedBy?.name || "Unknown";
    const taskOwners = Array.from(
      new Set(
        (feature.relatedTasks || [])
          .map((featureTask) => {
            const linkedTaskId = String(featureTask?._id || featureTask);
            const linkedTask = tasksById[linkedTaskId] || featureTask;
            return (
              linkedTask?.assignedTo?.name ||
              linkedTask?.createdBy?.name ||
              null
            );
          })
          .filter(Boolean),
      ),
    );
    const implementedByLabel =
      taskOwners.length > 0 ? taskOwners.join(", ") : implementerName;
    const { counts, dominant } = getFeatureTaskBuckets(feature, tasksById);
    const linkedResourcesMap = new Map();
    (feature.relatedTasks || []).forEach((featureTask) => {
      const linkedTaskId = String(featureTask?._id || featureTask);
      const linkedTask = tasksById[linkedTaskId] || featureTask;
      (linkedTask?.linkedResources || []).forEach((resource) => {
        const resourceId = String(resource?._id || resource);
        if (!resourceId) return;
        if (!linkedResourcesMap.has(resourceId)) {
          linkedResourcesMap.set(resourceId, resource);
        }
      });
    });
    const linkedResources = Array.from(linkedResourcesMap.values());
    const dominantClass =
      dominant === "completed"
        ? "student-feature-card-completed"
        : dominant === "in-progress"
          ? "border-indigo-200 bg-indigo-50/40 shadow-sm"
          : "border-slate-200 bg-white shadow-sm";

    const totalTasks = counts.pending + counts.inProgress + counts.completed;
    const progressPercent =
      totalTasks > 0 ? Math.round((counts.completed / totalTasks) * 100) : 0;

    return (
      <article
        key={featureId}
        className={`group/card relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-md ${
          dominant === "completed"
            ? "border-emerald-100 bg-emerald-50/20"
            : dominant === "in-progress"
              ? "border-indigo-100 bg-indigo-50/20"
              : "border-slate-200 bg-white"
        } ${!isActive ? "border-amber-200 bg-amber-50/30" : ""}`}
      >
        {/* Tactical Accent Bar */}
        <div
          className={`absolute bottom-0 left-0 top-0 w-1 ${
            dominant === "completed"
              ? "bg-emerald-500"
              : dominant === "in-progress"
                ? "bg-indigo-600"
                : "bg-slate-300"
          } ${!isActive ? "bg-amber-500" : ""}`}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-[13px] font-black uppercase tracking-tight text-slate-800">
                {feature.name}
              </h4>
              {!isActive && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-amber-700">
                  Gapped
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
              {feature.description || "Mission parameters undefined."}
            </p>
          </div>
          {canManageFeatures && (
            <button
              onClick={() => openFeatureEditor(feature)}
              disabled={featureActionStatus === "loading"}
              className="h-7 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-slate-600 shadow-xs transition-all hover:border-indigo-300 hover:text-indigo-700 hover:bg-slate-50"
            >
              Configure
            </button>
          )}
        </div>

        {isActive ? (
          <div className="mt-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest leading-none text-slate-400">
                  Resource Intensity
                </span>
                <span className="mt-1 text-[11px] font-black text-slate-700">
                  {progressPercent}% Synchronized
                </span>
              </div>
              <div className="flex -space-x-1">
                {/* Avatar placeholder style */}
                <div className="flex h-5 w-5 items-center justify-center rounded-md border border-white bg-slate-900 text-[7px] font-black uppercase text-white shadow-sm">
                  {implementedByLabel.charAt(0)}
                </div>
              </div>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100">
              <div
                className={`h-full transition-all duration-700 ease-out ${
                  dominant === "completed" ? "bg-emerald-500" : "bg-indigo-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  Nodes:
                </span>
                <span className="text-[9px] font-black text-slate-700">
                  {totalTasks} Units
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  Ops:
                </span>
                <span className="max-w-[100px] truncate text-[9px] font-black text-slate-700">
                  {implementedByLabel}
                </span>
              </div>
            </div>

            <details className="group mt-3.5 border-t border-slate-100 pt-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 outline-none transition-colors hover:text-indigo-600 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-2">
                  <FiLayout size={10} className="group-open:text-indigo-600" />
                  <span>Tactical Registry</span>
                </div>
                <div className="flex h-4 w-4 items-center justify-center rounded-md border border-slate-200 transition-transform group-open:rotate-180">
                  <svg
                    className="h-2 w-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={4}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </summary>
              <div className="custom-scrollbar mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {[...(feature.relatedTasks || [])]
                  .map((t) => tasksById[String(t?._id || t)] || t)
                  .sort((a, b) => {
                    const sA = normalizeStatus(a?.status);
                    const sB = normalizeStatus(b?.status);
                    if (sA === "completed" && sB !== "completed") return -1;
                    if (sA !== "completed" && sB === "completed") return 1;
                    return 0;
                  })
                  .map((task) => {
                    const tStatus = normalizeStatus(task?.status);
                    const isCompleted = tStatus === "completed";

                    return (
                      <div
                        key={String(task?._id || Math.random())}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-2 transition-all ${
                          isCompleted
                            ? "border-emerald-100 bg-emerald-50/30 opacity-70"
                            : "border-slate-100 bg-white hover:border-indigo-100 hover:shadow-xs"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[10px] font-black uppercase tracking-tight ${isCompleted ? "text-emerald-700 line-through" : "text-slate-700"}`}
                          >
                            {task?.title || "Operational Node"}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[7px] font-black uppercase tracking-widest ${
                              isCompleted
                                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                : tStatus === "in-progress" ||
                                    tStatus === "review"
                                  ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                                  : "border-slate-200 bg-slate-100 text-slate-500"
                            }`}
                          >
                            {tStatus?.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </details>
          </div>
        ) : (
          <div className="mt-4 space-y-3 border-t border-amber-100/50 pt-4">
            <div className="flex items-center gap-2 rounded-xl border border-amber-100/50 bg-amber-50/50 p-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">
                Null Resource State Detected
              </p>
            </div>
            {canManageFeatures && (
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={getTaskCount(featureId)}
                    onChange={(e) =>
                      updateTaskCount(featureId, parseInt(e.target.value) || 3)
                    }
                    disabled={
                      featureActionStatus === "loading" || isGeneratingTasks
                    }
                    className="h-9 w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (handleAIGenerateTasks) {
                      handleAIGenerateTasks(
                        featureId,
                        feature.name,
                        feature.description,
                        getTaskCount(featureId),
                      );
                    }
                  }}
                  disabled={
                    featureActionStatus === "loading" || isGeneratingTasks
                  }
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white text-[10px] font-black uppercase tracking-widest text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="text-sm">✨</span>
                  {isGeneratingTasks
                    ? "Synthesizing..."
                    : "Initialize Synthetic Tasks"}
                </button>
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/50 bg-slate-50/10 p-5 shadow-xs backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-black uppercase tracking-tight text-slate-900">
            Intelligence Registry
          </h2>
          <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            MISSION FEATURE DELIVERY & STATUS MATRIX
          </p>
        </div>
        {canManageFeatures && (
          <button
            onClick={() => setCreateFeatureDrawerOpen(true)}
            disabled={featureActionStatus === "loading"}
            className="group flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 group-hover:animate-ping"></div>
            Initialize Mission Feature
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-100/50 p-1">
          {["all", "pending", "in-progress", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f
                  ? "border border-slate-200 bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-xs">
            <span className="text-slate-400">Total Nodes:</span>{" "}
            {featureStats.total}
          </span>
        </div>
      </div>

      {!canManageFeatures && group && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Viewing Intelligence Only (Identity Restricted Area)
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {emptyFeatures.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">
              <span className="h-0.5 w-6 rounded-full bg-rose-500/20"></span>
              Critical Implementation Gaps
              <span className="h-0.5 w-full rounded-full bg-rose-500/10"></span>
            </h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {emptyFeatures.map((feature) =>
                renderFeatureCard(feature, false),
              )}
            </div>
          </div>
        )}

        {emptyFeatures.length > 0 && activeFeatures.length > 0 && (
          <div className="bg-gradient-to-r from-transparent via-slate-200 to-transparent px-20 py-[0.5px] opacity-50"></div>
        )}

        {activeFeatures.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-700">
              <span className="h-0.5 w-6 rounded-full bg-indigo-500/20"></span>
              Active Mission Threads
              <span className="h-0.5 w-full rounded-full bg-indigo-500/10"></span>
            </h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {activeFeatures.map((feature) =>
                renderFeatureCard(feature, true),
              )}
            </div>
          </div>
        )}

        {filteredFeatures.length === 0 && featuresStatus !== "loading" && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 px-6 py-12 text-center shadow-inner">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300">
              <FiLayout size={20} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-800">
              Operational Vacancy
            </p>
            <p className="mt-2 text-[10px] font-bold leading-relaxed uppercase tracking-widest text-slate-400">
              {filter !== "all"
                ? `No data signature matching '${filter}' sequence.`
                : canManageFeatures
                  ? "System initialized. Create mission feature to proceed."
                  : "No data segments available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureWorkspacePanel;
