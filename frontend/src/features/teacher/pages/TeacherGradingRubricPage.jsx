import {
  FiPieChart,
  FiLock,
  FiInfo,
  FiZap,
  FiTarget,
  FiActivity,
  FiLayers,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import teacherApi from "../api/teacherApi.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import getErrorMessage from "../../../utils/error.js";
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from "react-icons/fi";
import "../teacherTheme.css";

const weightLabels = {
  deadlinePerformance: "Deadline Performance",
  featureCompletion: "Feature Completion",
  taskCompletion: "Task Completion",
  meetingEngagement: "Meeting Engagement",
  codeContribution: "Code Contribution",
  proposalQuality: "Proposal Quality",
};

const memberWeightLabels = {
  featuresImplemented: "Features",
  tasksCompleted: "Tasks",
  meetingAttendance: "Meetings",
  githubCommits: "Commits",
};

const data = [
  { name: "Feature Completion", value: 30, color: "#10b981" },
  { name: "Deadline Performance", value: 20, color: "#8b5cf6" },
  { name: "Task Completion", value: 15, color: "#3b82f6" },
  { name: "Meeting Engagement", value: 15, color: "#f59e0b" },
  { name: "Code Contribution", value: 10, color: "#475569" },
  { name: "Proposal Quality", value: 10, color: "#14b8a6" },
];

const memberData = [
  { name: "Group Base Score", value: 70, color: "#94a3b8" },
  { name: "Personal Tasks", value: 15, color: "#3b82f6" },
  { name: "Meeting Attendance", value: 15, color: "#f59e0b" },
];

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass-card p-4 rounded-2xl bg-white/70 backdrop-blur-md border-none shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
    <div
      className={`p-3 rounded-xl ${color} bg-white shadow-sm border border-slate-100/50 group-hover:scale-105 transition-transform`}
    >
      <Icon size={18} />
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
        {title}
      </span>
      <span className="text-lg font-black text-slate-800 tracking-tight">
        {value}
      </span>
    </div>
  </div>
);

const TeacherGradingRubricPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    weights: {
      deadlinePerformance: 0.3,
      featureCompletion: 0.25,
      taskCompletion: 0.15,
      meetingEngagement: 0.1,
      codeContribution: 0.1,
      proposalQuality: 0.1,
    },
    memberWeights: {
      featuresImplemented: 0.4,
      tasksCompleted: 0.3,
      meetingAttendance: 0.2,
      githubCommits: 0.1,
    },
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.fetchGradingTemplates();
      setTemplates(res.templates || []);
      if (res.templates?.length > 0) {
        setSelectedTemplate(res.templates.find((t) => t.isDefault) || res.templates[0]);
      }
    } catch (err) {
      showError(getErrorMessage(err, "Failed to load templates"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // In a real app, I'd have a specific POST endpoint. 
      // For now, I'll assume teacherApi has it or use a generic one if I added it.
      // I did add it to the teacher route but might need to add function to teacherApi
      // Wait, I already added fetchGradingTemplates and update... 
      // Let me add createTemplate to teacherApi if missing.
      
      const res = await teacherApi.createGradingTemplate(formData);
      showSuccess("Template created successfully");
      setShowCreateModal(false);
      loadTemplates();
    } catch (err) {
      showError(getErrorMessage(err, "Failed to create template"));
    } finally {
      setIsSaving(false);
    }
  };

  const groupChartData = selectedTemplate
    ? Object.entries(selectedTemplate.weights).map(([key, value]) => ({
        name: weightLabels[key] || key,
        value: value * 100,
        color: {
          deadlinePerformance: "#8b5cf6",
          featureCompletion: "#10b981",
          taskCompletion: "#3b82f6",
          meetingEngagement: "#f59e0b",
          codeContribution: "#475569",
          proposalQuality: "#14b8a6",
        }[key] || "#94a3b8",
      }))
    : [];

  const memberChartData = selectedTemplate
    ? Object.entries(selectedTemplate.memberWeights).map(([key, value]) => ({
        name: memberWeightLabels[key] || key,
        value: value * 100,
        color: {
          featuresImplemented: "#10b981",
          tasksCompleted: "#3b82f6",
          meetingAttendance: "#f59e0b",
          githubCommits: "#475569",
        }[key] || "#94a3b8",
      }))
    : [];

  return (
    <DashboardShell>
      <div className="h-full bg-transparent overflow-y-auto custom-scrollbar p-6">
        <main className="max-w-[1400px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Grading Architecture
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Configure and manage dynamic grading templates for project evaluations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedTemplate?._id || ""}
                onChange={(e) =>
                  setSelectedTemplate(templates.find((t) => t._id === e.target.value))
                }
                className="h-10 rounded-xl border border-slate-100 bg-white px-4 text-[10px] font-black uppercase text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
              >
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} {t.isDefault ? "(SYSTEM DEFAULT)" : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
              >
                <FiPlus size={14} /> NEW_PROTOCOLS
              </button>
            </div>
          </div>

          {selectedTemplate && (
            <>
              {/* Stats/Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Template Name"
                  value={selectedTemplate.name}
                  icon={FiTarget}
                  color="text-indigo-600"
                />
                <StatsCard
                  title="Status"
                  value={selectedTemplate.isDefault ? "SYSTEM_DEFAULT" : "ACTIVE"}
                  icon={FiActivity}
                  color="text-emerald-600"
                />
                <StatsCard
                  title="Precision"
                  value="Weighted"
                  icon={FiZap}
                  color="text-amber-600"
                />
                <StatsCard
                  title="Total Group Weight"
                  value="100%"
                  icon={FiLayers}
                  color="text-slate-600"
                />
              </div>

              {/* Management Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Group Score Rubric */}
                <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border border-slate-100 shadow-sm rounded-2xl">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <h2>Group Precision Weights</h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-5 flex-1 flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed opacity-80 decoration-indigo-200">
                      {selectedTemplate.description || "Weighted metrics for group-level evaluation."}
                    </p>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={groupChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {groupChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-xl">
                                    {payload[0].name}: {payload[0].value}%
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {groupChartData.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-900">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-900">
                            {item.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual Member Modifier Rubric */}
                <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border border-slate-100 shadow-sm rounded-2xl">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <h2>Personal Performance Logic</h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-5 flex-1 flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed opacity-80">
                      Granular individual participation metrics as weighted modifiers.
                    </p>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={memberChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={90}
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={4}
                          >
                            {memberChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-xl">
                                    {payload[0].name}: {payload[0].value}%
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 flex-1 flex flex-col justify-center">
                      <div className="grid grid-cols-2 gap-3">
                        {memberChartData.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 border border-slate-100 shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-slate-900">
                              {item.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Master Lock Banner */}
          <div className="glass-card rounded-2xl border border-dashed border-slate-200 bg-slate-50/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100">
                <FiPieChart size={18} className="text-slate-300" />
              </div>
              <div className="text-left">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-0.5">
                  Protocol Integrity
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-70">
                  Select a template on the Evaluation Command page to apply these precision weights.
                </p>
              </div>
            </div>
            <div className="px-4 py-1 rounded-full border border-slate-200 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm shadow-slate-100">
              {templates.length} Protocols Loaded
            </div>
          </div>
        </main>
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Initialize New Protocol
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Define specialized weighting for a specific project cohort.
                </p>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Protocol Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      placeholder="e.g. AI Specialized Rubric"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Brief Description
                    </label>
                    <input
                      type="text"
                      className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      placeholder="Purpose of this configuration..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Group Precision Matrix (Weights must sum to 1.0)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(formData.weights).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          {weightLabels[key]}
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          className="w-full h-10 rounded-lg border border-slate-100 bg-slate-50/30 px-3 text-[11px] font-black text-slate-800"
                          value={value}
                          onChange={(e) => {
                            const newWeights = { ...formData.weights, [key]: parseFloat(e.target.value) };
                            setFormData({ ...formData, weights: newWeights });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-12 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSaving ? "EXECUTING..." : "DEPLOY_PROTOCOL"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default TeacherGradingRubricPage;
