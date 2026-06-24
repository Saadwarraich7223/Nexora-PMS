import React from "react";
import ProjectHealthPanel from "./ProjectHealthPanel.jsx";
import ProjectCompletionPanel from "./ProjectCompletionPanel.jsx";
import ProjectFeaturesPanel from "./ProjectFeaturesPanel.jsx";
import { FiTrendingUp, FiCheckCircle, FiAward } from "react-icons/fi";

const ProjectIntelligenceTab = ({
  project,
  features,
  featuresStatus,
  onReanalyzeHealth,
  onProjectCompleted,
  onPreviewResource,
  setEvalDrawerOpen,
  navigate
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Health Intelligence */}
      <ProjectHealthPanel
        project={project}
        onReanalyze={onReanalyzeHealth}
      />

      <div className="grid lg:grid-cols-[1fr_0.8fr] gap-6">
        {/* Features Workspace */}
        <ProjectFeaturesPanel
          features={features}
          loading={featuresStatus === "loading"}
          onPreviewResource={onPreviewResource}
          compact={true}
        />

        <div className="space-y-6">
          {/* Completion Tracking */}
          <ProjectCompletionPanel
            projectId={project._id}
            projectStatus={project.status}
            onCompleted={onProjectCompleted}
          />

          {/* Evaluation Shortcuts */}
          {(project.status === "completed" || project.status === "approved" || project.status === "in_progress") && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <FiAward className="text-amber-400" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Final Evaluation</p>
                  <p className="text-[10px] text-slate-400">Assess performance and assign grades.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setEvalDrawerOpen(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-bold uppercase transition-colors"
                >
                  Quick Grade
                </button>
                <button
                  onClick={() => navigate(`/teacher/projects/${project._id}/evaluation`)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-[10px] font-bold uppercase transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Full Evaluation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectIntelligenceTab;
