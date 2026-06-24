import asyncHandler from "../../utils/asyncHandler.js";
import * as projectService from "../../services/student/project.service.js";
import * as evaluationService from "../../services/teacher/evaluation.service.js";
import Project from "../../models/project.model.js";
import RubricCriteria from "../../models/rubricCriteria.model.js";
import ApiError from "../../utils/apiError.js";

// Submit a project proposal for an approved group.
const submitProposal = asyncHandler(async (req, res) => {
  const user = req.user;

  const { title, description } = req.body;
  const files = req.files
    ? req.files.map((f) => {
        const parts = f.path.split(/[/\\]uploads[/\\]/);
        const relativeUrl = parts.length > 1 ? `/uploads/${parts[1].replace(/\\/g, "/")}` : f.path.replace(/\\/g, "/");
        return {
          fileType: f.mimetype,
          fileUrl: relativeUrl,
          originalName: f.originalname,
          category: "other",
        };
      })
    : [];

  const project = await projectService.submitProposal({
    user,
    title,
    description,
    files,
  });

  res.json({ message: "Proposal submitted successfully", project });
});

// Get student project .
const getMyProject = asyncHandler(async (req, res) => {
  const user = req.user;
  const project = await projectService.getMyProject(user);

  res.json({ message: "Project fetched successfully", project });
});

const deleteMyProject = asyncHandler(async (req, res) => {
  const user = req.user;
  await projectService.deleteMyProject(user);
  return res.json({ message: "Project deleted successfully" });
});

const getProjectFeedback = asyncHandler(async (req, res) => {
  const user = req.user;
  const { projectId } = req.params;
  const feedback = await projectService.getProjectFeedback(user, projectId);

  res.json({
    message: "Project feedback fetched successfully",
    count: feedback.length,
    feedback,
  });
});

const saveCanvasState = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { canvasState } = req.body;
  
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  project.architectureCanvasState = canvasState;
  await project.save();
  
  res.json({ message: "Canvas state saved successfully" });
});

const getEvaluation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const evaluation = await evaluationService.getStudentEvaluation(projectId);
  res.json({ evaluation }); // null if not published yet
});

const submitGradeChallenge = asyncHandler(async (req, res) => {
  const challenge = await projectService.submitGradeChallenge(
    req.user,
    req.params.projectId,
    req.body,
  );

  res.json({
    message: "Grade challenge submitted successfully",
    challenge,
  });
});

const getGradeChallenges = asyncHandler(async (req, res) => {
  const challenges = await projectService.getMyGroupGradeChallenges(
    req.user,
    req.params.projectId,
  );

  res.json({
    message: "Grade challenges fetched successfully",
    count: challenges.length,
    challenges,
  });
});

const getProjectEvidence = asyncHandler(async (req, res) => {
  const evidence = await projectService.getProjectEvidence(req.user, req.params.projectId);
  res.json({ evidence });
});

const submitEvidence = asyncHandler(async (req, res) => {
  const { criterionKey, value } = req.body;
  let fileData = null;

  if (req.file) {
    const parts = req.file.path.split(/[/\\]uploads[/\\]/);
    const relativeUrl = parts.length > 1 ? `/uploads/${parts[1].replace(/\\/g, "/")}` : req.file.path.replace(/\\/g, "/");
    fileData = {
      fileUrl: relativeUrl,
      originalName: req.file.originalname,
      fileType: req.file.mimetype
    };
  }

  const evidence = await projectService.submitEvidence(req.user, req.params.projectId, { 
    criterionKey, 
    value, 
    file: fileData 
  });
  res.json({ message: "Evidence submitted successfully", evidence });
});

const getProjectMilestones = asyncHandler(async (req, res) => {
  const milestones = await projectService.getProjectMilestones(req.user, req.params.projectId);
  res.json({ milestones });
});

const getRubricCriteria = asyncHandler(async (req, res) => {
  const criteria = await RubricCriteria.find({ isActive: true }).lean();
  res.json({ criteria });
});

export {
  submitProposal,
  getMyProject,
  deleteMyProject,
  getProjectFeedback,
  saveCanvasState,
  getEvaluation,
  submitGradeChallenge,
  getGradeChallenges,
  getProjectEvidence,
  submitEvidence,
  getProjectMilestones,
  getRubricCriteria,
};
