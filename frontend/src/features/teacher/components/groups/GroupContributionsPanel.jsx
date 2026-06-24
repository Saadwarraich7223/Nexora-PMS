import { FiAward, FiCheckSquare, FiLayout, FiFileText, FiGithub, FiCalendar, FiChevronRight, FiTrendingUp } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

// Colour palette for rank positions
const RANK_STYLES = [
  { ring: "ring-4 ring-amber-400 group-hover:ring-amber-500", badge: "bg-amber-400", shadow: "shadow-amber-200/50", label: "🥇" },
  { ring: "ring-4 ring-slate-300 group-hover:ring-slate-400", badge: "bg-slate-300", shadow: "shadow-slate-200/50", label: "🥈" },
  { ring: "ring-4 ring-orange-300 group-hover:ring-orange-400", badge: "bg-orange-300", shadow: "shadow-orange-200/50", label: "🥉" },
];

const METRIC_DEFS = [
  { key: "tasksCompleted",     icon: FiCheckSquare, label: "Tasks",    color: "bg-emerald-500", border: "border-emerald-100" },
  { key: "featuresImplemented",icon: FiLayout,      label: "Modules",  color: "bg-violet-500", border: "border-violet-100" },
  { key: "resourcesUploaded",  icon: FiFileText,    label: "Assets",   color: "bg-sky-500", border: "border-sky-100" },
  { key: "githubCommits",      icon: FiGithub,      label: "Commits",  color: "bg-slate-700", border: "border-slate-200" },
  { key: "meetingsAttended",   icon: FiCalendar,    label: "Events",   color: "bg-rose-500", border: "border-rose-100" },
];

const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const GroupContributionsPanel = ({ contributions, status }) => {
  if (status === "loading") {
    return (
      <div className="glass-card bg-white/60 border-none shadow-sm rounded-[32px] p-6 space-y-4">
        <LoadingSkeleton className="h-4 w-1/3 mb-6 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <LoadingSkeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton className="h-4 w-1/4 rounded" />
              <LoadingSkeleton className="h-2 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!contributions || contributions.length === 0) return null;

  // Sort by percentage descending
  const sorted = [...contributions].sort((a, b) => b.percentage - a.percentage);
  const maxScore = sorted[0]?.percentage || 1;

  return (
    <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="flex items-center gap-3">
           <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm"><FiAward size={16}/></div>
           <div>
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Contribution Analysis</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Multi-dimensional member engagement audit</p>
           </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 shadow-sm">
          {sorted.length} Operators
        </span>
      </div>

      {/* Members */}
      <div className="space-y-3">
        {sorted.map((c, idx) => {
          const rank = RANK_STYLES[idx] || null;
          const m = c.metrics || {};
          const name = c.user?.name || "Unknown";
          const isFreeRider = (m.tasksAssigned || 0) > 0 && (m.githubCommits || 0) === 0;
          const isLowContrib = c.percentage < 10 && sorted.length > 1;

          return (
            <div
              key={c.user?._id || idx}
              className={`group rounded-xl p-5 border transition-all duration-300 ${
                idx === 0
                  ? "bg-amber-50/20 border-amber-100 shadow-lg shadow-amber-500/5 ring-4 ring-amber-50/30"
                  : "bg-white border-slate-50 hover:bg-white hover:border-slate-200 hover:shadow shadow-sm"
              }`}
            >
              {/* Row 1: Avatar + Name + Overall % */}
              <div className="flex items-center gap-4 mb-5">
                {/* Avatar */}
                <div className={`relative w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg border-2 border-white transition-all ${rank?.ring || "ring-4 ring-slate-50 group-hover:ring-indigo-50"}`}>
                  {initials(name)}
                  {rank && (
                    <div className={`absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full ${rank.badge} flex items-center justify-center text-[10px] shadow border-2 border-white ${rank.shadow}`}>
                       {rank.label}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${idx === 0 ? "text-amber-700" : "text-slate-800 group-hover:text-indigo-600"}`}>{name}</p>
                    <div className="flex items-center gap-1.5">
                       {idx === 0 && <FiTrendingUp className="text-amber-500 animate-pulse" size={14} />}
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border shadow-sm ${
                         isLowContrib ? "bg-rose-50 text-rose-600 border-rose-100" : 
                         idx === 0 ? "bg-amber-100 text-amber-700 border-amber-200" :
                         "bg-emerald-50 text-emerald-600 border-emerald-100"
                       }`}>
                         {c.percentage}% Engagement
                       </span>
                    </div>
                  </div>
                  {/* Overall progress bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        idx === 0 ? "bg-amber-400" : 
                        isLowContrib ? "bg-rose-400" : 
                        "bg-indigo-500"
                      }`}
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Metric chips */}
              <div className="flex flex-wrap gap-2">
                {METRIC_DEFS.map(({ key, label, color }) => {
                  const val = key === "tasksCompleted"
                    ? `${m.tasksCompleted || 0}/${m.tasksAssigned || 0}`
                    : m[key] || 0;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-slate-50/50 border border-slate-100/50 rounded-lg px-2 py-1 transition-all hover:bg-white hover:shadow-sm"
                    >
                      <div className={`w-1 h-1 rounded-full ${color} shrink-0`} />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                      <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight tabular-nums">{val}</span>
                    </div>
                  );
                })}
              </div>

              {/* Warnings / Status Flags */}
              {(isFreeRider || isLowContrib) && (
                <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg border text-[9px] font-black uppercase tracking-widest ${isFreeRider ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                   <div className="h-5 w-5 rounded-md bg-white/50 flex items-center justify-center shrink-0 shadow-sm">!</div>
                   {isFreeRider ? "Critical: High Task Load vs Zero Commits" : "Observation: Sub-optimal Engagement"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend / Key */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4 px-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Attribution</p>
        <div className="flex flex-wrap gap-4">
          {METRIC_DEFS.map(({ key, label, color }) => (
            <span key={key} className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupContributionsPanel;
