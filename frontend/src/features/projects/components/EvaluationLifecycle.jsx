import React from 'react';
import { FiCheckCircle, FiEdit3, FiSend, FiAlertCircle, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

const activityIconMap = {
  draft_saved: { icon: FiEdit3, color: 'text-amber-500', bg: 'bg-amber-50' },
  published: { icon: FiCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  second_review_requested: { icon: FiSend, color: 'text-blue-500', bg: 'bg-blue-50' },
  moderation_decision: { icon: FiAlertCircle, color: 'text-violet-500', bg: 'bg-violet-50' },
  challenge_submitted: { icon: FiAlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  challenge_resolved: { icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const EvaluationLifecycle = ({ activities = [] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400">
        <FiClock size={20} className="mb-2 opacity-50" />
        <p className="text-[10px]">No activity history yet.</p>
      </div>
    );
  }

  const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-100" />
        <div className="space-y-6">
          {sortedActivities.map((activity, idx) => {
            const config = activityIconMap[activity.type] || { icon: FiClock, color: 'text-slate-400', bg: 'bg-slate-50' };
            const Icon = config.icon;
            
            return (
              <div key={activity._id || idx} className="relative pl-10">
                <div className={`absolute left-0 w-7 h-7 rounded-full ${config.bg} flex items-center justify-center border-2 border-white shadow-sm z-10`}>
                  <Icon className={config.color} size={14} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-800 capitalize">
                      {activity.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {activity.note}
                  </p>
                  {activity.actor && (
                    <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                      By <span className="font-semibold text-slate-500">{activity.actor.name}</span>
                      <span className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 uppercase text-[7px] leading-none">
                        {activity.actor.role}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvaluationLifecycle;
