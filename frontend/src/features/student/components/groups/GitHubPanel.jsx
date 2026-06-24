import { useState } from "react";
import {
  FiGithub,
  FiRefreshCw,
  FiLink,
  FiUnlock,
  FiClock,
  FiGitCommit,
  FiAlertTriangle,
  FiBarChart2,
  FiUser,
  FiGitPullRequest,
  FiAlertCircle,
} from "react-icons/fi";

// -- Helpers ------------------------------------------------------------------

const fmtDate = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  if (isNaN(dt)) return "N/A";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtTime = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Build a 12-week grid grouped by month
const buildHeatmapGrid = (weeklyActivity = [], dailyActivity = []) => {
  const weeklyMap = new Map(weeklyActivity.map((w) => [w.week, w.count]));
  const dailyMap = new Map((dailyActivity || []).map((d) => [d.date, d.count]));

  const now = new Date();
  const months = [];
  let currentMonthObj = null;

  for (let i = 11; i >= 0; i--) {
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - (i * 7 + (now.getDay() || 7) - 1));
    weekStartDate.setHours(0, 0, 0, 0);

    const year = weekStartDate.getFullYear();
    const monthIndex = weekStartDate.getMonth();
    const monthName = weekStartDate.toLocaleDateString('en-US', { month: 'short' });

    // ISO Week Calculation
    const jan4 = new Date(year, 0, 4);
    const weekNum = 1 + Math.round(((weekStartDate - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
    const weekKey = `${year}-W${String(weekNum).padStart(2, "0")}`;
    const weekTotal = weeklyMap.get(weekKey) || 0;

    const days = [];
    for (let dIdx = 0; dIdx < 7; dIdx++) {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + dIdx);
      const dayKey = dayDate.toISOString().split("T")[0];
      const count = dailyMap.get(dayKey) || 0;
      days.push({ key: dayKey, count, date: dayDate });
    }

    const weekData = { key: weekKey, total: weekTotal, days };

    if (!currentMonthObj || currentMonthObj.monthIndex !== monthIndex) {
      currentMonthObj = { monthName, monthIndex, weeks: [] };
      months.push(currentMonthObj);
    }
    currentMonthObj.weeks.push(weekData);
  }
  return { months };
};

// -- Sub-components ------------------------------------------------------------

const ProtocolFrequencyGraph = ({ weeklyActivity = [], dailyActivity = [], authors = [] }) => {
  const { months } = buildHeatmapGrid(weeklyActivity, dailyActivity);
  const totalCommits = (weeklyActivity || []).reduce((s, w) => s + w.count, 0);
  const avgWeekly = totalCommits / 12;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-800 p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity">
        <FiBarChart2 size={80} className="text-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Protocol Frequency Graph</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1">High-Density Temporal Integration Matrix</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">Latency</span>
              {[0.1, 0.3, 0.6, 0.9].map((op, i) => (
                <div key={i} className="w-2 h-2 rounded-[1px] bg-indigo-500" style={{ opacity: op }} />
              ))}
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">Velocity</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between py-1 text-[7px] font-black text-slate-600 uppercase tracking-tighter w-4">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar shrink-0">
              {months.map((m, mIdx) => (
                <div key={mIdx} className="flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2 px-1">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{m.monthName}</span>
                     <div className="h-px w-6 bg-slate-800/80"></div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-800/60 flex gap-1">
                    {m.weeks.map((w) => (
                      <div key={w.key} className="flex flex-col gap-1 shrink-0">
                        {w.days.map((day) => (
                          <div
                            key={day.key}
                            className={`w-3 h-3 rounded-[2px] transition-all duration-300 hover:scale-150 hover:z-20 cursor-help ring-1 ring-white/5 relative group/node ${
                              day.count > 0 ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.25)]" : "bg-slate-700/40"
                            }`}
                            style={{ 
                              opacity: day.count > 0 ? Math.min(0.3 + (day.count * 0.2), 1) : 0.5 
                            }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/node:block z-50 pointer-events-none">
                               <div className="bg-slate-950 border border-slate-700 text-[8px] font-black text-slate-200 px-2 py-1 rounded shadow-2xl whitespace-nowrap uppercase tracking-widest">
                                 {day.key}: {day.count} nodes
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* -- Velocity Pulse Stream (Central Void Filler) -- */}
            <div className="flex-1 min-w-[200px] hidden md:flex flex-col h-full bg-slate-950/20 rounded-2xl border border-slate-800/40 p-4 relative group/chart overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                   <h5 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Velocity Pulse Stream</h5>
                   <div className="flex items-center gap-1.5 flex-nowrap">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[7px] font-black text-slate-600 uppercase">Live Pulse</span>
                   </div>
                </div>
                
                <div className="flex-1 flex items-end gap-1 px-1">
                   {(weeklyActivity || []).slice(-12).map((w, idx) => (
                      <div key={idx} className="flex-1 group/bar relative flex items-end h-full">
                         <div 
                           className="w-full bg-indigo-500/20 border-t border-indigo-500/40 rounded-t-[2px] transition-all group-hover/bar:bg-indigo-500/40"
                           style={{ height: `${Math.max(10, (w.count / (Math.max(...weeklyActivity.map(a => a.count)) || 1)) * 100)}%` }}
                         />
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block z-20">
                            <div className="bg-slate-950 border border-slate-700 text-[7px] font-black text-indigo-400 px-1.5 py-0.5 rounded whitespace-nowrap uppercase">
                               W{idx+1}: {w.count}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[7px] font-bold text-slate-600 uppercase leading-none">Peak Interval</span>
                      <span className="text-[10px] font-black text-slate-400 tabular-nums">
                         {(weeklyActivity || []).reduce((max, w) => Math.max(max, w.count), 0)} Nodes
                      </span>
                   </div>
                   <div className="h-6 w-px bg-slate-800/50" />
                   <div className="flex flex-col items-end">
                      <span className="text-[7px] font-bold text-slate-600 uppercase leading-none">Flux Index</span>
                      <span className="text-[10px] font-black text-emerald-500 tabular-nums">+14.2%</span>
                   </div>
                </div>
             </div>

          {/* -- Internal Intelligence Bridge (Filling the Gap) -- */}
          <div className="hidden min-w-[180px] flex-col gap-4 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 lg:flex relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-5">
                <FiGitCommit size={40} className="text-white" />
             </div>
             
             <div>
                <h5 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Registry Insights</h5>
                <div className="space-y-3">
                   {authors.slice(0, 2).map((a, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-300 uppercase truncate pr-2">{a.authorName}</span>
                            <span className="text-[9px] font-black text-indigo-400 tabular-nums">{a.count}</span>
                         </div>
                         <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${(a.count / authors[0].count) * 100}%` }} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="mt-auto flex flex-col gap-2 border-t border-slate-800/50 pt-3">
                <div className="flex justify-between items-baseline">
                   <span className="text-[7px] font-bold text-slate-600 uppercase">Deployment Flux</span>
                   <span className="text-[10px] font-black text-emerald-500 tracking-tighter">OPTIMIZED</span>
                </div>
                <div className="flex justify-between items-baseline">
                   <span className="text-[7px] font-bold text-slate-600 uppercase">Active Nodes</span>
                   <span className="text-[10px] font-black text-slate-400 tabular-nums">{totalCommits}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Signal Intensity</span>
                <div className="flex gap-1">
                  {[0.1, 0.4, 0.7, 1].map((lvl, idx) => (
                    <div 
                      key={idx} 
                      className="w-2.5 h-2.5 rounded-[2px] ring-1 ring-white/5"
                      style={{ backgroundColor: '#6366f1', opacity: lvl }}
                    />
                  ))}
                </div>
             </div>

             <div className="w-px h-8 bg-slate-800/50"></div>

             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Integration Synergy</span>
                <div className="flex items-baseline gap-1.5">
                   <span className="text-sm font-black text-slate-100 uppercase tabular-nums">
                     {avgWeekly > 5 ? "Optimized" : avgWeekly > 1 ? "Functional" : "Dormant"}
                   </span>
                   <span className="text-[7px] font-bold text-slate-500 uppercase">Status</span>
                </div>
             </div>
             
             <div className="w-px h-8 bg-slate-800/50"></div>

             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Weekly Velocity</span>
                <div className="flex items-baseline gap-1.5">
                   <span className="text-sm font-black text-slate-100 uppercase tabular-nums">{avgWeekly.toFixed(1)}</span>
                   <span className="text-[7px] font-bold text-slate-500 uppercase">Avg Nodes/W</span>
                </div>
             </div>
             
             <div className="w-px h-8 bg-slate-800/50"></div>

             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Temporal Depth</span>
                <div className="flex items-baseline gap-1.5">
                   <span className="text-sm font-black text-slate-100 uppercase tabular-nums">12</span>
                   <span className="text-[7px] font-bold text-slate-500 uppercase">Cycles Active</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/60">
             <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Network Latency</span>
                <span className="text-[9px] font-black text-indigo-400">42ms Stable</span>
             </div>
             <div className="flex items-center gap-2 border-l border-slate-800/50 pl-4">
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">Transmission Active</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommitBars = ({ commits }) => {
  if (!commits || commits.length === 0) {
    return (
      <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          No contribution data recovered.
        </p>
      </div>
    );
  }
  const sorted = [...commits].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count || 1;
  return (
    <div className="space-y-2.5">
      {sorted.map((c) => (
        <div key={c.authorEmail} className="group relative bg-slate-50/60 p-3 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-all">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] text-slate-900 font-black shadow-sm">
                {(c.authorName || "?")[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-800">
                  {c.authorName || c.authorEmail}
                </span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Authorized Contributor</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-indigo-600 tabular-nums">
                 {c.count} nodes
               </span>
               <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active Velocity</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200/50 overflow-hidden relative border border-slate-200/40">
            <div
              className="h-full rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)] transition-all duration-700 ease-out"
              style={{ width: `${Math.round((c.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentFeed = ({ recentCommits }) => {
  if (!recentCommits || recentCommits.length === 0) {
    return (
      <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          No activity snapshots found.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
      {recentCommits.map((c) => (
        <div
          key={c.sha}
          className="group flex flex-col p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
             <FiGitCommit size={30} className="text-slate-900" />
          </div>
          
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
               <div className="w-5 h-5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <FiGitCommit className="text-indigo-500" size={10} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 truncate">
                {c.message}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 shadow-sm">
               <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest font-mono">
                 {c.sha?.substring(0, 7)}
               </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[7px] text-slate-900 font-black overflow-hidden shadow-inner">
                     {(c.authorName || "?")[0].toUpperCase()}
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                   {c.authorName}
                 </span>
               </div>
               <div className="w-px h-2.5 bg-slate-100"></div>
               <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <FiClock size={10} className="text-slate-300" />
                  {fmtDate(c.date)}
               </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// -- Main Component ------------------------------------------------------------

const GitHubPanel = ({
  group,
  isLeader,
  onLink,
  onSync,
  onUnlink,
  actionLoading,
}) => {
  const [repoInput, setRepoInput] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);

  const github = group?.github || {};
  const isLinked = !!github.repoUrl;
  const lastSync = fmtTime(github.lastSync);

  const handleLink = () => {
    if (!repoInput.trim()) return;
    onLink(repoInput.trim());
    setRepoInput("");
    setShowLinkForm(false);
  };

  return (
    <div className=" p-5 space-y-4 transition-all border border-slate-200 rounded-xl">
      {/* -- Header -- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg transform -rotate-1">
            <FiGithub className="text-white" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-800">
                GitHub Intelligence
              </h3>
              {isLinked && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  Stream: Active
                </span>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
              {isLinked ? github.repoUrl : "No repository linked"}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isLinked && (
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-200/60 bg-white px-2 py-1.5 rounded-lg shadow-sm">
                <FiClock size={10} /> Synced {lastSync}
              </span>
            )}
            {isLeader && (
              <>
                <button
                  onClick={onSync}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
                  title="Sync latest commits from GitHub"
                >
                  <FiRefreshCw
                    size={10}
                    className={actionLoading ? "animate-spin" : ""}
                  />
                  Sync Core
                </button>
                <button
                  onClick={onUnlink}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-50"
                  title="Unlink this repository"
                >
                  <FiUnlock size={10} />
                  Purge Link
                </button>
              </>
            )}
          </div>
        )}

        {!isLinked && isLeader && (
          <button
            onClick={() => setShowLinkForm((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-950 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all active:scale-95"
          >
            <FiLink size={12} />
            Link Repository
          </button>
        )}
      </div>

      {/* -- Link Form (leader only, repo not linked) -- */}
      {!isLinked && isLeader && showLinkForm && (
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-slate-600">
            Enter your public GitHub repository URL:
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
            <button
              onClick={handleLink}
              disabled={!repoInput.trim() || actionLoading}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Connect
            </button>
          </div>
          <p className="text-[9px] text-slate-400 flex items-center gap-1">
            <FiAlertTriangle size={9} className="text-amber-500" />
            Only public repositories are supported. Private repos require a
            GitHub token.
          </p>
        </div>
      )}

      {/* -- Not Linked + Not Leader -- */}
      {!isLinked && !isLeader && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
          <FiGithub className="mx-auto text-slate-300 mb-2" size={24} />
          <p className="text-xs font-semibold text-slate-500">
            No repository linked yet
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Ask your group leader to connect a GitHub repository.
          </p>
        </div>
      )}

      {/* -- Premium KPI Cards -- */}
      {isLinked && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative group overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiGitCommit size={40} className="text-slate-900" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Total Commits
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter tabular-nums">
                  {github.totalCommits || 0}
                </span>
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">
                  Nodes
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
          </div>

          <div className="relative group overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiUser size={40} className="text-slate-900" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Contributors
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter tabular-nums">
                  {(github.commits || []).length}
                </span>
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                  Entities
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-emerald-500 transition-colors"></div>
          </div>

          <div className="relative group overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md hover:border-amber-200">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiBarChart2 size={40} className="text-slate-900" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Peak Velocity
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter tabular-nums">
                  {(github.weeklyActivity || []).reduce(
                    (max, w) => Math.max(max, w.count),
                    0,
                  )}
                </span>
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                  W-Peak
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-amber-500 transition-colors"></div>
          </div>

          {/* Merged PRs */}
          <div className="relative group overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md hover:border-violet-200">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiGitPullRequest size={40} className="text-slate-900" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Merged PRs
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter tabular-nums">
                  {github.stats?.mergedPRs || 0}
                </span>
                <span className="text-[8px] font-black text-violet-500 uppercase tracking-widest">
                  Merged
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-violet-500 transition-colors"></div>
          </div>

          {/* Closed Issues */}
          <div className="relative group overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md hover:border-rose-200">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiAlertCircle size={40} className="text-slate-900" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Closed Issues
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter tabular-nums">
                  {github.stats?.closedIssues || 0}
                </span>
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                  Resolved
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-rose-500 transition-colors"></div>
          </div>
        </div>
      )}

      {/* -- Protocol Frequency Graph -- */}
      {isLinked && (
        <ProtocolFrequencyGraph 
           weeklyActivity={github.weeklyActivity} 
           dailyActivity={github.dailyActivity}
           authors={github.commits}
        />
      )}

      {/* -- Two-column: Commit Bars + Recent Feed -- */}
      {isLinked && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-card relative overflow-hidden group/registry">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover/registry:opacity-[0.05] transition-opacity">
               <FiBarChart2 size={60} className="text-slate-900" />
            </div>
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                   Per-Author Commits
                 </p>
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Contribution Registry</span>
            </div>
            <CommitBars commits={github.commits} />
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-card relative overflow-hidden group/activity">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover/activity:opacity-[0.05] transition-opacity">
               <FiGitCommit size={60} className="text-slate-900" />
            </div>
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                   Recent Commits
                 </p>
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Activity Log</span>
            </div>
            <RecentFeed recentCommits={github.recentCommits} />
          </div>
        </div>
      )}

      {/* -- Pull Requests Feed -- */}
      {isLinked && (github.pullRequests || []).length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Pull Requests</p>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              {github.stats?.openPRs || 0} Open · {github.stats?.mergedPRs || 0} Merged
            </span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {(github.pullRequests || []).slice(0, 10).map((pr) => (
              <a
                key={pr.githubId}
                href={pr.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-100 hover:bg-violet-50/30 transition-all group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FiGitPullRequest size={12} className={pr.mergedAt ? "text-violet-500" : pr.state === "open" ? "text-emerald-500" : "text-slate-400"} />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">#{pr.number} {pr.title}</span>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  pr.mergedAt ? "bg-violet-50 text-violet-600 border-violet-200" :
                  pr.state === "open" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {pr.mergedAt ? "Merged" : pr.state}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubPanel;
