import React from "react";
import { 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiLock,
  FiChevronRight
} from "react-icons/fi";
import { format } from "date-fns";

/**
 * MilestoneTimeline displays project progress through chronological gates.
 */
const MilestoneTimeline = ({ milestones, activeMilestoneId = null, onSelect = null, onDelete = null }) => {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
        <FiLock className="text-3xl mb-2 opacity-50" />
        <p className="text-sm font-medium">No milestones defined yet</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FiCheckCircle className="text-emerald-500" />;
      case "blocked":
        return <FiAlertCircle className="text-rose-500" />;
      case "submitted":
        return <FiClock className="text-blue-500 animate-pulse" />;
      default:
        return <FiClock className="text-slate-400" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "border-emerald-200 bg-emerald-50/30";
      case "blocked":
        return "border-rose-200 bg-rose-50/30";
      case "submitted":
        return "border-blue-200 bg-blue-50/30";
      default:
        return "border-slate-200 bg-white";
    }
  };

  return (
    <div className="space-y-2">
      {milestones.map((milestone, index) => {
        const isActive = activeMilestoneId === milestone._id;
        const isPastDue = new Date(milestone.dueDate) < new Date() && milestone.status === "pending";

        return (
          <div
            key={milestone._id}
            onClick={() => onSelect && onSelect(milestone)}
            className={`
              relative flex items-start gap-3 p-3 rounded-2xl border transition-all duration-300
              ${getStatusClass(milestone.status)}
              ${onSelect ? "cursor-pointer hover:shadow-lg hover:scale-[1.01]" : ""}
              ${isActive ? "ring-2 ring-indigo-500 ring-offset-2" : ""}
              ${isPastDue ? "border-amber-300 bg-amber-50/50" : ""}
            `}
          >
            {/* Connector Line */}
            {index < milestones.length - 1 && (
              <div className="absolute left-6 top-12 bottom-[-0.75rem] w-0.5 bg-slate-100 z-0" />
            )}

            {/* Status Icon Wrapper */}
            <div className={`
              relative z-10 flex-shrink-0 w-6 h-6 mt-0.5 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100
            `}>
              {getStatusIcon(milestone.status)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                  {milestone.name}
                </h4>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${isPastDue ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {milestone.status}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                <span className="flex items-center gap-1">
                  <FiClock className="w-2.5 h-2.5" />
                  {format(new Date(milestone.dueDate), "MMM dd")}
                </span>
              </div>
            </div>

            {/* No chevron for cleaner look */}
          </div>
        );
      })}
    </div>
  );
};

export default MilestoneTimeline;
