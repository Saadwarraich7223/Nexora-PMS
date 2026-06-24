import { useEffect, useState, useMemo } from "react";
import { FiAward, FiBarChart2, FiLayers, FiUsers, FiCheckCircle, FiClock, FiSearch, FiTarget, FiBriefcase } from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import adminApi from "../api/adminApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError } from "../../../components/ui/toast.jsx";
import StatsCards from "../components/StatsCards.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";

const AdminEvaluationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [supStats, setSupStats] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [statsRes, deptRes, supRes, evalsRes] = await Promise.all([
          adminApi.fetchEvaluationStats(),
          adminApi.fetchEvaluationsByDepartment(),
          adminApi.fetchEvaluationsBySupervisor(),
          adminApi.fetchAllEvaluations(),
        ]);
        if (active) {
          setStats(statsRes.stats);
          setDeptStats(deptRes.stats);
          setSupStats(supRes.stats);
          setEvaluations(evalsRes.evaluations || []);
        }
      } catch (err) {
        if (active) showError(getErrorMessage(err, "Failed to load evaluation analytics."));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, []);

  const passRate = useMemo(() => {
    if (!stats?.distribution) return 0;
    return Math.round(((stats.distribution["60-79"] + stats.distribution["80-100"]) / stats.published) * 100) || 0;
  }, [stats]);

  const evaluationStats = useMemo(() => {
    if (!stats && !loading) return [];
    const baseStats = [
      { label: "Average Score", value: stats?.avgScore || 0, sub: "/ 100 System Avg", icon: <FiAward /> },
      { label: "Success Rate", value: `${passRate}%`, sub: "Scoring ≥ 60", icon: <FiBarChart2 /> },
      { label: "Grading Finished", value: stats?.published || 0, sub: `${stats?.drafts || 0} in progress`, icon: <FiCheckCircle /> },
      { label: "Pending Groups", value: stats?.pending || 0, sub: "Evaluation required", icon: <FiClock /> },
    ];
    return baseStats;
  }, [stats, passRate, loading]);

  const filteredEvals = useMemo(() => {
    return evaluations.filter((ev) => {
      const groupName = ev.project?.group?.name?.toLowerCase() || "";
      const dept = ev.project?.group?.department?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return groupName.includes(term) || dept.includes(term);
    });
  }, [evaluations, searchTerm]);

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Evaluations Hub</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Grading Metrics & Performance Analytics
        </p>
      </div>

      <div className="space-y-6">
        {/* KPI Layer */}
        <StatsCards stats={evaluationStats} status={loading ? "loading" : "succeeded"} />

        {/* Aggregate Analytics Layer */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          
          {/* Departmental Analytics */}
          <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                <FiLayers size={14} />
              </div>
              <div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Departmental Benchmarks</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Academic performance by sector</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sector</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Volume</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Grade</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Success</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`dept-loading-${i}`}>
                        <td className="px-6 py-3.5"><LoadingSkeleton className="h-4 w-24 rounded" /></td>
                        <td className="px-6 py-3.5 text-center"><LoadingSkeleton className="h-4 w-8 mx-auto rounded" /></td>
                        <td className="px-6 py-3.5 text-center"><LoadingSkeleton className="h-4 w-12 mx-auto rounded" /></td>
                        <td className="px-6 py-3.5 text-right"><LoadingSkeleton className="h-4 w-12 ml-auto rounded" /></td>
                      </tr>
                    ))
                  ) : deptStats.map((dept) => (
                    <tr key={dept.department} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-[11px] font-bold text-slate-700">{dept.department}</td>
                      <td className="px-6 py-3.5 text-center text-[11px] font-black text-slate-500">{dept.evaluatedGroups}</td>
                      <td className="px-6 py-3.5 text-center text-[11px] font-black text-indigo-600">{dept.avgScore}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${dept.passRate >= 70 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {dept.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supervisor Distribution */}
          <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                <FiUsers size={14} />
              </div>
              <div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Supervisor Efficacy</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Grading throughput per supervisor</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Done</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Drafts</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sup-loading-${i}`}>
                        <td className="px-6 py-3.5"><LoadingSkeleton className="h-4 w-32 rounded" /></td>
                        <td className="px-6 py-3.5 text-center"><LoadingSkeleton className="h-4 w-8 mx-auto rounded" /></td>
                        <td className="px-6 py-3.5 text-center"><LoadingSkeleton className="h-4 w-8 mx-auto rounded" /></td>
                        <td className="px-6 py-3.5 text-right"><LoadingSkeleton className="h-4 w-12 ml-auto rounded" /></td>
                      </tr>
                    ))
                  ) : supStats.map((sup) => (
                    <tr key={sup.supervisorId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-[11px] font-bold text-slate-700 truncate max-w-[140px]">{sup.supervisorName}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="text-[11px] font-black text-emerald-600">{sup.publishedCount}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`text-[11px] font-black ${sup.draftCount > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                          {sup.draftCount || "0"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right text-[11px] font-black text-teal-600">
                        {sup.avgScore > 0 ? sup.avgScore : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Registry Layer */}
        <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                  <FiTarget size={14} />
               </div>
               <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Global Evaluation Registry</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Master record of all project grades</p>
               </div>
            </div>
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Filter by group or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300 shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluated Entity & Project</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Domain</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsible Supervisor</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Final Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`registry-loading-${i}`}>
                        <td className="px-8 py-5">
                          <LoadingSkeleton className="h-4 w-40 rounded" />
                          <LoadingSkeleton className="h-3 w-24 rounded mt-1.5" />
                        </td>
                        <td className="px-8 py-5"><LoadingSkeleton className="h-4 w-24 rounded" /></td>
                        <td className="px-8 py-5"><LoadingSkeleton className="h-4 w-32 rounded" /></td>
                        <td className="px-8 py-5 text-center"><LoadingSkeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                        <td className="px-8 py-5 text-right"><LoadingSkeleton className="h-8 w-12 ml-auto rounded" /></td>
                      </tr>
                    ))
                  ) : filteredEvals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-4">
                           <FiBriefcase size={32} />
                        </div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">No Evaluations Found</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refine your search or filters to locate records.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEvals.map((ev) => (
                      <tr key={ev._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="text-[13px] font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{ev.project?.group?.name || "Unknown Group"}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[200px]">{ev.project?.title || "No Project Title"}</p>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{ev.project?.group?.department || "N/A"}</p>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-[11px] font-bold text-slate-600">{ev.project?.group?.supervisor?.name || "Pending Assignment"}</p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            ev.status === "published" 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {ev.status === "published" ? (
                            <div className="flex items-center justify-end gap-1.5">
                               <span className="text-lg font-black text-slate-800 tracking-tighter">{ev.groupGrade?.score}</span>
                               <span className="text-[10px] font-bold text-slate-400">/100</span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Draft System</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};
;

export default AdminEvaluationsPage;
