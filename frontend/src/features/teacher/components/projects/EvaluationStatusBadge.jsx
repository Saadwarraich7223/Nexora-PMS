import React from 'react';

const EvaluationStatusBadge = ({ status }) => {
  const configs = {
    draft: {
      label: 'Draft',
      bg: 'bg-amber-100/50',
      text: 'text-amber-700',
      border: 'border-amber-200/50',
      dot: 'bg-amber-500'
    },
    pending_second_review: {
      label: 'Under Review',
      bg: 'bg-blue-100/50',
      text: 'text-blue-700',
      border: 'border-blue-200/50',
      dot: 'bg-blue-500'
    },
    published: {
      label: 'Published',
      bg: 'bg-emerald-100/50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/50',
      dot: 'bg-emerald-500'
    },
    challenged: {
      label: 'Challenged',
      bg: 'bg-rose-100/50',
      text: 'text-rose-700',
      border: 'border-rose-200/50',
      dot: 'bg-rose-500'
    }
  };

  const config = configs[status] || configs.draft;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} backdrop-blur-sm shadow-sm transition-all duration-300`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
    </div>
  );
};

export default EvaluationStatusBadge;
