import { useMemo, useState } from "react";
import { FiArrowUp, FiChevronDown, FiLoader, FiPaperclip, FiSearch } from "react-icons/fi";

const getFeatureStatus = (feature) => {
  const progress = Number(feature?.progress || 0);
  if (progress >= 100) return "completed";

  const hasActive = (feature?.relatedTasks || []).some((task) => {
    const value = String(task?.status || "").toLowerCase();
    return ["in-progress", "in_progress", "review"].includes(value);
  });

  if (hasActive) return "in_progress";
  return "pending";
};

const statusStyles = {
  completed: {
    badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  in_progress: {
    badge: "bg-blue-50 border-blue-200 text-blue-700",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
  },
  pending: {
    badge: "bg-slate-100 border-slate-200 text-slate-600",
    bar: "bg-slate-400",
    dot: "bg-slate-400",
  },
};

const buildMemberProgress = (feature) => {
  const map = new Map();

  (feature?.relatedTasks || []).forEach((task) => {
    const owner = task?.assignedTo || task?.createdBy;
    const ownerId = String(owner?._id || owner || "unknown");
    const ownerName = owner?.name || "Unassigned";

    if (!map.has(ownerId)) {
      map.set(ownerId, { id: ownerId, name: ownerName, total: 0, completed: 0, inProgress: 0 });
    }

    const entry = map.get(ownerId);
    entry.total += 1;

    const status = String(task?.status || "todo").toLowerCase();
    if (["completed", "done"].includes(status)) entry.completed += 1;
    else if (["in-progress", "in_progress", "review"].includes(status)) entry.inProgress += 1;
  });

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
};

const ProjectFeaturesPanel = ({ features, loading, onPreviewResource }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const decorated = useMemo(
    () =>
      (features || []).map((feature) => ({
        ...feature,
        status: getFeatureStatus(feature),
        resources: feature.resources || [],
        memberProgress: buildMemberProgress(feature),
      })),
    [features],
  );

  const filtered = useMemo(() => {
    return decorated.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !String(f.name || "").toLowerCase().includes(q) &&
          !String(f.description || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [decorated, statusFilter, query]);

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl p-5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-1">
        <div>
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Feature Matrix</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
            Unit Delivery & Task Ownership Tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
             {filtered.length} Indexed
           </span>
        </div>
      </div>

      {/* Modern filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-6 px-1">
        <div className="relative flex-1 w-full group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={12} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="FILTER NODES..."
            className="w-full h-9 pl-9 pr-4 bg-slate-50/50 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
          {["all", "pending", "in_progress", "completed"].map((v) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`rounded-md px-2.5 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${
                statusFilter === v
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {v === "all" ? "All" : v === "in_progress" ? "Active" : v}
            </button>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-12">
             <FiLoader className="text-slate-300 animate-spin" size={20} />
          </div>
        )}

        {!loading &&
          filtered.map((feature) => {
            const tone = statusStyles[feature.status] || statusStyles.pending;
            const progress = Math.max(0, Math.min(100, Number(feature.progress || 0)));
            const isOpen = expandedId === feature._id;
            const taskCount = feature.relatedTasks?.length || 0;

            return (
              <div
                key={feature._id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                   isOpen ? "border-slate-200 bg-slate-50/30 shadow-md" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/20"
                }`}
              >
                {/* Header row */}
                <button
                  onClick={() => toggle(feature._id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors relative"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full shadow-sm ${tone.dot}`} />

                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black uppercase tracking-tight truncate ${isOpen ? "text-slate-900" : "text-slate-700"}`}>
                      {feature.name || "UNNAMED_FEATURE"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 opacity-60">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {taskCount} TASKS · {feature.memberProgress.length} CONTRIBUTORS
                       </p>
                    </div>
                  </div>

                  {/* Inline progress */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 border border-slate-200/50 shadow-inner overflow-hidden">
                      <div className={`h-full rounded-full ${tone.bar} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-800 w-8 text-right underline underline-offset-4 decoration-indigo-500/30">{progress}%</span>
                  </div>

                  <span className={`rounded-lg border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest shrink-0 ${tone.badge}`}>
                    {feature.status.replace("_", " ")}
                  </span>

                  <FiChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-500" : ""}`}
                  />
                </button>

                {/* Expandable detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-5 space-y-5 bg-white/50 animate-in slide-in-from-top-1 duration-300">
                    {feature.description && (
                      <div className="space-y-1.5">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Context</p>
                         <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight opacity-80">{feature.description}</p>
                      </div>
                    )}

                    {/* Member progress */}
                    {feature.memberProgress.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ownership Matrix</p>
                        <div className="grid gap-2.5">
                          {feature.memberProgress.map((m) => (
                            <div key={m.id} className="flex items-center gap-4 p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                              <span className="text-[9px] font-black text-slate-700 w-28 truncate uppercase tracking-widest">{m.name}</span>
                              <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                                  style={{ width: `${m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-black text-slate-500 w-12 text-right uppercase tracking-widest">{m.completed} / {m.total}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {feature.resources.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Linked Assets</p>
                        <div className="flex flex-wrap gap-2">
                          {feature.resources.map((resource) => (
                            <button
                              key={resource._id}
                              onClick={() => onPreviewResource(resource)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                            >
                              <FiPaperclip size={10} className="text-slate-400" />
                              <span className="truncate max-w-[150px]">{resource.originalName || "ASSET_NODE"}</span>
                              <FiArrowUp size={10} className="rotate-45 text-indigo-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching features found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectFeaturesPanel;
