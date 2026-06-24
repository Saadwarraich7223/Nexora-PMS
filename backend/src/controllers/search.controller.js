import Group from "../models/group.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ragService from "../services/rag.service.js";
import { logger } from '../utils/logger.js';


/**
 * @desc    Global search across multiple entities
 * @route   GET /api/v1/search
 * @access  Private
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json({
      success: true,
      data: {
        users: [],
        groups: [],
        projects: [],
        tasks: [],
      },
    });
  }

  const searchRegex = new RegExp(q, "i");

  // Perform parallel searches for performance
  const [users, groups, projects, tasks] = await Promise.all([
    User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    })
      .select("name email role profilePicture")
      .limit(5)
      .lean(),

    Group.find({
      name: searchRegex,
    })
      .select("name department semester")
      .limit(5)
      .lean(),

    Project.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .select("title description status thumbnail")
      .limit(15) // Fetch more for reranking
      .lean(),

    Task.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .select("title status priority deadline")
      .limit(5)
      .lean(),
  ]);

  // Semantic Reranking for Projects (RAG)
  let rerankedProjects = projects;
  if (projects.length > 5 && q.length > 3) {
    try {
      rerankedProjects = await ragService.rerankProjects(q, projects, 5);
    } catch (error) {
      logger.error("Reranking failed, falling back to regex:", error);
      rerankedProjects = projects.slice(0, 5);
    }
  } else {
    rerankedProjects = projects.slice(0, 5);
  }

  res.status(200).json({
    success: true,
    data: {
      users,
      groups,
      projects: rerankedProjects,
      tasks,
    },
  });
});
