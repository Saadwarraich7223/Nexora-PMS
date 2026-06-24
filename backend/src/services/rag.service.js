import ApiError from "../utils/apiError.js";
import Groq from "groq-sdk";
import { logger } from '../utils/logger.js';


let groq;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (e) {
  groq = null;
}

/**
 * Baseline RAG (Retrieval-Augmented Generation) Service
 * Currently implements LLM-based semantic reranking as a baseline for project context.
 */
class RAGService {
  /**
   * Semantically rerank candidates based on project description
   */
  async rerankProjects(query, candidates, topK = 5) {
    if (!groq) return candidates.slice(0, topK);
    if (!candidates || candidates.length === 0) return [];

    const candidateText = candidates
      .map(
        (c, i) =>
          `[ID: ${i}] ${c.title}: ${c.description.substring(0, 200)}...`,
      )
      .join("\n");

    const prompt = `You are a Semantic Search Re-ranker. Given a user's project query and a list of candidate projects, identify the most relevant ones.
    
Query: "${query}"

Candidates:
${candidateText}

Return ONLY a comma-separated list of IDs (e.g. 0, 2, 5) of the TOP ${topK} most relevant projects. Order them by relevance. Return nothing else.`;

    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant", // Reranking can use the faster model
        temperature: 0.1,
      });

      const ids = response.choices[0]?.message?.content
        ?.split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      return ids.map((id) => candidates[id]).filter(Boolean);
    } catch (error) {
      logger.error("RAG Reranking Error:", error);
      return candidates.slice(0, topK);
    }
  }

  /**
   * Retrieves semantically relevant historical context for project analysis.
   */
  async retrieveProjectContext(currentProject, historicalProjects) {
    if (!historicalProjects || historicalProjects.length === 0) return [];

    // Use the description as the primary query for semantic matching
    // rerankProjects is already defined in your RAGService
    const ranked = await this.rerankProjects(
      `Title: ${currentProject.title} Description:
      ${currentProject.description}`,
      historicalProjects,
      5,
    );

    // Format the output to match what analyzeProposalAI expects (title, summary,outcome)
    return ranked.map((p) => ({
      title: p.title,
      summary: p.description,
      outcome: p.status === "completed" ? "Success" : p.status,
    }));
  }

  /**
   * Compare current project stats with historical outcomes to identify risk patterns.
   */
  async getHistoricalHealthContext(currentStats, historicalArchive) {
    if (!groq || !historicalArchive || historicalArchive.length === 0)
      return "";

    const archiveText = historicalArchive
      .map(
        (p, i) =>
          `[Pattern ${i}] ${p.title} (Status: ${p.status}): Velocity: ${p.completionMetrics?.tasksCompleted}/${p.completionMetrics?.tasksTotal} tasks. Outcome: ${p.healthReport?.summary || "N/A"}`,
      )
      .join("\n");

    const prompt = `You are a Project Pattern Matcher. Compare this current project's performance with historical project patterns.
    
Current Project Stats:
- Tasks: ${currentStats.completed}/${currentStats.total}
- Overdue: ${currentStats.overdue}
- Recent Meetings: ${currentStats.meetingCount}

Historical Archive:
${archiveText}

Identify the most relevant historical pattern. Does this current project resemble a pattern that succeeded or failed? 
Return a brief (1-2 sentence) comparative insight.`;

    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      logger.error("RAG Health Context Error:", error);
      return "";
    }
  }
}

export default new RAGService();
