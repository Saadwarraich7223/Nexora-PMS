import { FiActivity, FiCheckCircle, FiAlertTriangle, FiTarget, FiZap } from "react-icons/fi";

const GroupIntelligencePanel = ({ group, requests, supervisorRequest }) => {
  if (!group) return null;

  const memberCount = (group.members || []).length;
  const maxMembers = group.maxMembers || 4;
  const fillPercentage = (memberCount / maxMembers) * 100;
  
  const metrics = [
    {
      label: "Operational Capacity",
      value: `${memberCount}/${maxMembers}`,
      percent: fillPercentage,
      status: fillPercentage === 100 ? "optimal" : "scaling",
      icon: <FiZap size={14} />
    },
    {
      label: "Guidance Alignment",
      value: group.supervisor ? "Locked" : (supervisorRequest ? "Pending" : "Required"),
      status: group.supervisor ? "optimal" : "warning",
      icon: <FiTarget size={14} />
    }
  ];

  const milestones = [
    { label: "Squad Formation", completed: true },
    { label: "Identity Verification", completed: true },
    { label: "Guidance Allocation", completed: !!group.supervisor },
    { label: "Initial Briefing", completed: !!group.project },
  ];

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-xs rounded-xl h-full transition-all group/panel">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiActivity className="text-indigo-600" size={12} />
          <h2>Synergy Intelligence</h2>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Analysis</span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Metric Layer */}
        <div className="space-y-4">
          {metrics.map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{m.icon}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{m.label}</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${m.status === 'optimal' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {m.value}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${m.status === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: m.percent ? `${m.percent}%` : (m.status === 'optimal' ? '100%' : '50%') }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Strategic Readiness Checklist */}
        <div className="pt-4 border-t border-slate-50">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Strategic Readiness</h3>
          <div className="grid grid-cols-1 gap-2">
            {milestones.map((ms, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-white transition-all">
                <span className={`text-[10px] font-bold uppercase tracking-tight ${ms.completed ? 'text-slate-700' : 'text-slate-400'}`}>
                  {ms.label}
                </span>
                {ms.completed ? (
                  <FiCheckCircle className="text-emerald-500" size={14} />
                ) : (
                  <FiAlertTriangle className="text-amber-500" size={14} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupIntelligencePanel;
