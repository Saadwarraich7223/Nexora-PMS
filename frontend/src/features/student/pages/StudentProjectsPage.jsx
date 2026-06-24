import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import { fetchStudentPreview } from "../slices/studentSlice.js";
import studentApi from "../api/studentApi.js";
import StudentDetailDrawer from "../components/shared/StudentDetailDrawer.jsx";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

import { MdOutlineInbox } from "react-icons/md";
import "../studentTheme.css";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import {
  FiUpload,
  FiGithub,
  FiFileText,
  FiMessageSquare,
  FiLayers,
  FiZap,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import GitHubPanel from "../components/groups/GitHubPanel.jsx";
import StudentEvaluationPanel from "../components/projects/StudentEvaluationPanel.jsx";
import MilestoneTimeline from "../../projects/components/MilestoneTimeline.jsx";
import EvidenceRegistry from "../../projects/components/EvidenceRegistry.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

const PROPOSAL_TEMPLATE = `## 1. Problem Statement
<!-- Clearly describe the real-world problem. Who is affected? Why does it matter? -->

## 2. Proposed Solution
<!-- Explain your idea in simple terms. Avoid technical jargon here. -->

## 3. Technology Stack
- **Frontend:** 
- **Backend:** 
- **Database:** 

## 4. System Architecture
<!-- Describe how the components interact. e.g. MVC, Microservices, or general data flow. -->

## 5. Expected Outcomes
<!-- What will be delivered at the end? Website? App? System? Define your milestones. -->`;

const FileViewerDrawer = lazy(
  () => import("../components/FileViewerDrawer.jsx"),
);

const toArray = (value) => (Array.isArray(value) ? value : []);

const parseFileItem = (item, index) => {
  if (!item) {
    return {
      id: `file-${index}`,
      name: `File ${index + 1}`,
      url: "",
      type: "other",
    };
  }

  if (typeof item === "string") {
    const name = item.split(/[\\/]/).pop() || `File ${index + 1}`;
    return { id: `file-${index}`, name, url: item, type: "other" };
  }

  return {
    id: item._id || `file-${index}`,
    name: item.originalName || item.fileUrl || `File ${index + 1}`,
    url: item.fileUrl || "",
    type: item.category || item.fileType || "other",
  };
};

const normalizeTaskStatus = (status) => {
  const value = String(status || "todo").toLowerCase();
  if (value === "in_progress") return "in-progress";
  if (["to_do", "open", "pending"].includes(value)) return "todo";
  if (["done"].includes(value)) return "completed";
  return value;
};

const StudentProjectsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { preview, status, error } = useSelector((state) => state.student);

  const [feedback, setFeedback] = useState([]);
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: "",
    description: "",
    files: [],
  });
  const [proposalActionStatus, setProposalActionStatus] = useState("idle");

  const [milestones, setMilestones] = useState([]);
  const [evidenceRegistry, setEvidenceRegistry] = useState([]);
  const [rubricCriteria, setRubricCriteria] = useState([]);
  const [milestoneStatus, setMilestoneStatus] = useState("idle");
  const [evidenceStatus, setEvidenceStatus] = useState("idle");
  const [submissionModal, setSubmissionModal] = useState({
    open: false,
    key: null,
  });
  const [submissionValue, setSubmissionValue] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  const [githubLoading, setGithubLoading] = useState(false);

  const [resources, setResources] = useState([]);
  const [resourceStatus, setResourceStatus] = useState("idle");
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceDesc, setResourceDesc] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [resourceUploadStatus, setResourceUploadStatus] = useState("idle");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterMemberId, setFilterMemberId] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [linkedTaskIds, setLinkedTaskIds] = useState([]);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown time";
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    dispatch(fetchStudentPreview())
      .unwrap()
      .catch((err) => {
        showError(getErrorMessage(err, "Failed to load project module."));
      });
  }, [dispatch]);

  const group = preview.group;
  const project = preview.project;

  const isLeader = useMemo(() => {
    if (!group || !user?._id) return false;
    return String(group.leader?._id || group.leader) === String(user._id);
  }, [group, user?._id]);

  const files = useMemo(
    () =>
      toArray(project?.files).map((item, index) => parseFileItem(item, index)),
    [project?.files],
  );

  useEffect(() => {
    if (!project?._id) return;

    let active = true;
    const timer = setTimeout(async () => {
      setFeedbackStatus("loading");
      try {
        const data = await studentApi.fetchProjectFeedback(project._id);
        if (!active) return;
        setFeedback(data.feedback || []);
        setFeedbackStatus("succeeded");
      } catch {
        if (!active) return;
        setFeedback([]);
        setFeedbackStatus("failed");
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [project?._id]);

  const loadMilestonesAndEvidence = async () => {
    if (!project?._id) return;
    setMilestoneStatus("loading");
    setEvidenceStatus("loading");
    try {
      const [milestonesData, evidenceData, criteriaRes] = await Promise.all([
        studentApi.fetchProjectMilestones(project._id),
        studentApi.fetchProjectEvidence(project._id),
        studentApi.fetchRubricCriteria(),
      ]);
      setMilestones(milestonesData.milestones || []);
      setEvidenceRegistry(evidenceData.evidence || []);
      setRubricCriteria(criteriaRes.criteria || []);
      setMilestoneStatus("succeeded");
      setEvidenceStatus("succeeded");
    } catch (err) {
      setMilestoneStatus("failed");
      setEvidenceStatus("failed");
    }
  };

  useEffect(() => {
    if (project?._id) {
      loadMilestonesAndEvidence();
    }
  }, [project?._id]);

  const loadResources = async () => {
    setResourceStatus("loading");
    try {
      const data = await studentApi.fetchResources();
      setResources(data.files || []);
      setResourceStatus("succeeded");
    } catch {
      setResources([]);
      setResourceStatus("failed");
    }
  };

  useEffect(() => {
    if (!group) return;
    loadResources();
  }, [group]);

  useEffect(() => {
    if (!group?._id) {
      return;
    }

    let active = true;
    const loadTasks = async () => {
      try {
        const data = await studentApi.fetchTasks();
        if (!active) return;
        setTasks(data.tasks || []);
      } catch {
        if (!active) return;
        setTasks([]);
      }
    };

    loadTasks();
    return () => {
      active = false;
    };
  }, [group?._id]);

  const canSubmit =
    isLeader &&
    !project &&
    group?.status === "active" &&
    Boolean(group?.supervisor);

  const canDelete =
    isLeader &&
    project &&
    ["draft", "rejected"].includes(String(project.status || "").toLowerCase());

  const statusClass = useMemo(() => {
    const key = String(project?.status || "none").toLowerCase();
    if (key === "submitted") return "student-status-submitted";
    if (key === "under_review") return "student-status-under_review";
    if (key === "approved") return "student-status-approved";
    if (key === "in_progress") return "student-status-in_progress";
    if (key === "completed") return "student-status-completed";
    if (key === "rejected") return "student-status-rejected";
    if (key === "draft") return "student-status-draft";
    return "student-status-none";
  }, [project?.status]);

  const guardMessage = useMemo(() => {
    if (!group) return "You need an active group to submit a proposal.";
    if (!isLeader)
      return "Only the group leader can submit or delete proposals.";
    if (project) return "A proposal already exists for your group.";
    if (group.status !== "active")
      return "Your group must be approved before proposal submission.";
    if (!group.supervisor)
      return "A supervisor must be assigned before submission.";
    return "Ready to submit a proposal.";
  }, [group, isLeader, project]);

  const stats = useMemo(
    () => [
      {
        label: "Operational Feedback",
        value: project?._id ? feedback.length : 0,
        sub: "Signals Received",
        icon: <FiMessageSquare />,
        color: "text-indigo-600",
      },
      {
        label: "Mission Assets",
        value: files.length,
        sub: "Deployed Files",
        icon: <FiLayers />,
        color: "text-emerald-600",
      },
      {
        label: "Resource Registry",
        value: resources.length,
        sub: "Active Links",
        icon: <FiZap />,
        color: "text-sky-600",
      },
      {
        label: "Synchronization",
        value: group?.members?.length || 1,
        sub: "Active Nodes",
        icon: <FiActivity />,
        color: "text-slate-900",
      },
    ],
    [project, feedback.length, files.length, resources.length, group?.members],
  );

  const uploaderStats = useMemo(() => {
    if (!resources || !Array.isArray(resources)) return [];
    const statsMap = {};
    resources.forEach((res) => {
      const uploader = res.uploadedBy || {};
      const uid = String(uploader._id || uploader);
      const uname = uploader.name || "Member";
      if (!statsMap[uid]) {
        statsMap[uid] = { id: uid, name: uname, count: 0 };
      }
      statsMap[uid].count += 1;
    });
    return Object.values(statsMap);
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!resources || !Array.isArray(resources)) return [];
    const now = new Date();

    return resources.filter((res) => {
      if (filterPeriod !== "all") {
        const resDate = new Date(res.createdAt);
        if (!isNaN(resDate.getTime())) {
          const diffDays = (now - resDate) / (1000 * 60 * 60 * 24);
          if (diffDays > Number(filterPeriod)) return false;
        }
      }

      if (filterMemberId !== "all") {
        const uid = String(res.uploadedBy?._id || res.uploadedBy);
        if (uid !== filterMemberId) return false;
      }

      return true;
    });
  }, [resources, filterPeriod, filterMemberId]);

  const linkableTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (isLeader) return true;
      const assignedTo = task.assignedTo?._id || task.assignedTo;
      return String(assignedTo || "") === String(user?._id || "");
    });
  }, [tasks, isLeader, user?._id]);

  const renderUploaderTag = (res) => {
    const uploader = res.uploadedBy || {};
    const uploaderId = String(uploader._id || uploader);
    const uploaderName = uploader.name || "Member";
    const isMe = uploaderId === String(user?._id);
    const leaderId = String(group?.leader?._id || group?.leader || "");
    const isLeaderUploader = uploaderId === leaderId;

    if (isMe && isLeaderUploader) {
      return (
        <span className="rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 text-[9px] font-bold shadow-sm whitespace-nowrap">
          You (Leader)
        </span>
      );
    }
    if (isMe) {
      return (
        <span className="rounded-full bg-sky-100 border border-sky-200 text-sky-700 px-2.5 py-0.5 text-[9px] font-bold shadow-sm whitespace-nowrap">
          Me
        </span>
      );
    }
    if (isLeaderUploader) {
      return (
        <span className="rounded-full bg-amber-100 border border-amber-200 text-amber-700 px-2.5 py-0.5 text-[9px] font-bold shadow-sm whitespace-nowrap">
          Leader ({uploaderName})
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 text-[9px] font-bold shadow-sm whitespace-nowrap">
        {uploaderName}
      </span>
    );
  };

  const refreshPreview = async () => {
    await dispatch(fetchStudentPreview()).unwrap();
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();

    if (!proposalForm.title.trim() || !proposalForm.description.trim()) {
      showError("Title and description are required.");
      return;
    }

    if (proposalForm.files.length > 5) {
      showError("You can upload up to 5 files.");
      return;
    }

    setProposalActionStatus("loading");
    try {
      await studentApi.submitProjectProposal({
        title: proposalForm.title.trim(),
        description: proposalForm.description.trim(),
        files: proposalForm.files,
      });

      await refreshPreview();
      setProposalForm({ title: "", description: "", files: [] });
      setProposalActionStatus("succeeded");
      showSuccess("Proposal submitted successfully.");
    } catch (err) {
      setProposalActionStatus("failed");
      showError(getErrorMessage(err, "Failed to submit proposal."));
    }
  };

  const handleDeleteProject = async () => {
    if (!canDelete) return;

    setProposalActionStatus("loading");
    try {
      await studentApi.deleteMyProject();
      await refreshPreview();
      setFeedback([]);
      setProposalActionStatus("succeeded");
      showSuccess("Project deleted successfully.");
    } catch (err) {
      setProposalActionStatus("failed");
      showError(getErrorMessage(err, "Failed to delete project."));
    }
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();
    if (!resourceFile) {
      showError("Please select a file to upload.");
      return;
    }
    setResourceUploadStatus("loading");
    try {
      await studentApi.uploadResource(
        resourceFile,
        resourceDesc.trim(),
        resourceName.trim(),
        linkedTaskIds,
      );
      await loadResources();
      setResourceFile(null);
      setResourceName("");
      setResourceDesc("");
      setLinkedTaskIds([]);
      setResourceUploadStatus("succeeded");
      showSuccess("Resource uploaded successfully.");
    } catch (err) {
      setResourceUploadStatus("failed");
      showError(getErrorMessage(err, "Failed to upload resource."));
    }
  };

  const handleDeleteResource = async (fileId) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await studentApi.deleteResource(fileId);
      setResources((prev) => prev.filter((r) => r._id !== fileId));
      showSuccess("Resource deleted.");
    } catch (err) {
      showError(getErrorMessage(err, "Failed to delete resource."));
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!submissionValue.trim() && !submissionFile) return;

    setSubmissionLoading(true);
    try {
      const criterion = (rubricCriteria || []).find(
        (c) => c.key === submissionModal.key,
      );
      const isFile = criterion?.evidenceType === "file";

      await studentApi.submitProjectEvidence(project._id, {
        criterionKey: submissionModal.key,
        value: submissionValue.trim(),
        file: isFile ? submissionFile : null,
      });
      showSuccess("Evidence submitted successfully");
      setSubmissionModal({ open: false, key: null });
      setSubmissionValue("");
      setSubmissionFile(null);
      await loadMilestonesAndEvidence();
    } catch (err) {
      showError(getErrorMessage(err, "Failed to submit evidence"));
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handlePreviewEvidence = (evidence) => {
    if (!evidence) return;
    const pathSource = evidence.value || "";
    const match = pathSource.match(/[/\\]uploads[/\\](.*)/i);
    let urlPath = match ? `uploads/${match[1]}` : pathSource;
    if (urlPath) {
      urlPath = urlPath.replace(/\\/g, "/").replace(/^\//, "");
    }

    setPreviewFile({
      id: evidence._id || urlPath,
      name: evidence.originalName || "Evidence Asset",
      type: evidence.fileType || "application/pdf",
      url: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${urlPath}`,
    });
  };

  const runGithubAction = async (fn, successText, failText) => {
    setGithubLoading(true);
    try {
      await fn();
      showSuccess(successText);
      await refreshPreview();
    } catch (err) {
      showError(getErrorMessage(err, failText));
    } finally {
      setGithubLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Standardized Orchestrator Header */}
        <StudentPageHeader
          protocolName="Project_Command_v2.0"
          title="Project Deployment Command"
          subtitle="Project Lifecycle & Asset Management"
          groupName={preview?.group?.name}
          rightSide={
            <div className="flex items-center gap-2">
              <span
                className={`rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                  project?.status === "submitted"
                    ? "bg-amber-50 border-amber-200 text-amber-600"
                    : project?.status === "under_review"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                      : project?.status === "approved" ||
                          project?.status === "completed"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : project?.status === "rejected"
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : project?.status === "in_progress"
                            ? "bg-blue-50 border-blue-200 text-blue-600"
                            : project?.status === "draft"
                              ? "bg-slate-50 border-slate-200 text-slate-500"
                              : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              >
                System Status:{" "}
                {project?.status ? project.status.replace("_", " ") : "Offline"}
              </span>
              {(project?.status === "approved" ||
                project?.status === "completed") && (
                <button
                  onClick={() => navigate("/student/grading-rubric")}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-700 active:scale-95 shadow-md"
                >
                  Target Rubric
                </button>
              )}
            </div>
          }
        />

        {/* Strategy KPI Layer */}
        <StatsCards
          stats={stats}
          status={
            status === "loading" ||
            feedbackStatus === "loading" ||
            resourceStatus === "loading"
              ? "loading"
              : "succeeded"
          }
        />

        {status === "failed" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-600 shadow-sm">
            {error}
          </div>
        )}

        {/* Operational Intelligence Layer */}
        {project?._id && (
          <div className="space-y-6">
            <StudentEvaluationPanel
              projectId={project._id}
              currentUserId={user?._id}
            />

            {/* Strategic Governance Hub (Phase 2) */}
            <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
              {/* Milestone Timeline */}
              <div className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <FiClock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">
                      Mission Roadmap
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Strategic Chronology
                    </p>
                  </div>
                </div>

                {milestoneStatus === "loading" ? (
                  <div className="space-y-3">
                    <LoadingSkeleton className="h-20 rounded-xl" />
                    <LoadingSkeleton className="h-20 rounded-xl" />
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <MilestoneTimeline
                      milestones={milestones}
                      activeMilestoneId={
                        milestones.find((m) => m.status === "pending")?._id
                      }
                    />
                  </div>
                )}
              </div>

              {/* Quality & Evidence Registry */}
              <div className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">
                      Quality Evidence
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Verification Assets Registry
                    </p>
                  </div>
                </div>

                {evidenceStatus === "loading" ? (
                  <div className="space-y-3">
                    <LoadingSkeleton className="h-32 rounded-xl" />
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <EvidenceRegistry
                      criteria={(() => {
                        const keys = [
                          ...new Set(
                            milestones.flatMap((m) => m.criteriaKeys || []),
                          ),
                        ];
                        return (rubricCriteria || []).filter((c) =>
                          keys.includes(c.key),
                        );
                      })()}
                      registry={evidenceRegistry}
                      onSubmitEvidence={(key) =>
                        setSubmissionModal({ open: true, key })
                      }
                      onPreview={handlePreviewEvidence}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Mission Proposal Briefing */}
          {status === "loading" || feedbackStatus === "loading" ? (
            <div className="space-y-4">
              <LoadingSkeleton className="h-48 rounded-2xl" />
              <LoadingSkeleton className="h-48 rounded-2xl" />
            </div>
          ) : (
            <div
              className="rounded-2xl 
             border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg">
                  <FiFileText size={16} />
                </div>
                <div>
                  <h2 className="text-[13px] font-black uppercase tracking-tight text-slate-800">
                    Mission Proposal Briefing
                  </h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Core Directive Core
                  </p>
                </div>
              </div>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100/50 px-2 py-1 rounded inline-block">
                Status: {guardMessage}
              </p>

              {project ? (
                <>
                  <button
                    onClick={() => setProjectDrawerOpen(true)}
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Active Proposal Node
                    </p>
                    <p className="mt-1 text-[13px] font-black uppercase tracking-tight text-slate-800">
                      {project.title || "Untitled project"}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
                      {project.description
                        ? project.description
                            .replace(/<[^>]*>?/gm, "")
                            .substring(0, 150) + "..."
                        : "No description parameters."}
                    </p>
                  </button>
                </>
              ) : (
                <form
                  onSubmit={handleSubmitProposal}
                  className="mt-4 space-y-3"
                >
                  <input
                    value={proposalForm.title}
                    onChange={(e) =>
                      setProposalForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Project Mission Title"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                    disabled={!canSubmit || proposalActionStatus === "loading"}
                  />

                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-200 px-3 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          Proposal Directives
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 transition-all hover:bg-slate-50">
                          ⏱️{" "}
                          {Math.max(
                            1,
                            Math.ceil(
                              (proposalForm.description || "")
                                .split(/\s+/)
                                .filter(Boolean).length / 200,
                            ),
                          )}{" "}
                          min read
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 transition-all hover:bg-slate-50">
                          Nodes:{" "}
                          {
                            [
                              "1. Problem Statement",
                              "2. Proposed Solution",
                              "3. Technology Stack",
                              "4. System Architecture",
                              "5. Expected Outcomes",
                            ].filter((h) =>
                              (proposalForm.description || "").includes(h),
                            ).length
                          }
                          /5
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setProposalForm((prev) => ({
                            ...prev,
                            description: PROPOSAL_TEMPLATE,
                          }))
                        }
                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded transition-all active:scale-95 uppercase tracking-widest"
                      >
                        Initialize Template
                      </button>
                    </div>
                    <div className="p-2.5 bg-indigo-50/50 border-b border-indigo-100 text-[10px] font-medium text-indigo-800">
                      <span className="font-bold">Intelligence Tip:</span>{" "}
                      Markdown syntax supported. Review tactical output in
                      "Preview".
                    </div>
                    <div data-color-mode="light">
                      <MDEditor
                        value={proposalForm.description}
                        onChange={(val) =>
                          setProposalForm((prev) => ({
                            ...prev,
                            description: val || "",
                          }))
                        }
                        previewOptions={{
                          rehypePlugins: [[rehypeSanitize]],
                        }}
                        height={300}
                        className="border-0 shadow-none !rounded-none"
                      />
                    </div>
                  </div>

                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setProposalForm((prev) => ({
                        ...prev,
                        files: Array.from(e.target.files || []).slice(0, 5),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                    disabled={!canSubmit || proposalActionStatus === "loading"}
                  />
                  {proposalForm.files.length > 0 && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">
                      {proposalForm.files.length} RESOURCE(S) ATTACHED
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!canSubmit || proposalActionStatus === "loading"}
                    className="h-10 px-8 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {proposalActionStatus === "loading"
                      ? "Transmitting..."
                      : "Transmit Proposal"}
                  </button>
                </form>
              )}

              {canDelete && (
                <button
                  onClick={handleDeleteProject}
                  disabled={proposalActionStatus === "loading"}
                  className="mt-4 h-9 px-6 border border-rose-200 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {proposalActionStatus === "loading"
                    ? "Purging..."
                    : "Purge Mission Node"}
                </button>
              )}
            </div>
          )}

          {/* Signals Intelligence */}
          <div className="rounded-2xl  border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-xl flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white shadow-lg">
                <FiMessageSquare size={16} />
              </div>
              <div>
                <h2 className="text-[13px] font-black uppercase tracking-tight text-slate-800">
                  Signals Intelligence
                </h2>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Communication Logs
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {feedbackStatus === "loading" ? (
                <p className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Syncing Logs...
                </p>
              ) : project?._id && feedback.length > 0 ? (
                feedback.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => setSelectedFeedback(item)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-tight text-slate-700">
                        {item.createdBy?.name || "Evaluator"}
                      </p>
                      <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] font-medium text-slate-600 leading-relaxed italic border-l-2 border-indigo-200 pl-2">
                      "{item.comment || item.message || "Feedback log empty."}"
                    </p>
                  </button>
                ))
              ) : (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-white/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    No signals transmitted.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tactical GitHub Intelligence */}
        {group && (
          <div className="mt-6">
            <GitHubPanel
              group={group}
              isLeader={isLeader}
              actionLoading={githubLoading}
              onLink={(repoUrl) =>
                runGithubAction(
                  () => studentApi.linkGithubRepo(repoUrl),
                  "Repository linked successfully.",
                  "Failed to link repository.",
                )
              }
              onSync={() =>
                runGithubAction(
                  () => studentApi.syncGithubCommits(),
                  "Commits synced from GitHub.",
                  "Failed to sync commits. Make sure the repository is public.",
                )
              }
              onUnlink={() =>
                runGithubAction(
                  () => studentApi.unlinkGithubRepo(),
                  "Repository unlinked.",
                  "Failed to unlink repository.",
                )
              }
            />
          </div>
        )}

        <div className="grid gap-6 mt-6 lg:grid-cols-2">
          {/* Tactical Registry Hub */}
          <div className="rounded-2xl  border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-xl flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
                  <FiLayers size={16} />
                </div>
                <div>
                  <h2 className="text-[13px] font-black uppercase tracking-tight text-slate-800">
                    Asset Registry
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Deployed Mission Files
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm">
                  <select
                    value={filterMemberId}
                    onChange={(e) => setFilterMemberId(e.target.value)}
                    className="bg-transparent text-[9px] font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer max-w-[120px]"
                  >
                    <option value="all">All Operators</option>
                    {uploaderStats.map((stat) => (
                      <option key={stat.id} value={stat.id}>
                        {stat.name} ({stat.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm">
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="bg-transparent text-[9px] font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer max-w-[100px]"
                  >
                    <option value="all">All Time</option>
                    <option value="7">This Week</option>
                    <option value="15">Last 15 Days</option>
                    <option value="30">Last Month</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {resourceStatus === "loading" ? (
                <p className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Fetching resources...
                </p>
              ) : filteredResources.length > 0 ? (
                filteredResources.map((res) => {
                  const displayName =
                    res.originalName ||
                    res.fileName ||
                    res.fileUrl?.split("\\").pop().split("/").pop() ||
                    "Unnamed Asset";
                  return (
                    <div
                      key={res._id}
                      className="group flex flex-col sm:flex-row items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <p
                            className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px] sm:max-w-[250px]"
                            title={displayName}
                          >
                            {displayName}
                          </p>
                          <div className="flex items-center gap-1.5 border-l-2 border-slate-100 pl-2 ml-1">
                            {renderUploaderTag(res)}
                          </div>
                        </div>

                        {res.description && (
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5 line-clamp-1 italic">
                            {res.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="rounded-md border border-slate-200 bg-slate-50 text-slate-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                            {formatRelativeTime(res.createdAt)}
                          </span>
                          <p className="rounded-md border border-slate-200 bg-slate-50 text-slate-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                            {res.category || res.fileType || "file"}
                          </p>
                          {(res.linkedTasks || []).length > 0 && (
                            <span className="rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                              {res.linkedTasks.length} LINKED
                            </span>
                          )}
                        </div>

                        {(res.linkedTasks || []).length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                            {(res.linkedTasks || []).slice(0, 3).map((task) => (
                              <span
                                key={task._id || task}
                                className="rounded-md border border-indigo-100 bg-indigo-50/70 px-2 py-0.5 text-[8px] font-black uppercase text-indigo-700 tracking-tight"
                              >
                                {task.title || "Task"}
                              </span>
                            ))}
                            {(res.linkedTasks || []).length > 3 && (
                              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase text-slate-600">
                                +{(res.linkedTasks || []).length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <button
                          onClick={() => {
                            const extension = (displayName || "")
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
                            const actionParam = isPreviewable
                              ? "?action=preview"
                              : "";

                            setPreviewFile({
                              id: res._id,
                              name: displayName,
                              type: res.category || res.fileType || "file",
                              url: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student/resources/${res._id}/download${actionParam}`,
                            });
                          }}
                          className="h-7 px-3 rounded-lg bg-slate-900 border border-slate-950 text-[8px] font-black uppercase tracking-widest text-white shadow-sm hover:bg-slate-800 transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleDeleteResource(res._id)}
                          className="h-7 px-3 rounded-lg bg-rose-50 border border-rose-100 text-[8px] font-black uppercase tracking-widest text-rose-600 shadow-sm hover:bg-rose-100 transition-colors"
                        >
                          Purge
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl bg-white/50">
                  <MdOutlineInbox className="text-3xl mb-2 text-slate-300" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    No resources match filters.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl  border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-lg">
                <FiZap size={16} />
              </div>
              <div>
                <h2 className="text-[13px] font-black uppercase tracking-tight text-slate-800">
                  Asset Deployment
                </h2>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Transmission Node
                </p>
              </div>
            </div>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Secure Asset Hosting
            </p>

            <form
              onSubmit={handleUploadResource}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-6 transition-colors hover:bg-indigo-50/60 group">
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                  <FiUpload className="text-2xl mb-2 text-indigo-500 relative z-10 group-hover:scale-110 transition-transform" />
                  <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest relative z-10">
                    Initialize Upload Stream
                  </p>
                  <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest relative z-10">
                    Supports media and documents
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.csv,.png,.jpg,.jpeg,.gif,.txt,.md,.js,.jsx,.ts,.tsx,.json,.txt,.xml,.css,.html"
                    onChange={(e) =>
                      setResourceFile(e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    disabled={resourceUploadStatus === "loading" || !group}
                  />
                </div>

                {resourceFile && (
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-700 truncate pr-2 max-w-[200px]">
                      {resourceFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setResourceFile(null)}
                      className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors"
                    >
                      Abort
                    </button>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 pl-1">
                      Resource Descriptor (Optional)
                    </label>
                    <input
                      type="text"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      placeholder="E.g., Architecture Diagram"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 disabled:opacity-50"
                      disabled={resourceUploadStatus === "loading" || !group}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 pl-1">
                      Context (Optional)
                    </label>
                    <textarea
                      value={resourceDesc}
                      onChange={(e) => setResourceDesc(e.target.value)}
                      placeholder="E.g., Required for phase 3 execution"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5 resize-none h-20 disabled:opacity-50"
                      disabled={resourceUploadStatus === "loading" || !group}
                    />
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 pl-1">
                        Link To Tactical Nodes
                      </label>
                      <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500">
                        {linkedTaskIds.length} ATTACHED
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 space-y-1 custom-scrollbar shadow-sm">
                      {linkableTasks.length === 0 && (
                        <p className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          No nodes available.
                        </p>
                      )}
                      {linkableTasks.map((task) => {
                        const taskId = String(task._id);
                        const checked = linkedTaskIds.includes(taskId);
                        return (
                          <label
                            key={taskId}
                            className={`flex cursor-pointer items-center justify-between rounded-lg border px-2 py-1.5 transition-all ${
                              checked
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-transparent hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p
                                className={`truncate text-[10px] font-black uppercase tracking-tight ${checked ? "text-indigo-800" : "text-slate-700"}`}
                              >
                                {task.title}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={
                                resourceUploadStatus === "loading" || !group
                              }
                              onChange={() =>
                                setLinkedTaskIds((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== taskId)
                                    : [...prev, taskId],
                                )
                              }
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  resourceUploadStatus === "loading" || !resourceFile || !group
                }
                className="w-full rounded-lg bg-slate-900 border border-slate-950 px-4 py-3 mt-5 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                {resourceUploadStatus === "loading"
                  ? "Transmitting..."
                  : "Finalize Transmission"}
              </button>
            </form>
          </div>

          <StudentDetailDrawer
            open={projectDrawerOpen}
            onClose={() => setProjectDrawerOpen(false)}
            title={project?.title || "Proposal Detail"}
            subtitle="Mission Blueprint & Directives"
          >
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                <FiFileText size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Identity Core
                </p>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  {project?.title || "Project Node"}
                </h3>
              </div>
            </div>
            {project && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/60 pb-2 mb-2">
                    Description
                  </p>
                  <div
                    data-color-mode="light"
                    className="mt-1 max-h-[400px] overflow-y-auto custom-scrollbar"
                  >
                    <MDEditor.Markdown
                      source={project.description || "No description."}
                      rehypePlugins={[[rehypeSanitize]]}
                      style={{
                        background: "transparent",
                        fontSize: "11px",
                        color: "#334155",
                        fontWeight: "500",
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/60 pb-2 mb-2">
                    Sync Status
                  </p>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                    {String(project.status || "none").replace("_", " ")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/60 pb-2 mb-2">
                    Transmitted Resources
                  </p>
                  <div className="mt-2 space-y-2">
                    {files.length > 0 ? (
                      files.map((file) => (
                        <div
                          key={file.id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                        >
                          <p className="text-[10px] font-black uppercase tracking-tight text-slate-700">
                            {file.name}
                          </p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                            {file.type}
                          </p>
                          {file.url ? (
                            <p className="truncate text-[9px] text-indigo-500 font-medium">
                              {file.url}
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        No files attached.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </StudentDetailDrawer>

          <StudentDetailDrawer
            open={Boolean(selectedFeedback)}
            onClose={() => setSelectedFeedback(null)}
            title="Signal Detail"
            subtitle="Tactical Evaluator Feedback"
          >
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-sky-900 text-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400">
                <FiMessageSquare size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                  Signal Origin
                </p>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  {selectedFeedback?.createdBy?.name || "Command Center"}
                </h3>
              </div>
            </div>
            {selectedFeedback && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/60 pb-2 mb-3">
                    Communication Log
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-700 italic border-l-2 border-indigo-200 pl-3">
                    "
                    {selectedFeedback.comment ||
                      selectedFeedback.message ||
                      "No text."}
                    "
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/60 pb-2 mb-2">
                    Timestamp
                  </p>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </StudentDetailDrawer>

          <Suspense fallback={null}>
            <FileViewerDrawer
              open={Boolean(previewFile)}
              onClose={() => setPreviewFile(null)}
              file={previewFile}
            />
          </Suspense>

          {/* Evidence Submission Overlay */}
          <StudentDetailDrawer
            open={submissionModal.open}
            onClose={() => setSubmissionModal({ open: false, key: null })}
            title="Evidence Submission"
            subtitle={`Proof of Work for ${submissionModal.key}`}
          >
            <form onSubmit={handleSubmitEvidence} className="space-y-6 pt-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">
                  Protocol Requirement
                </p>
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  {rubricCriteria.find((c) => c.key === submissionModal.key)
                    ?.description || "Please provide the requested evidence."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  {rubricCriteria.find((c) => c.key === submissionModal.key)
                    ?.evidenceType === "file"
                    ? "Native Asset Upload"
                    : "Evidence Descriptor / URL"}
                </label>
                {rubricCriteria.find((c) => c.key === submissionModal.key)
                  ?.evidenceType === "file" ? (
                  <div className="relative group">
                    <input
                      type="file"
                      required
                      onChange={(e) =>
                        setSubmissionFile(e.target.files?.[0] || null)
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-8 flex flex-col items-center justify-center transition-colors group-hover:bg-indigo-50/60">
                      <FiUpload className="text-2xl text-indigo-500 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        {submissionFile
                          ? submissionFile.name
                          : "Select Asset from System"}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                        Video, PDF, or Document
                      </p>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={submissionValue}
                    onChange={(e) => setSubmissionValue(e.target.value)}
                    placeholder="https://github.com/... or Full Implementation Status"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={submissionLoading}
                className="w-full h-11 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {submissionLoading
                  ? "Securing Proof..."
                  : "Finalize Submission"}
              </button>
            </form>
          </StudentDetailDrawer>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StudentProjectsPage;
