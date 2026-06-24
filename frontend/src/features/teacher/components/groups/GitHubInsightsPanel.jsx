import { FiGithub, FiActivity, FiGitCommit, FiClock, FiExternalLink, FiBarChart2, FiAlertCircle, FiGitPullRequest, FiUser } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const GitHubInsightsPanel = ({ workspace, status }) => {
  if (status === "loading") {
    return (
      <div className="glass-card bg-white/60 border-none shadow-sm rounded-[32px] p-6 space-y-6">
        <LoadingSkeleton className="h-4 w-1/3 rounded" />
        <LoadingSkeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-3">
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const github = workspace?.group?.github || {};
  const commits = github.recentCommits || [];
  const dailyActivity = github.dailyActivity || [];
  const dailyMap = new Map(dailyActivity.map((d) => [d.date, d.count]));

  // Build a 12-week grid grouped by month
  const now = new Date();
  const weeksData = [];
  for (let i = 11; i >= 0; i--) {
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - (i * 7 + (now.getDay() || 7) - 1));
    weekStartDate.setHours(0, 0, 0, 0);

    const days = [];
    for (let dIdx = 0; dIdx < 7; dIdx++) {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + dIdx);
      const dayKey = dayDate.toISOString().split("T")[0];
      const count = dailyMap.get(dayKey) || 0;
      days.push({ key: dayKey, count, day: dayDate.toLocaleDateString('en-US', { weekday: 'short' }) });
    }
    weeksData.push({ key: i, days });
  }

  return (
    <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-1">
        <div className="flex items-center gap-3">
           <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10"><FiGithub size={16}/></div>
           <div>
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">VCS Intelligence Matrix</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Real-time repository health & activity frequency</p>
           </div>
        </div>
        
        {github.repoUrl && (
          <a 
            href={github.repoUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FiExternalLink /> Source Node
          </a>
        )}
      </div>

      {/* Modern Heatmap Visual */}
      <div className="mb-6 p-4 bg-slate-900 rounded-xl shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <FiBarChart2 size={60} className="text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Frequency Graph</p>
             <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">Less</span>
                {[0.1, 0.4, 0.7, 1.0].map((op, i) => (
                   <div key={i} className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500" style={{ opacity: op }} />
                ))}
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">More</span>
             </div>
          </div>
          
          <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            {weeksData.map((w) => (
              <div key={w.key} className="flex flex-col gap-1 shrink-0">
                {w.days.map((day) => {
                  const count = day.count;
                  let opacity = 0.1;
                  if (count > 10) opacity = 1.0;
                  else if (count > 5) opacity = 0.7;
                  else if (count > 0) opacity = 0.4;

                  return (
                    <div 
                      key={day.key} 
                      className="w-2.5 h-2.5 rounded-[2px] transition-all hover:scale-125 cursor-help ring-1 ring-white/5 bg-indigo-500"
                      style={{ opacity }}
                      title={`${day.key}: ${count} commits`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commit Registry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Recent Activity Protocols</p>
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{commits.length} Snapshots</span>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {commits.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
               <FiActivity className="mx-auto text-slate-300 mb-2" size={18} />
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No activity snapshots recovered.</p>
            </div>
          ) : (
            commits.map((commit, idx) => (
              <div 
                key={commit.sha || idx} 
                className="group p-4 bg-white border border-slate-100/80 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all flex items-start gap-4"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors shrink-0 shadow-inner">
                   <FiGitCommit size={14} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                     <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest truncate group-hover:text-indigo-600 transition-colors">
                       {commit.message}
                     </p>
                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest shrink-0 font-mono">
                        {(commit.sha || "0000000").substring(0, 7)}
                     </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-slate-900 border border-white shadow-sm flex items-center justify-center text-[7px] text-white font-black">
                           {(commit.authorName || "?")[0]}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                           {commit.authorName || "System Unit"}
                        </span>
                     </div>
                     <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                     <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                        <FiClock size={10} />
                        {new Date(commit.date).toLocaleDateString()}
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vital Stats */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
         <div className="bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl shadow-sm relative group overflow-hidden">
            <FiGitCommit className="absolute -right-2 -bottom-2 text-slate-900 opacity-5 group-hover:opacity-10 transition-opacity" size={48} />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Commits</p>
            <p className="text-xl font-black text-slate-800 uppercase tabular-nums tracking-tighter">{github.totalCommits || 0}</p>
         </div>
         <div className="bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl shadow-sm relative group overflow-hidden">
            <FiGitPullRequest className="absolute -right-2 -bottom-2 text-slate-900 opacity-5 group-hover:opacity-10 transition-opacity" size={48} />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Merged PRs</p>
            <p className="text-xl font-black text-slate-800 uppercase tabular-nums tracking-tighter">{github.stats?.mergedPRs || 0}</p>
         </div>
         <div className="bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl shadow-sm relative group overflow-hidden">
            <FiAlertCircle className="absolute -right-2 -bottom-2 text-slate-900 opacity-5 group-hover:opacity-10 transition-opacity" size={48} />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Closed Issues</p>
            <p className="text-xl font-black text-slate-800 uppercase tabular-nums tracking-tighter">{github.stats?.closedIssues || 0}</p>
         </div>
         <div className="bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Integration</p>
            <p className={`text-xl font-black uppercase tracking-tighter ${github.totalCommits > 0 ? "text-emerald-600" : "text-amber-500"}`}>
               {github.totalCommits > 0 ? "Stable" : "Idle"}
            </p>
         </div>
      </div>

      {/* Alert Case */}
      {github.totalCommits === 0 && (
        <div className="mt-4 flex items-center gap-3 bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 shadow-inner">
           <FiAlertCircle className="text-amber-500 shrink-0" size={16} />
           <p className="text-[9px] font-bold text-amber-700 uppercase tracking-tight leading-relaxed">
             Zero code activity detected in registry. Synchronize student identities with VCS profiles to recover snapshots.
           </p>
        </div>
      )}
    </div>
  );
};

export default GitHubInsightsPanel;
