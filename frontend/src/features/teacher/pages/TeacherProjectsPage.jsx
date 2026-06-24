import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import FileViewerDrawer from "../../student/components/FileViewerDrawer.jsx";
import teacherApi from "../api/teacherApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import ProjectStatusFilters from "../components/projects/ProjectStatusFilters.jsx";
import ProjectsListPanel from "../components/projects/ProjectsListPanel.jsx";
import ProjectReviewSection from "../components/projects/ProjectReviewSection.jsx";
import ProjectOverviewTab from "../components/projects/ProjectOverviewTab.jsx";
import ProjectIntelligenceTab from "../components/projects/ProjectIntelligenceTab.jsx";
import ProjectFeedbackTab from "../components/projects/ProjectFeedbackTab.jsx";
import ClassOverviewDashboard from "../components/projects/ClassOverviewDashboard.jsx";
import ProposalAnalyzerPanel from "../components/projects/ProposalAnalyzerPanel.jsx";
import FinalEvaluationDrawer from "../components/projects/FinalEvaluationDrawer.jsx";
import {
  FiTrendingUp,
  FiMessageSquare,
  FiInfo,
  FiActivity,
  FiTarget,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import MilestoneTimeline from "../../projects/components/MilestoneTimeline.jsx";
import EvidenceRegistry from "../../projects/components/EvidenceRegistry.jsx";
import StudentDetailDrawer from "../../student/components/shared/StudentDetailDrawer.jsx";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

const statusChipClass = (status) => {
  const key = String(status || "").toLowerCase();
  if (key === "submitted" || key === "under_review")
    return "bg-blue-50 border-blue-200 text-blue-700";
  if (key === "approved" || key === "in_progress")
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (key === "completed") return "bg-teal-50 border-teal-200 text-teal-700";
  if (key === "rejected") return "bg-rose-50 border-rose-200 text-rose-700";
  return "bg-slate-100 border-slate-200 text-slate-600";
};

const isReviewableStatus = (status) => {
  const key = String(status || "").toLowerCase();
  return key === "submitted" || key === "under_review";
};

const TeacherProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectsStatus, setProjectsStatus] = useState("idle");
  const [projectsError, setProjectsError] = useState("");

  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [actionStatus, setActionStatus] = useState("idle");
  const [isDraftingAI, setIsDraftingAI] = useState(false);

  const [feedback, setFeedback] = useState([]);
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const [features, setFeatures] = useState([]);
  const [featuresStatus, setFeaturesStatus] = useState("idle");
  const [previewFile, setPreviewFile] = useState(null);
  const [evalDrawerOpen, setEvalDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [isProposalTextOpen, setIsProposalTextOpen] = useState(true);
  const [newFeedback, setNewFeedback] = useState({
    type: "suggestion",
    title: "",
    message: "",
    priority: "medium",
    files: [],
    featureIds: [],
  });

  const [milestones, setMilestones] = useState([]);
  const [evidenceRegistry, setEvidenceRegistry] = useState([]);
  const [rubricCriteria, setRubricCriteria] = useState([]);
  const [milestonesStatus, setMilestonesStatus] = useState("idle");
  const [evidenceStatus, setEvidenceStatus] = useState("idle");
  const [validationModal, setValidationModal] = useState({
    open: false,
    evidenceId: null,
    criterionKey: "",
  });
  const [validationForm, setValidationForm] = useState({
    status: "approved",
    note: "",
  });
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneDrawerOpen, setMilestoneDrawerOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    deadline: "",
    relevantCriteria: "",
  });

  const loadProjects = async (statusFilter = projectStatusFilter) => {
    setProjectsStatus("loading");
    setProjectsError("");
    try {
      const data = await teacherApi.fetchProjectProposals(statusFilter);
      setProjects(data.projects || []);
      setProjectsStatus("succeeded");
    } catch (error) {
      setProjectsStatus("failed");
      setProjects([]);
      const message = getErrorMessage(error, "Failed to load projects.");
      setProjectsError(message);
      showError(message);
    }
  };

  useEffect(() => {
    loadProjects(projectStatusFilter);
  }, [projectStatusFilter]);

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId("");
      return;
    }
    const exists = projects.some(
      (project) => String(project._id) === String(selectedProjectId),
    );
    if (!exists && selectedProjectId !== "") {
      setSelectedProjectId("");
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => String(project._id) === String(selectedProjectId),
      ) || null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (!selectedProjectId) {
      setFeedback([]);
      setFeatures([]);
      return;
    }
    let active = true;
    const loadRelated = async () => {
      setFeedbackStatus("loading");
      setFeaturesStatus("loading");
      try {
        const feedbackRes =
          await teacherApi.fetchProjectFeedback(selectedProjectId);
        if (!active) return;
        setFeedback(feedbackRes.feedback || []);
        setFeedbackStatus("succeeded");
      } catch {
        if (active) {
          setFeedback([]);
          setFeedbackStatus("failed");
        }
      }

      const groupId = selectedProject?.group?._id || selectedProject?.group;
      if (!groupId) {
        if (active) {
          setFeatures([]);
          setFeaturesStatus("succeeded");
        }
        return;
      }
      try {
        const workspaceRes = await teacherApi.fetchGroupWorkspace(groupId);
        if (!active) return;
        setFeatures(workspaceRes.data?.features || []);
        setFeaturesStatus("succeeded");
      } catch {
        if (active) {
          setFeatures([]);
          setFeaturesStatus("failed");
        }
      }
    };
    loadRelated();
  }, [selectedProjectId, selectedProject?.group?._id, selectedProject?.group]);

  const loadQualityData = async () => {
    if (!selectedProjectId) return;
    setMilestonesStatus("loading");
    setEvidenceStatus("loading");
    try {
      const [milestonesData, evidenceData, criteriaRes] = await Promise.all([
        teacherApi.fetchProjectMilestones(selectedProjectId),
        teacherApi.fetchProjectEvidence(selectedProjectId),
        teacherApi.fetchRubricCriteria(),
      ]);
      setMilestones(milestonesData.milestones || []);
      setEvidenceRegistry(evidenceData.evidence || []);
      setRubricCriteria(criteriaRes.criteria || []);
      setMilestonesStatus("succeeded");
      setEvidenceStatus("succeeded");
    } catch (err) {
      setMilestonesStatus("failed");
      setEvidenceStatus("failed");
    }
  };

  useEffect(() => {
    loadQualityData();
  }, [selectedProjectId]);

  const canReview = isReviewableStatus(selectedProject?.status);
  const canAddFeedback = Boolean(selectedProject && !canReview);

  const handleDecision = async (action) => {
    if (!selectedProject?._id || !canReview) return;
    setActionStatus("loading");
    try {
      if (action === "approve") {
        await teacherApi.approveProject(
          selectedProject._id,
          feedbackText.trim() || undefined,
        );
        showSuccess("Project approved.");
      } else {
        await teacherApi.rejectProject(
          selectedProject._id,
          feedbackText.trim() || undefined,
        );
        showSuccess("Project rejected.");
      }
      setFeedbackText("");
      await loadProjects(projectStatusFilter);
      const feedbackRes = await teacherApi.fetchProjectFeedback(
        selectedProject._id,
      );
      setFeedback(feedbackRes.feedback || []);
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to submit decision."));
    }
  };

  const handleValidateEvidence = async (e) => {
    e.preventDefault();
    setActionStatus("loading");
    try {
      await teacherApi.validateProjectEvidence(
        selectedProject._id,
        validationModal.evidenceId,
        validationForm,
      );
      showSuccess("Evidence validated successfully");
      setValidationModal({ open: false, evidenceId: null, criterionKey: "" });
      const evidenceData = await teacherApi.fetchProjectEvidence(
        selectedProject._id,
      );
      setEvidenceRegistry(evidenceData.evidence || []);
      const milestoneData = await teacherApi.fetchProjectMilestones(
        selectedProject._id,
      );
      setMilestones(milestoneData.milestones || []);
      setActionStatus("succeeded");
    } catch (err) {
      showError(getErrorMessage(err, "Failed to validate evidence"));
      setActionStatus("failed");
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!selectedProjectId) return;
    try {
      await teacherApi.deleteProjectMilestone(selectedProjectId, milestoneId);
      showSuccess("Milestone deleted successfully");
      await loadQualityData();
      if (selectedMilestone?._id === milestoneId) {
        setMilestoneDrawerOpen(false);
        setSelectedMilestone(null);
      }
    } catch (err) {
      showError(getErrorMessage(err, "Failed to delete milestone"));
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    setActionStatus("loading");
    try {
      const payload = {
        name: newMilestone.title,
        description: newMilestone.description,
        dueDate: newMilestone.deadline,
        criteriaKeys: newMilestone.relevantCriteria
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      };
      await teacherApi.createProjectMilestone(selectedProject._id, payload);
      showSuccess("Milestone created successfully");
      setMilestoneFormOpen(false);
      setNewMilestone({
        title: "",
        description: "",
        deadline: "",
        relevantCriteria: "",
      });
      await loadQualityData();
      setActionStatus("succeeded");
    } catch (err) {
      setActionStatus("failed");
      showError(getErrorMessage(err, "Failed to deploy milestone"));
    }
  };

  const handleAddFeedback = async (event) => {
    event.preventDefault();
    if (!selectedProject?._id) return;
    if (!canAddFeedback) {
      showError("Feedback can be added after review stage is completed.");
      return;
    }
    if (!newFeedback.message.trim()) {
      showError("Feedback message is required.");
      return;
    }

    setActionStatus("loading");
    try {
      await teacherApi.addProjectFeedback(selectedProject._id, {
        ...newFeedback,
        message: newFeedback.message.trim(),
      });
      const res = await teacherApi.fetchProjectFeedback(selectedProject._id);
      setFeedback(res.feedback || []);
      setNewFeedback({
        type: "suggestion",
        title: "",
        message: "",
        priority: "medium",
        files: [],
        featureIds: [],
      });
      showSuccess("Feedback added.");
      setActionStatus("succeeded");
    } catch (error) {
      setActionStatus("failed");
      showError(getErrorMessage(error, "Failed to add feedback."));
    }
  };

  const handleGenerateAIDraft = async (tone) => {
    if (!selectedProject?._id) return;
    setIsDraftingAI(true);
    try {
      const data = await teacherApi.generateProjectFeedbackDraft(
        selectedProject._id,
        tone,
      );
      if (data?.draft) {
        setNewFeedback((prev) => ({
          ...prev,
          message: data.draft,
          title: `AI Feedback (${tone.charAt(0).toUpperCase() + tone.slice(1)})`,
        }));
        showSuccess(`AI ${tone} draft generated.`);
      }
    } catch (error) {
      showError(getErrorMessage(error, "Failed to generate AI draft."));
    } finally {
      setIsDraftingAI(false);
    }
  };

  const handlePreviewResource = (resource) => {
    if (!resource?._id) return;
    const extension = (resource.originalName || resource.fileUrl || "")
      .split(".")
      .pop()
      .toLowerCase();
    const isPreviewable = [
      "pdf",
      "png",
      "jpg",
      "jpeg",
      "gif",
      "svg",
      "webp",
    ].includes(extension);
    const actionParam = isPreviewable ? "?action=preview" : "";
    setPreviewFile({
      id: resource._id,
      name: resource.originalName || resource.fileUrl || "Resource",
      type: resource.fileType || "file",
      url: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/teacher/resources/${resource._id}/download${actionParam}`,
    });
  };

  const handlePreviewProjectFile = (file) => {
    if (!file) return;
    const pathSource = file.fileUrl || file.value || "";
    const match = pathSource.match(/[/\\]uploads[/\\](.*)/i);
    let urlPath = match ? `uploads/${match[1]}` : pathSource;
    if (urlPath) {
      urlPath = urlPath.replace(/\\/g, "/").replace(/^\//, "");
    }
    setPreviewFile({
      id: file._id || urlPath,
      name: file.originalName || "Project Document",
      type: file.fileType || "application/pdf",
      url: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${urlPath}`,
    });
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FiInfo },
    {
      id: "ai",
      label: "AI Intelligence",
      icon: FiActivity,
      disabled: canReview,
    },
    { id: "feedback", label: "Feedback", icon: FiMessageSquare },
    {
      id: "quality",
      label: "Quality Gates",
      icon: FiTarget,
      disabled: canReview,
    },
  ];

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Orchestrator Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Project Command
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Lifecycle Orchestration & Intelligence Hub
            </p>
          </div>
          <ProjectStatusFilters
            options={STATUS_OPTIONS}
            value={projectStatusFilter}
            onChange={setProjectStatusFilter}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.50fr_1.50fr]">
          <ProjectsListPanel
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
            statusChipClass={statusChipClass}
            formatDate={formatDate}
          />

          <div className="space-y-4 overflow-hidden w-full min-w-0">
            {!selectedProject ? (
              <ClassOverviewDashboard projects={projects} />
            ) : (
              <div className="flex flex-col gap-4 ">
                {/* --- Detail Header --- */}
                <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-slate-900/10 border border-slate-800">
                      {selectedProject.title?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[180px]">
                          {selectedProject.title}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest shrink-0 ${statusChipClass(selectedProject.status)}`}
                        >
                          {String(selectedProject.status || "").replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Project Identity Core
                      </p>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shadow-inner scrollbar-hide w-full min-w-0 overflow-x-auto ">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => !tab.disabled && setActiveTab(tab.id)}
                        disabled={tab.disabled}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeTab === tab.id
                            ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                            : tab.disabled
                              ? "opacity-30 cursor-not-allowed text-slate-400"
                              : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <tab.icon
                          size={12}
                          className={
                            activeTab === tab.id ? "text-indigo-600" : ""
                          }
                        />
                        <span className="hidden lg:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <ProjectOverviewTab
                        project={selectedProject}
                        isProposalTextOpen={isProposalTextOpen}
                        setIsProposalTextOpen={setIsProposalTextOpen}
                        handlePreviewProjectFile={handlePreviewProjectFile}
                      />
                      <ProjectReviewSection
                        visible={canReview}
                        feedbackText={feedbackText}
                        setFeedbackText={setFeedbackText}
                        actionStatus={actionStatus}
                        onApprove={() => handleDecision("approve")}
                        onReject={() => handleDecision("reject")}
                        projectId={selectedProject._id}
                        onGenerateReview={async (pid, decision) => {
                          try {
                            const data =
                              await teacherApi.generateProposalReview(
                                pid,
                                decision,
                              );
                            if (data?.review) {
                              setFeedbackText(data.review);
                              showSuccess(`Auto-generated ${decision} review.`);
                            }
                          } catch (err) {
                            showError(
                              getErrorMessage(
                                err,
                                "Failed to auto-generate review.",
                              ),
                            );
                          }
                        }}
                      />
                      <ProposalAnalyzerPanel
                        analysis={selectedProject.analysis}
                        projectId={selectedProject._id}
                        onReanalyze={async (pid) => {
                          try {
                            await teacherApi.analyzeProposal(pid);
                            showSuccess("AI analysis completed.");
                            await loadProjects(projectStatusFilter);
                          } catch (err) {
                            showError(
                              getErrorMessage(err, "AI analysis failed."),
                            );
                          }
                        }}
                      />
                    </div>
                  )}

                  {activeTab === "ai" && !canReview && (
                    <ProjectIntelligenceTab
                      project={selectedProject}
                      features={features}
                      featuresStatus={featuresStatus}
                      onReanalyzeHealth={async (pid) => {
                        try {
                          await teacherApi.generateProjectHealth(pid);
                          showSuccess("AI health report updated.");
                          await loadProjects(projectStatusFilter);
                        } catch (err) {
                          showError(
                            getErrorMessage(err, "AI health analysis failed."),
                          );
                        }
                      }}
                      onProjectCompleted={() =>
                        loadProjects(projectStatusFilter)
                      }
                      onPreviewResource={handlePreviewResource}
                      setEvalDrawerOpen={setEvalDrawerOpen}
                      navigate={navigate}
                    />
                  )}

                  {activeTab === "feedback" && (
                    <ProjectFeedbackTab
                      canAddFeedback={canAddFeedback}
                      feedbackForm={newFeedback}
                      setFeedbackForm={setNewFeedback}
                      features={features}
                      actionStatus={actionStatus}
                      onFeedbackSubmit={handleAddFeedback}
                      onGenerateAIDraft={handleGenerateAIDraft}
                      isDraftingAI={isDraftingAI}
                      feedback={feedback}
                      feedbackStatus={feedbackStatus}
                      formatDate={formatDate}
                    />
                  )}

                  {activeTab === "quality" && !canReview && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full min-w-0 overflow-visible">
                      {/* Milestone Control Layer */}
                      <div className="flex flex-col h-full lg:flex-row gap-4 items-stretch">
                        {/* Milestone Management */}
                        <div className="glass-card w-full  lg:w-[40%] flex-shrink-0 bg-white border border-slate-200/50 shadow-sm rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <FiClock className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">
                                  Milestone Strategy
                                </h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  Project Phase Controls
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setMilestoneFormOpen(true)}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white hover:bg-indigo-600 transition-all shadow-sm active:scale-95"
                              title="Add Milestone"
                            >
                              <FiPlus size={14} />
                            </button>
                          </div>

                          <div className="  pr-2 ">
                            <MilestoneTimeline
                              milestones={milestones}
                              onSelect={(m) => {
                                setSelectedMilestone(m);
                                setMilestoneDrawerOpen(true);
                              }}
                              onDelete={handleDeleteMilestone}
                            />
                          </div>
                        </div>

                        {/* Evidence Validation Hub */}
                        <div className="glass-card w-full lg:w-[60%] min-w-0 bg-white border border-slate-200/50 shadow-sm rounded-2xl p-4 overflow-hidden">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                              <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">
                                Evidence Validator
                              </h3>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Proof of Work Verification
                              </p>
                            </div>
                          </div>

                          <div className="w-full">
                            <EvidenceRegistry
                              criteria={(() => {
                                const keys = [
                                  ...new Set(
                                    milestones.flatMap(
                                      (m) => m.criteriaKeys || [],
                                    ),
                                  ),
                                ];
                                return rubricCriteria.filter((c) =>
                                  keys.includes(c.key),
                                );
                              })()}
                              registry={evidenceRegistry}
                              isTeacher={true}
                              onValidateEvidence={(evidenceId, criterionKey) =>
                                setValidationModal({
                                  open: true,
                                  evidenceId,
                                  criterionKey,
                                })
                              }
                              onPreview={handlePreviewProjectFile}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Validation Overlay */}
      <StudentDetailDrawer
        open={validationModal.open}
        onClose={() =>
          setValidationModal({
            open: false,
            evidenceId: null,
            criterionKey: "",
          })
        }
        title="Evidence Validation"
        subtitle={`Verifying Protocol: ${validationModal.criterionKey}`}
      >
        <div className="space-y-6 pt-4">
          <div className="glass-card bg-slate-50 border-slate-200 p-4 rounded-xl">
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">
              Validation Protocol
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  setValidationForm({ ...validationForm, status: "approved" })
                }
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${validationForm.status === "approved" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-400"}`}
              >
                <FiCheckCircle className="text-lg" />
                <span className="text-[10px] font-black uppercase">
                  Approve
                </span>
              </button>
              <button
                onClick={() =>
                  setValidationForm({ ...validationForm, status: "rejected" })
                }
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${validationForm.status === "rejected" ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-slate-200 text-slate-400"}`}
              >
                <FiAlertCircle className="text-lg" />
                <span className="text-[10px] font-black uppercase">Reject</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Audit Notes
            </label>
            <textarea
              value={validationForm.note}
              onChange={(e) =>
                setValidationForm({ ...validationForm, note: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Provide context for this validation decision..."
            />
          </div>

          <button
            onClick={async () => {
              try {
                await teacherApi.validateProjectEvidence(
                  selectedProjectId,
                  validationModal.evidenceId,
                  {
                    criterionKey: validationModal.criterionKey,
                    ...validationForm,
                  },
                );
                showSuccess("Evidence validated successfully");
                setValidationModal({
                  open: false,
                  evidenceId: null,
                  criterionKey: "",
                });
                await loadQualityData();
              } catch (err) {
                showError(getErrorMessage(err, "Validation failed"));
              }
            }}
            className="w-full py-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            Verify Protocol
          </button>
        </div>
      </StudentDetailDrawer>

      {/* Milestone Detail Drawer */}
      <StudentDetailDrawer
        open={milestoneDrawerOpen}
        onClose={() => setMilestoneDrawerOpen(false)}
        title={selectedMilestone?.name || "Milestone Details"}
        subtitle="Governance Strategy & Criteria"
      >
        {selectedMilestone && (
          <div className="space-y-6 pt-4">
            <div className="glass-card bg-indigo-50/30 border-indigo-100 p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                  <FiTarget className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {selectedMilestone.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusChipClass(selectedMilestone.status)}`}
                    >
                      {selectedMilestone.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {" "}
                      Due: {formatDate(selectedMilestone.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed bg-white/50 p-4 rounded-xl border border-white/80">
                {selectedMilestone.description ||
                  "No description provided for this phase."}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                <FiCheckCircle className="text-indigo-500" />
                Required Protocols
              </h4>
              <div className="grid gap-3">
                {selectedMilestone.criteriaKeys?.map((key) => {
                  const criterion = rubricCriteria.find((c) => c.key === key);
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <FiInfo size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                            {criterion?.label || key}
                          </p>
                          <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">
                            {criterion?.category || "Standard"}
                          </p>
                        </div>
                      </div>
                      <FiChevronRight className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setMilestoneDrawerOpen(false);
                  setMilestoneFormOpen(true);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                Edit Phase
              </button>
              <button
                onClick={() => handleDeleteMilestone(selectedMilestone._id)}
                className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
              >
                Abolish Phase
              </button>
            </div>
          </div>
        )}
      </StudentDetailDrawer>

      {/* Milestone Creation Overlay */}
      <StudentDetailDrawer
        open={milestoneFormOpen}
        onClose={() => setMilestoneFormOpen(false)}
        title="Strategy Configuration"
        subtitle="New Project Milestone Definition"
      >
        <form onSubmit={handleCreateMilestone} className="space-y-6 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
              Phase Title
            </label>
            <input
              type="text"
              required
              value={newMilestone.title}
              onChange={(e) =>
                setNewMilestone((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Alpha Prototype"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
              Description
            </label>
            <textarea
              value={newMilestone.description}
              onChange={(e) =>
                setNewMilestone((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Strategic objectives for this phase..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                Deadline Node
              </label>
              <input
                type="date"
                required
                value={newMilestone.deadline}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    deadline: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700 shadow-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                Criteria Keys
              </label>
              <input
                type="text"
                required
                value={newMilestone.relevantCriteria}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    relevantCriteria: e.target.value,
                  }))
                }
                placeholder="key1, key2..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700 shadow-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionStatus === "loading"}
            className="w-full h-11 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {actionStatus === "loading"
              ? "Deploying..."
              : "Initialize Milestone"}
          </button>
        </form>
      </StudentDetailDrawer>

      <FileViewerDrawer
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
      <FinalEvaluationDrawer
        open={evalDrawerOpen}
        onClose={() => setEvalDrawerOpen(false)}
        projectId={selectedProject?._id}
        onOpenFullPage={() => {
          setEvalDrawerOpen(false);
          navigate(`/teacher/projects/${selectedProject?._id}/evaluation`);
        }}
      />
    </DashboardShell>
  );
};

export default TeacherProjectsPage;
