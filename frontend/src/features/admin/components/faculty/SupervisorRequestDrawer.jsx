import {
  FiAlertCircle,
  FiUser,
  FiInfo,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiArrowRight,
  FiActivity,
} from "react-icons/fi";

const SupervisorRequestDrawer = ({
  open,
  onClose,
  request,
  onApprove,
  onReject,
  actionStatus,
}) => {
  if (!open) return null;

  const group = request?.group || {};
  const requestedBy = request?.requestedBy || {};
  const supervisor =
    request?.supervisorId || request?.requestedSupervisor || {};

  return (
    <div className="fixed inset-0 -top-6 z-50 flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4 text-[10px]">
      <div
        onClick={onClose}
        className="fixed inset-0 -top-6 z-50 flex justify-end p-4 text-[10px]"
      />
      <div className="glass-card  z-50 flex h-full w-full max-w-md flex-col overflow-hidden p-6 border-none shadow-2xl bg-white slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-inner anim-pulse-slow">
              <FiAlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                Supervisor Request
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1">
                Action Required | {group.name || "Unnamed Group"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all border border-slate-100"
          >
            <FiXCircle size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
          {/* Request Narrative */}
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <FiMessageSquare size={60} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-3">
              Student Proposition
            </p>
            <p className="text-xs text-slate-600 italic leading-relaxed font-medium">
              "{request.note || "No specific note provided for this request."}"
            </p>
          </div>

          {/* Core Entities */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card bg-white p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <FiUser size={12} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Requested By
                </span>
              </div>
              <p className="text-xs font-black text-slate-800">
                {requestedBy.name || "Student"}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                {requestedBy.email || "Official ID"}
              </p>
            </div>
            <div className="glass-card bg-white p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <FiUser size={12} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Target Supervisor
                </span>
              </div>
              <p className="text-xs font-black text-slate-800">
                {supervisor.name || "Faculty"}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                Capacity: {supervisor.assignedGroups?.length || 0} /{" "}
                {supervisor.supervisorCapacity || 0}
              </p>
            </div>
          </div>

          {/* Group Intelligence */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <FiInfo className="text-slate-400" size={12} />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cohort Intelligence
              </h4>
            </div>
            <div className="glass-card bg-slate-50/30 p-5 border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-slate-800">
                    {group.name}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                    {group.department} | SEM {group.semester}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">
                    Configuration
                  </p>
                  <p className="text-xs font-black text-slate-800">
                    {group.members?.length || 0} / {group.maxMembers || 4}{" "}
                    Members
                  </p>
                </div>
              </div>
              {group.description && (
                <div className="pt-3 border-t border-slate-200/50">
                  <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-tighter">
                    {group.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Workload Impact */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <FiActivity className="text-slate-400" size={12} />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Resource Impact Analysis
              </h4>
            </div>
            <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-indigo-900 tracking-tight">
                  Supervisor Capacity Utilization
                </p>
                <span className="text-[10px] font-black text-indigo-600">
                  {(supervisor.assignedGroups?.length || 0) + 1} /{" "}
                  {supervisor.supervisorCapacity || 0}
                </span>
              </div>
              <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      (((supervisor.assignedGroups?.length || 0) + 1) /
                        (supervisor.supervisorCapacity || 1)) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[9px] text-indigo-400 font-medium mt-2 italic">
                Approving this request will increment the supervisor's active
                group count.
              </p>
            </div>
          </div>

          {/* Tactical Actions */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <button
              onClick={() => onApprove(request)}
              disabled={actionStatus === "loading"}
              className="w-full h-11 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              <FiCheckCircle size={16} />{" "}
              {actionStatus === "loading"
                ? "Processing..."
                : "Confirm & Assign Supervisor"}
            </button>
            <button
              onClick={() => onReject(request)}
              disabled={actionStatus === "loading"}
              className="w-full h-11 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <FiXCircle size={16} /> Decline Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorRequestDrawer;
