import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiActivity,
  FiCode,
  FiFileText,
  FiClock,
  FiInfo,
  FiTrendingUp,
  FiChevronDown,
  FiChevronUp,
  FiLayers,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import teacherApi from "../api/teacherApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import "../teacherTheme.css";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

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

const breakdownBadgeColors = {
  deadlinePerformance: "text-violet-700 bg-violet-50 border-violet-200",
  featureCompletion: "text-emerald-700 bg-emerald-50 border-emerald-200",
  taskCompletion: "text-blue-700 bg-blue-50 border-blue-200",
  meetingEngagement: "text-amber-700 bg-amber-50 border-amber-200",
  codeContribution: "text-slate-700 bg-slate-50 border-slate-200",
  proposalQuality: "text-teal-700 bg-teal-50 border-teal-200",
};

const memberBreakdownLabels = {
  featuresImplemented: "Features",
  tasksCompleted: "Tasks",
  meetingAttendance: "Meetings",
  githubCommits: "Commits",
};

const criteriaLabels = {
  allFeaturesCompleted: "All Features Completed",
  taskCompletionMet: "Tasks ≥ 80% Complete",
  allDeadlinesResolved: "All Deadlines Resolved",
  filesUploaded: "Files Uploaded",
};

const EvaluationSkeleton = () => (
  <div className="space-y-6">
    {/* Orchestrator Header Skeleton */}
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <button className="h-10 w-10 shrink-0 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-900/10 hover:scale-105 transition-transform">
          <FiArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Evaluation Command
            <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-100 flex items-center gap-1 shadow-sm">
              <FiAlertCircle size={10} /> Draft Status
            </span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            {"Strategic Objective Retrieval..."}
            <span className="h-1 w-1 rounded-full bg-slate-200"></span>
            {"Cohort Registry".toUpperCase()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="h-10 px-6 rounded-xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
          Registry
        </button>

        <button className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 active:scale-95 disabled:opacity-50">
          <FiZap size={14} />
          "Publish Metrics"
        </button>
      </div>
    </div>

    <div className="flex flex-col xl:flex-row gap-6 items-start">
      <div className="w-full xl:w-[400px] shrink-0 space-y-6">
        <div className="glass-card bg-white/90 border border-slate-200 shadow-sm rounded-2xl p-6 space-y-8">
          <div className="space-y-4">
            <LoadingSkeleton className="h-4 w-32 rounded-md" />
            <div className="space-y-6">
              {[1, 2, 3, 4, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-2">
                  <LoadingSkeleton className="h-2 w-full rounded-full" />
                  <div className="flex justify-between items-center">
                    <LoadingSkeleton className="h-4 w-20 rounded-md" />
                    <LoadingSkeleton className="h-4 w-4 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-6">
        <div className="glass-card bg-white/90 border border-slate-200 shadow-sm rounded-2xl p-6 space-y-8">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <LoadingSkeleton className="h-6 w-48 rounded-lg" />
              <LoadingSkeleton className="h-3 w-64 rounded-md" />
            </div>
            <LoadingSkeleton className="h-10 w-44 rounded-xl" />
          </div>
          <div className="flex gap-6 items-center p-6 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
            <LoadingSkeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-3 flex-1">
              <LoadingSkeleton className="h-4 w-1/3" />
              <LoadingSkeleton className="h-12 w-full" />
            </div>
          </div>
          <LoadingSkeleton className="h-40 w-full rounded-2xl border border-dotted border-slate-200" />
        </div>
      </div>
    </div>

    {/* Registry Skeleton */}
    <div className="bg-white/90 border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-5 w-40 rounded-lg" />
        <LoadingSkeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-100 bg-white space-y-4"
          >
            <div className="flex justify-between">
              <LoadingSkeleton className="h-4 w-1/2" />
              <LoadingSkeleton className="h-10 w-10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
            </div>
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TeacherEvaluationPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [metrics, setMetrics] = useState(null);
  const [checks, setChecks] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [suggested, setSuggested] = useState(null);
  const [existing, setExisting] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Editable state
  const [groupScore, setGroupScore] = useState("");
  const [groupAdjustment, setGroupAdjustment] = useState(0);
  const [groupNote, setGroupNote] = useState("");
  const [memberEdits, setMemberEdits] = useState([]);
  const [isJustifying, setIsJustifying] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showLogicModal, setShowLogicModal] = useState(false);
  const [expandedMath, setExpandedMath] = useState({});

  const toggleMath = (idx) => {
    setExpandedMath((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    if (projectId) loadAll();
  }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [metricsRes, suggestedRes, existingRes] = await Promise.all([
        teacherApi.fetchCompletionMetrics(projectId),
        teacherApi.fetchSuggestedGrades(projectId),
        teacherApi.fetchEvaluation(projectId),
      ]);

      setMetrics(metricsRes.metrics);
      setChecks(metricsRes.checks);
      setIsReady(metricsRes.isReadyForCompletion);
      setSuggested(suggestedRes);

      try {
        const projRes = await teacherApi.fetchProjectProposals("all");
        const proj = (projRes.projects || []).find((p) => p._id === projectId);
        setProjectInfo(proj || null);
      } catch (_) {}

      if (existingRes.evaluation) {
        setExisting(existingRes.evaluation);
        const eg = existingRes.evaluation.groupGrade;
        setGroupScore(eg.score ?? "");
        setGroupAdjustment(eg.teacherAdjustment || 0);
        setGroupNote(eg.teacherNote || "");
        setMemberEdits(
          existingRes.evaluation.memberGrades.map((m) => ({
            student: m.student?._id || m.student,
            studentName: m.student?.name || "Unknown",
            studentEmail: m.student?.email || "",
            score: m.score,
            breakdown: m.breakdown,
            teacherAdjustment: m.teacherAdjustment || 0,
            teacherNote: m.teacherNote || "",
          })),
        );
      } else {
        setGroupScore(suggestedRes.groupGrade.score);
        setGroupAdjustment(0);
        setGroupNote("");
        setMemberEdits(
          suggestedRes.memberGrades.map((m) => ({
            student: m.student,
            studentName: m.studentName,
            studentEmail: m.studentEmail,
            score: m.score,
            breakdown: m.breakdown,
            teacherAdjustment: 0,
            teacherNote: "",
          })),
        );
      }

      // Load Templates
      const templRes = await teacherApi.fetchGradingTemplates();
      setTemplates(templRes.templates || []);
    } catch (err) {
      showError(getErrorMessage(err, "Failed to load evaluation data."));
    } finally {
      setLoading(false);
    }
  };

  const handleAIJustify = async () => {
    setIsJustifying(true);
    try {
      const data = await teacherApi.fetchAIEvaluationJustification(projectId);
      if (data.justification) {
        setGroupNote(data.justification);
        setAiAnalysis(data);
        showSuccess("AI justification generated.");
      }
    } catch (err) {
      showError(getErrorMessage(err, "Failed to generate AI justification."));
    } finally {
      setIsJustifying(false);
    }
  };

  const handleSave = async (publishStatus) => {
    setSaving(true);
    try {
      const payload = {
        groupGrade: {
          score: Math.min(
            100,
            Math.max(0, Number(groupScore) + Number(groupAdjustment)),
          ),
          maxScore: 100,
          breakdown: suggested?.groupGrade?.breakdown || {},
          teacherAdjustment: Number(groupAdjustment),
          teacherNote: groupNote,
        },
        memberGrades: memberEdits.map((m) => ({
          student: m.student,
          score: Math.min(
            100,
            Math.max(0, Number(m.score) + Number(m.teacherAdjustment)),
          ),
          maxScore: 100,
          breakdown: m.breakdown,
          teacherAdjustment: Number(m.teacherAdjustment),
          teacherNote: m.teacherNote,
        })),
        status: publishStatus,
      };
      await teacherApi.saveEvaluation(projectId, payload);
      showSuccess(
        publishStatus === "published"
          ? "Evaluation published!"
          : "Draft saved.",
      );
      loadAll();
    } catch (err) {
      showError(getErrorMessage(err, "Failed to save evaluation."));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    setSaving(true);
    try {
      await teacherApi.markProjectCompleted(projectId);
      showSuccess("Project marked as completed!");
      loadAll();
    } catch (err) {
      showError(getErrorMessage(err, "Failed to complete project."));
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = async (templateId) => {
    setSaving(true);
    try {
      await teacherApi.updateProjectGradingTemplate(projectId, templateId);
      showSuccess("Grading template updated.");
      loadAll();
    } catch (err) {
      showError(getErrorMessage(err, "Failed to update template."));
    } finally {
      setSaving(false);
    }
  };

  const isPublished = existing?.status === "published";
  const finalGroupScore = Math.min(
    100,
    Math.max(0, Number(groupScore) + Number(groupAdjustment)),
  );

  if (loading) {
    return (
      <DashboardShell>
        <EvaluationSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Orchestrator Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/teacher/projects")}
              className="h-10 w-10 shrink-0 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-900/10 hover:scale-105 transition-transform"
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                Evaluation Command
                {isPublished ? (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1 shadow-sm">
                    <FiCheckCircle size={10} /> Published
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-100 flex items-center gap-1 shadow-sm">
                    <FiAlertCircle size={10} /> Draft Status
                  </span>
                )}
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                {projectInfo?.title || "Strategic Objective Retrieval..."}
                <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                {(projectInfo?.group?.name || "Cohort Registry").toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/teacher/projects")}
              className="h-10 px-6 rounded-xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
            >
              Registry
            </button>
            {!isPublished && (
              <button
                onClick={() => handleSave("published")}
                disabled={saving}
                className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <FiLoader className="animate-spin" size={14} />
                ) : (
                  <FiZap size={14} />
                )}
                {saving ? "EXECUTING..." : "Publish Metrics"}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-stretch w-full min-w-0">
          {/* Left Column: Vitality & Readiness */}
          <div className="w-full xl:w-[400px] shrink-0 flex flex-col">
            <div className="glass-card bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col h-full">
              <div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
                  Lifecycle Vitality
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-70">
                  Real-time completion & cohort diagnostics.
                </p>
              </div>

              {metrics && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-3">
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
                      const pct =
                        m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
                      const barColor = {
                        emerald: "bg-emerald-500",
                        indigo: "bg-indigo-500",
                        violet: "bg-violet-500",
                      }[m.color];

                      return (
                        <div
                          key={m.label}
                          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-7 w-7 rounded-lg bg-${m.color}-50 text-${m.color}-600 flex items-center justify-center border border-${m.color}-100`}
                              >
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
                              className={`h-full ${barColor} rounded-full transition-all duration-1000 shadow-lg`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <span
                              className={`text-[9px] font-black text-${m.color}-600 uppercase tracking-widest`}
                            >
                              {pct}% COMPLETED
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl shadow-slate-200 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                        <FiTrendingUp size={12} /> Performance Pulse
                      </h3>
                      <span className="text-[10px] font-black text-indigo-400">
                        ACTIVE
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-black tracking-tighter">
                        {metrics.tasksTotal > 0
                          ? Math.round(
                              (metrics.tasksCompleted / metrics.tasksTotal) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Overall Effort Index
                      </p>
                    </div>
                  </div>

                  {checks && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                        Readiness Protocol
                      </p>
                      <div className="space-y-2">
                        {Object.entries(checks).map(([key, passed]) => (
                          <div
                            key={key}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-50 shadow-sm transition-all hover:bg-slate-50/50"
                          >
                            <div
                              className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                                passed
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  : "bg-slate-50 border-slate-100 text-slate-300"
                              }`}
                            >
                              {passed ? (
                                <FiCheckCircle size={12} />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                              )}
                            </div>
                            <p
                              className={`text-[10px] font-black uppercase tracking-tight ${passed ? "text-slate-700" : "text-slate-400 opacity-60"}`}
                            >
                              {criteriaLabels[key] || key}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {projectInfo?.status !== "completed" && isReady && (
                    <button
                      onClick={handleMarkComplete}
                      disabled={saving}
                      className="w-full h-12 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {saving ? "EXECUTING..." : "COMPLETE_PROJECT_LIFECYCLE"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Evaluation Workspace */}
          <div className="flex-1 min-w-0 w-full flex flex-col">
            {/* Strategic Scoring Panel */}
            <div className="glass-card bg-white/90 border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
                    Grading Matrix
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-70">
                    Define metrics and finalize academic outcome.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {!isPublished && templates.length > 0 && (
                    <div className="flex flex-col gap-1.5 min-w-[220px]">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <FiLayers size={10} /> Active Template
                      </label>
                      <select
                        value={projectInfo?.gradingTemplate?._id || projectInfo?.gradingTemplate || ""}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        disabled={saving}
                        className="h-10 rounded-xl border border-slate-100 bg-white px-3 text-[10px] font-black uppercase text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all shadow-sm"
                      >
                        <option value="">Default (Global)</option>
                        {templates.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} {t.isDefault ? "(System Default)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {!isPublished && (
                    <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={handleAIJustify}
                      disabled={isJustifying || loading}
                      className="flex items-center gap-2 h-10 px-6 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                    >
                      {isJustifying ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <HiSparkles className="text-white" />
                      )}
                      {isJustifying
                        ? "ANALYZING WORKFLOW..."
                        : "AI GENERATE JUSTIFICATION"}
                    </button>
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 grayscale opacity-70">
                      <FiInfo size={10} /> Auto-generates academic rationale
                      from project telemetry
                    </p>
                  </div>
                )}
              </div>

              {suggested && (
                <div className="grid gap-6">
                  <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                    <div className="text-center md:border-r border-slate-200 md:pr-10">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2">
                        Calculated
                      </p>
                      <div className="relative inline-block">
                        <p className="text-5xl font-black text-slate-800 tracking-tighter">
                          {suggested.groupGrade.score}
                        </p>
                        <p className="text-[16px] font-bold text-slate-300 absolute -bottom-4 -right-2">
                          /100
                        </p>
                      </div>
                      <button
                        onClick={() => setShowLogicModal(true)}
                        className="mt-4 block mx-auto text-[9px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-all hover:translate-y-[-2px]"
                      >
                        VIEW LOGIC
                      </button>
                    </div>

                    {!isPublished ? (
                      <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Effective Score
                          </label>
                          <input
                            type="number"
                            value={groupScore}
                            onChange={(e) => setGroupScore(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-100 bg-white px-4 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Calibration (±)
                          </label>
                          <input
                            type="number"
                            value={groupAdjustment}
                            onChange={(e) => setGroupAdjustment(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-100 bg-white px-4 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all shadow-sm"
                          />
                        </div>
                        <div className="col-span-2 text-center pt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Final Strategy Grade:{" "}
                            <span className="text-indigo-600 font-black ml-1 text-base tracking-normal">
                              {finalGroupScore} / 100
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2">
                          Final Published
                        </p>
                        <p className="text-5xl font-black text-emerald-600 tracking-tighter">
                          {existing.groupGrade.score}
                        </p>
                        <p className="text-[10px] font-bold text-slate-300 mt-1">
                          LOCKED MATRIX
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(suggested.groupGrade.breakdown).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm transition-all hover:border-slate-100 group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${breakdownColors[key]}`}
                              ></div>
                              <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                                {breakdownLabels[key]}
                              </p>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-800 transition-colors">
                              {value}%
                            </span>
                          </div>
                          <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${breakdownColors[key]} rounded-full transition-all duration-1000 shadow-md`}
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {!isPublished ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                            Strategic Justification
                          </label>
                          {aiAnalysis?.adjustmentAdvice && (
                            <span className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1">
                              <HiSparkles /> AI ADVISED
                            </span>
                          )}
                        </div>
                        <textarea
                          value={groupNote}
                          onChange={(e) => setGroupNote(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[11px] leading-relaxed text-slate-700 outline-none resize-none min-h-[160px] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all placeholder:text-slate-400"
                          placeholder="Draft the official academic rationale for this grade..."
                        />
                      </div>

                      {aiAnalysis?.rubricBreakdown && (
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              key: "technicalComplexity",
                              label: "Architecture",
                              icon: <FiCode size={12} />,
                              color: "indigo",
                            },
                            {
                              key: "documentationManagement",
                              label: "Documentation",
                              icon: <FiFileText size={12} />,
                              color: "emerald",
                            },
                            {
                              key: "timelineCommunication",
                              label: "Reliability",
                              icon: <FiClock size={12} />,
                              color: "violet",
                            },
                          ].map((item) => {
                            const rub = aiAnalysis.rubricBreakdown[item.key];
                            if (!rub) return null;
                            return (
                              <div
                                key={item.key}
                                className="p-3.5 rounded-2xl bg-white border border-slate-50 shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div
                                    className={`h-6 w-6 rounded-lg bg-${item.color}-50 text-${item.color}-500 flex items-center justify-center border border-${item.color}-100`}
                                  >
                                    {item.icon}
                                  </div>
                                  <span
                                    className={`text-[10px] font-black text-${item.color}-600`}
                                  >
                                    {rub.score}%
                                  </span>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                                  {item.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest opacity-60">
                        Academic Rationale
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed italic font-medium">
                        "
                        {existing.groupGrade.teacherNote ||
                          "No justification archived."}
                        "
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Member Registry Panel - Full Width Orchestrator */}
      <div className="bg-white/90 border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">
              Cohort Intelligence
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-70">
              Individual contribution & relative performance matrix.
            </p>
          </div>
          <div className="h-8 px-4 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center shadow-lg shadow-slate-900/10">
            AVG:{" "}
            {Math.round(
              memberEdits.reduce((acc, m) => acc + Number(m.score), 0) /
                Math.max(1, memberEdits.length),
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {memberEdits.map((member, idx) => {
            const memberFinal = Math.min(
              100,
              Math.max(
                0,
                Number(member.score) + Number(member.teacherAdjustment),
              ),
            );
            const spotlight = aiAnalysis?.memberSpotlights?.find(
              (s) => s.student === member.studentName,
            );

            return (
              <div
                key={member.student}
                className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-100 group/member"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate group-hover/member:text-indigo-600 transition-colors">
                      {member.studentName}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">
                      {member.studentEmail}
                    </p>
                  </div>
                  <div className="h-10 w-10 shrink-0 bg-slate-900 text-white rounded-xl flex flex-col items-center justify-center shadow-lg shadow-slate-900/10 border border-slate-800">
                    <span className="text-sm font-black leading-none">
                      {memberFinal}
                    </span>
                    <span className="text-[7px] font-black opacity-60 uppercase">
                      pts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {Object.entries(member.breakdown).map(([key, val]) => (
                    <div
                      key={key}
                      className="px-3 py-2.5 rounded-2xl bg-slate-100/50 border border-slate-200/60 flex flex-col items-center group-hover/member:bg-slate-50 transition-colors"
                    >
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {memberBreakdownLabels[key]}
                      </p>
                      <p className="text-xs font-black text-slate-800">{val}</p>
                    </div>
                  ))}
                </div>

                {spotlight && (
                  <div className="mb-5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <HiSparkles
                      className="text-emerald-500 shrink-0 mt-0.5"
                      size={12}
                    />
                    <p className="text-[10px] font-bold text-emerald-800 leading-normal italic opacity-80 uppercase tracking-tight">
                      "{spotlight.spotlight}"
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-50 space-y-4">
                  <button
                    onClick={() => toggleMath(idx)}
                    className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                  >
                    {expandedMath[idx] ? <FiChevronUp /> : <FiChevronDown />}
                    DYNAMICS_REASONING
                  </button>

                  {expandedMath[idx] && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 text-[10px] space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="justify-between flex font-bold text-slate-500">
                        <span>Shared Threshold:</span>
                        <span>{suggested?.groupGrade?.score}</span>
                      </div>
                      <div className="justify-between flex font-bold text-slate-500">
                        <span>Load Balance:</span>
                        <span>
                          {member.breakdown.tasksCompleted} /{" "}
                          {metrics?.tasksTotal} UTs
                        </span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-indigo-100 flex justify-between font-black text-indigo-700 uppercase">
                        <span>Resultant:</span>
                        <span>{member.score} pts</span>
                      </div>
                    </div>
                  )}

                  {!isPublished ? (
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Calibration
                        </label>
                        <input
                          type="number"
                          value={member.teacherAdjustment}
                          onChange={(e) => {
                            const updated = [...memberEdits];
                            updated[idx] = {
                              ...updated[idx],
                              teacherAdjustment: e.target.value,
                            };
                            setMemberEdits(updated);
                          }}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Confidential Note
                        </label>
                        <input
                          type="text"
                          value={member.teacherNote}
                          onChange={(e) => {
                            const updated = [...memberEdits];
                            updated[idx] = {
                              ...updated[idx],
                              teacherNote: e.target.value,
                            };
                            setMemberEdits(updated);
                          }}
                          placeholder="Tactical summary..."
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    member.teacherNote && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Archived Note
                        </p>
                        <p className="text-[10px] font-medium text-slate-600 italic">
                          "{member.teacherNote}"
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Persistent Bar */}
        {!isPublished && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center justify-between gap-6 shadow-sm border border-slate-200/50">
            <div className="hidden md:flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl">
                <FiInfo className="text-slate-400" size={20} />
              </div>
              <div className="max-w-md">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Protocol Finalization
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-normal">
                  Published evaluations are locked and immutable. Verify all
                  strategic adjustments and AI justifications before finalizing.
                </p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="flex-1 md:flex-none h-12 px-8 rounded-full border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all disabled:opacity-50 active:scale-95"
              >
                {saving ? "..." : "Cache Draft"}
              </button>
              <button
                onClick={() => handleSave("published")}
                disabled={saving}
                className="flex-1 md:flex-none h-12 px-10 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? "EXECUTING..." : "COMMIT_EVALUATION"}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ------ Tactical Logic Modal ------ */}
      {showLogicModal && metrics && suggested && (
        <div className="fixed inset-0 -top-10 z-[100] flex items-center justify-end !p-8">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowLogicModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                Grading Logic Formula
              </h3>
              <button
                onClick={() => setShowLogicModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Calculated Baseline
                </p>
                <p className="text-4xl font-black text-slate-800 tracking-tight">
                  {suggested.groupGrade.score}
                </p>
                <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">
                  Composite Resultant
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    label: "Temporal Accuracy",
                    weight: "20%",
                    score: suggested.groupGrade.breakdown.deadlinePerformance,
                    color: "violet",
                  },
                  {
                    label: "Objective Completion",
                    weight: "30%",
                    score: suggested.groupGrade.breakdown.featureCompletion,
                    color: "emerald",
                  },
                  {
                    label: "Fulfillment Velocity",
                    weight: "15%",
                    score: suggested.groupGrade.breakdown.taskCompletion,
                    color: "indigo",
                  },
                  {
                    label: "Collaborative Sync",
                    weight: "15%",
                    score: suggested.groupGrade.breakdown.meetingEngagement,
                    color: "amber",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl border border-slate-50 bg-white shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-1.5 w-1.5 rounded-full bg-${item.color}-500`}
                      ></div>
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                        {item.label}
                      </span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                        {item.weight}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-slate-800">
                      {item.score}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <p className="text-[9px] font-bold text-indigo-600 leading-relaxed uppercase tracking-tight">
                  The final score is a weighted average of these five key
                  performance indicators derived from the group's activity
                  registry.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30">
              <button
                onClick={() => setShowLogicModal(false)}
                className="w-full h-10 bg-slate-900 text-white text-[10px] font-black rounded-xl shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardShell>
  );
};

export default TeacherEvaluationPage;
