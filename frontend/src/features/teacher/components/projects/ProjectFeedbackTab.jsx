import React from "react";
import FeedbackComposerPanel from "./FeedbackComposerPanel.jsx";
import FeedbackHistoryPanel from "./FeedbackHistoryPanel.jsx";

const ProjectFeedbackTab = ({
  canAddFeedback,
  feedbackForm,
  setFeedbackForm,
  features,
  actionStatus,
  onFeedbackSubmit,
  onGenerateAIDraft,
  isDraftingAI,
  feedback,
  feedbackStatus,
  formatDate
}) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <FeedbackComposerPanel
        visible={canAddFeedback}
        form={feedbackForm}
        setForm={setFeedbackForm}
        features={features}
        actionStatus={actionStatus}
        onSubmit={onFeedbackSubmit}
        onGenerateAIDraft={onGenerateAIDraft}
        isDraftingAI={isDraftingAI}
      />
      <FeedbackHistoryPanel
        feedback={feedback}
        feedbackStatus={feedbackStatus}
        formatDate={formatDate}
      />
    </div>
  );
};

export default ProjectFeedbackTab;
