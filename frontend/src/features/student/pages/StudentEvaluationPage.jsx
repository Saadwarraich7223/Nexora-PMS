import { useEffect, useMemo, useState } from "react";
import { 
  FiAward, 
  FiLoader, 
  FiArrowLeft, 
  FiInfo, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiZap, 
  FiActivity, 
  FiLayers, 
  FiClock, 
  FiMessageSquare,
  FiUser
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import studentApi from "../api/studentApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError } from "../../../components/ui/toast.jsx";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import EvaluationStatusBadge from "../../projects/components/EvaluationStatusBadge.jsx";
import EvaluationLifecycle from "../../projects/components/EvaluationLifecycle.jsx";
import "../studentTheme.css";

const breakdownLabels = {
  deadlinePerformance: "Deadline Performance",
  featureCompletion: "Feature Completion",
  taskCompletion: "Task Completion",
  meetingEngagement: "Meeting Engagement",
  codeContribution: "Code Contribution",
  proposalQuality: "Proposal Quality",
};

const breakdownColors = {
  deadlinePerformance: "bg-violet-500",
  featureCompletion: "bg-emerald-500",
  taskCompletion: "bg-blue-500",
  meetingEngagement: "bg-amber-500",
  codeContribution: "bg-slate-600",
  proposalQuality: "bg-teal-500",
};

const memberStatLabels = {
  featuresImplemented: "Features",
  tasksCompleted: "Tasks",
  meetingAttendance: "Meetings",
  githubCommits: "Commits",
};

const StudentEvaluationPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { preview } = useSelector((state) => state.student);
  
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const projectId = preview?.project?._id;

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [evalRes, tasksRes, featuresRes, deadlinesRes] = await Promise.all([
          studentApi.fetchEvaluation(projectId),
          studentApi.fetchTasks().catch(() => ({ tasks: [] })),
          studentApi.fetchFeatures().catch(() => ({ features: [] })),
          studentApi.fetchDeadlines().catch(() => ({ deadlines: [] })),
        ]);

        if (active) {
          setEvaluation(evalRes.evaluation || null);
          
          const tasks = tasksRes.tasks || [];
          const features = featuresRes.features || [];
          const deadlines = deadlinesRes.deadlines || [];
          
          setMetrics({
            tasksCompleted: tasks.filter(t => t.status === "done" || t.status === "completed").length,
            tasksTotal: tasks.length,
            featuresCompleted: features.filter(f => f.status === "completed" || f.isCompleted).length,
            featuresTotal: features.length,
            deadlinesOnTime: deadlines.filter(d => d.status === "completed").length,
            deadlinesTotal: deadlines.length
          });
        }
      } catch (err) {
        if (active) showError(getErrorMessage(err, "Failed to load evaluation dataset."));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [projectId]);

  const stats = useMemo(() => {
    const myGrade = evaluation?.memberGrades?.find(
      (m) => String(m.student?._id || m.student) === String(user?._id)
    );
    const sortedGrades = [...(evaluation?.memberGrades || [])].sort((a, b) => b.score - a.score);
    const rank = evaluation 
      ? sortedGrades.findIndex((m) => String(m.student?._id || m.student) === String(user?._id)) + 1 
      : 0;

    return [
      { 
        label: "Final Outcome", 
        value: myGrade?.score ?? (evaluation ? "N/A" : 0), 
        sub: "Calculated Node", 
        icon: <FiAward />, 
        color: "text-emerald-600" 
      },
      { 
        label: "Cohort Rank", 
        value: rank > 0 ? `#${rank}` : 0, 
        sub: evaluation ? `Out of ${sortedGrades.length}` : "Cohort Hub", 
        icon: <FiTrendingUp />, 
        color: "text-indigo-600" 
      },
      { 
        label: "Group Base", 
        value: evaluation?.groupGrade?.score || 0, 
        sub: "Collective Grade", 
        icon: <FiLayers />, 
        color: "text-blue-600" 
      },
      { 
        label: "Signal Registry", 
        value: evaluation?.groupGrade?.teacherNote ? 1 : 0, 
        sub: "Supervisor Logs", 
        icon: <FiMessageSquare />, 
        color: "text-slate-900" 
      },
    ];
  }, [evaluation, user?._id]);

  if (!loading && !evaluation) {
    return (
      <DashboardShell>
        <div className="glass-card rounded-2xl p-12 text-center max-w-xl mx-auto mt-20 border border-white/60 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
            <FiAward size={120} className="text-slate-900" />
          </div>
          <div className="relative z-10">
            <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:rotate-12 transition-transform">
              <FiLoader className="text-slate-400 animate-spin" size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">Analytics Offline</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8 max-w-md mx-auto">
              Your final performance matrix has not been archived. Evaluation protocols will initialize once your supervisor publishes the tactical registry.
            </p>
            <button
              onClick={() => navigate("/student/projects")}
              className="h-11 px-8 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 mx-auto"
            >
              <FiArrowLeft size={14} />
              Return to Mission Node
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const groupGrade = evaluation?.groupGrade || {};
  const myGrade = evaluation?.memberGrades?.find(
    (m) => String(m.student?._id || m.student) === String(user?._id)
  );

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        {/* Orchestrator Header - Always Static Data */}
        <StudentPageHeader
          protocolName="Evaluation_Matrix_v3.1"
          title="Performance Analysis Command"
          subtitle="Strategic Academic Outcome & Lifecycle Analytics"
          groupName={preview?.group?.name || "RECOGNITION_NODE"}
          rightSide={
            <div className="flex items-center gap-2">
              {!loading && evaluation && (
                <EvaluationStatusBadge status={evaluation.status} />
              )}
              <button
                onClick={() => navigate("/student/projects")}
                className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-700 active:scale-95 shadow-md flex items-center gap-2"
              >
                <FiArrowLeft size={12} />
                Mission Node
              </button>
            </div>
          }
        />

        {/* Strategy KPI Layer - Standard Loading Logic */}
        <StatsCards 
          stats={stats} 
          status={loading ? "loading" : "succeeded"} 
        />

        <div className="flex flex-col xl:flex-row gap-6 items-stretch w-full min-w-0">
          {/* Sidebar: Lifecycle Vitality */}
          <div className="w-full xl:w-[400px] shrink-0 flex flex-col">
            <div className="glass-card bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col h-full border-white/60 backdrop-blur-xl">
              <div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
                  Lifecycle Vitality
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-70">
                  Real-time mission completion diagnostics.
                </p>
              </div>

              {loading ? (
                <div className="mt-8 space-y-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <LoadingSkeleton className="h-4 w-28 rounded" />
                        <LoadingSkeleton className="h-3 w-10 rounded" />
                      </div>
                      <LoadingSkeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                  <LoadingSkeleton className="h-24 w-full rounded-2xl mt-4" />
                </div>
              ) : (
                metrics && (
                <div className="mt-8 space-y-6">
                  {[
                    {
                      label: "Technical Features",
                      done: metrics.featuresCompleted,
                      total: metrics.featuresTotal,
                      color: "emerald",
                      icon: <FiLayers size={14} />,
                    },
                    {
                      label: "Tactical Tasks",
                      done: metrics.tasksCompleted,
                      total: metrics.tasksTotal,
                      color: "indigo",
                      icon: <FiActivity size={14} />,
                    },
                    {
                      label: "Academic Milestones",
                      done: metrics.deadlinesOnTime,
                      total: metrics.deadlinesTotal,
                      color: "violet",
                      icon: <FiClock size={14} />,
                    },
                  ].map((m) => {
                    const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
                    return (
                      <div key={m.label} className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-lg bg-${m.color}-50 text-${m.color}-600 flex items-center justify-center border border-${m.color}-100`}>
                              {m.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                              {m.label}
                            </p>
                          </div>
                          <span className="text-[10px] font-black text-slate-400">
                            {m.done}/{m.total}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full bg-${m.color}-500 rounded-full transition-all duration-1000`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <FiTrendingUp size={60} />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Effort Index</p>
                      <p className="text-3xl font-black tracking-tighter">
                        {metrics.tasksTotal > 0 ? Math.round((metrics.tasksCompleted / metrics.tasksTotal) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-auto pt-8">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-[10px] font-bold text-indigo-800 leading-relaxed italic">
                  <FiInfo className="inline-block mr-1 mb-0.5" />
                  "Evaluation metrics are calculated through a strategic fusion of collective group output and individualized tactical performance."
                </div>
              </div>
            </div>
          </div>

          {/* Workspace: Performance Matrix */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
            <div className="glass-card bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col border-white/60 backdrop-blur-xl min-h-[400px]">
              <div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
                  Grading Matrix Breakdown
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-70">
                  Strategic performance analysis across all project nodes.
                </p>
              </div>

              {loading ? (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="p-4 border border-slate-50 rounded-2xl space-y-3">
                      <LoadingSkeleton className="h-3 w-20 rounded" />
                      <LoadingSkeleton className="h-1 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {Object.entries(groupGrade.breakdown || {}).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${breakdownColors[key]}`}></div>
                          <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                            {breakdownLabels[key]}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{value}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${breakdownColors[key]} rounded-full transition-all duration-1000`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {(groupGrade.teacherNote || myGrade?.teacherNote) && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none ml-1">Supervisor Justification</h3>
                    {groupGrade.teacherNote && (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                          <FiLayers size={40} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Group Performance Logic</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed italic font-medium relative z-10">
                            "{groupGrade.teacherNote}"
                        </p>
                      </div>
                    )}
                    {myGrade?.teacherNote && (
                      <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 space-y-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                          <FiUser size={40} className="text-indigo-600" />
                        </div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Individual Assessment</p>
                        <p className="text-[11px] text-slate-700 leading-relaxed italic font-black relative z-10">
                            "{myGrade.teacherNote}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
                </>
              )}
            </div>

            {/* Contributor Benchmarking */}
            <div className="glass-card bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col border-white/60 backdrop-blur-xl">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none mb-6">
                Cohort Benchmarking
              </h2>
              {loading ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                   {[1, 2, 3].map(i => <LoadingSkeleton key={i} className="h-36 rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(evaluation?.memberGrades || []).sort((a,b) => b.score - a.score).map((m, idx) => {
                    const isMe = String(m.student?._id || m.student) === String(user?._id);
                    return (
                      <div key={m.student?._id || m.student} className={`p-4 rounded-2xl border transition-all ${isMe ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/10' : 'bg-white text-slate-800 border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                             <div className={`h-6 w-6 rounded-lg ${isMe ? 'bg-white/20' : 'bg-slate-100'} flex items-center justify-center text-[10px] font-black`}>
                               {idx + 1}
                             </div>
                             <p className="text-[11px] font-black uppercase tracking-tight truncate max-w-[100px]">
                              {m.student?.name || "Member"}
                             </p>
                          </div>
                          <span className={`text-sm font-black ${isMe ? 'text-white' : 'text-slate-900'}`}>{m.score}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(m.breakdown || {}).slice(0, 4).map(([k, v]) => (
                            <div key={k} className={`p-1.5 rounded-lg ${isMe ? 'bg-white/10 text-white/80' : 'bg-slate-50 text-slate-400'} text-center`}>
                              <p className="text-[8px] font-black uppercase tracking-widest mb-0.5">{memberStatLabels[k] || k}</p>
                              <p className={`text-[10px] font-black ${isMe ? 'text-white' : 'text-slate-800'}`}>{v}</p>
                            </div>
                          ))}
                        </div>
                        {isMe && <p className="mt-4 text-[8px] font-black uppercase tracking-[0.3em] text-indigo-200 text-center">TACTICAL_NODE_ME</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lifecycle History */}
            {evaluation && evaluation.activities && (
              <div className="glass-card bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col border-white/60 backdrop-blur-xl">
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none mb-6">
                  Evaluation Process Lifecycle
                </h2>
                <EvaluationLifecycle activities={evaluation.activities} />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StudentEvaluationPage;
