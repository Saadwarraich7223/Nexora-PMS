import { useMemo } from "react";
import { useSelector } from "react-redux";
import { 
  FiPieChart, 
  FiTarget, 
  FiActivity, 
  FiZap, 
  FiLayers,
  FiAlertCircle,
  FiClock,
  FiUser,
  FiAward,
  FiInfo
} from "react-icons/fi";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
} from "recharts";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import StudentPageHeader from "../components/shared/StudentPageHeader.jsx";
import StatsCards from "../../admin/components/StatsCards.jsx";
import "../studentTheme.css";

const groupWeights = [
  { 
    name: "Feature Completion", 
    value: 30, 
    color: "#6366f1", 
    desc: "Software asset delivery." 
  },
  { 
    name: "Deadline Performance", 
    value: 20, 
    color: "#8b5cf6", 
    desc: "Adherence to milestones." 
  },
  { 
    name: "Task Completion", 
    value: 15, 
    color: "#3b82f6", 
    desc: "Kanban node resolution." 
  },
  { 
    name: "Meeting Engagement", 
    value: 15, 
    color: "#f59e0b", 
    desc: "Tactical sync participation." 
  },
  { 
    name: "Code Contribution", 
    value: 10, 
    color: "#10b981", 
    desc: "Git registry codebase impact." 
  },
  { 
    name: "Proposal Quality", 
    value: 10, 
    color: "#06b6d4", 
    desc: "Initial protocol feasibility." 
  },
];

const personalMetrics = [
  { name: "Group Base Score", value: 70, color: "#94a3b8" },
  { name: "Personal Tasks", value: 15, color: "#6366f1" },
  { name: "Meeting Attendance", value: 15, color: "#f59e0b" },
];

const StudentGradingRubricPage = () => {
  const { preview, status } = useSelector((state) => state.student);
  const group = preview.group;

  const stats = useMemo(() => [
    { 
      label: "Evaluation Base", 
      value: "100%", 
      sub: "Max Potential Score", 
      icon: <FiTarget />, 
      color: "text-indigo-600" 
    },
    { 
      label: "Modifier Impact", 
      value: "30%", 
      sub: "Personal Performance", 
      icon: <FiActivity />, 
      color: "text-emerald-600" 
    },
    { 
      label: "Core Precision", 
      value: "70%", 
      sub: "Group Baseline", 
      icon: <FiAward />, 
      color: "text-amber-600" 
    },
    { 
      label: "Sync Status", 
      value: "Live", 
      sub: "Real-time Telemetry", 
      icon: <FiLayers />, 
      color: "text-slate-600" 
    },
  ], []);

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 sm:px-6">
        
        <StudentPageHeader
          protocolName="Grading_Command_v3.0"
          title="Evaluation Matrix"
          subtitle="Systematic Performance Logic & Grade Distribution Telemetry"
          groupName={group?.name || "Independent Operative"}
        />

        <StatsCards stats={stats} status={status} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Group Weights</h2>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Precision Matrix</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <FiPieChart size={24} />
              </div>
            </div>

            <div className="h-[280px] w-full mb-8 relative">
                {/* Decorative Center Node */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-24 h-24 rounded-full bg-white shadow-xl border border-slate-50 flex items-center justify-center transition-transform hover:scale-105">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base</span>
                    </div>
                </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupWeights}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {groupWeights.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-2xl border border-slate-700/50">
                            {payload[0].name}: {payload[0].value}%
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-3 flex-1">
              {groupWeights.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-indigo-100 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full shadow-lg group-hover:scale-125 transition-transform shrink-0" style={{ backgroundColor: item.color }}></div>
                    <div className="flex flex-col">
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight group-hover:text-slate-900 leading-none mb-1.5 font-sans">{item.name}</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate max-w-[200px]">{item.desc}</span>
                    </div>
                  </div>
                  <span className="text-[12px] font-black text-slate-900 font-mono tracking-tighter">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calculation Logic</h2>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Performance Delta</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <FiActivity size={24} />
              </div>
            </div>

            <div className="h-[280px] w-full mb-8 relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={personalMetrics}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={105}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={8}
                  >
                    {personalMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-2xl border border-slate-700/50">
                            {payload[0].name}: {payload[0].value}%
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[32px] p-8 shadow-2xl shadow-indigo-900/20 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-110 transition-transform" />
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-400/20 backdrop-blur-md">
                     <FiInfo size={20} />
                  </div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Intelligence Protocol</h4>
               </div>
               <p className="text-[12px] font-bold text-indigo-100/90 leading-relaxed uppercase tracking-tight mb-8">
                  Your final score inherits <span className="text-white border-b-2 border-indigo-500">70% Group Base</span> score, with a <span className="text-white border-b-2 border-indigo-500">30% High-Precision modifier</span> based on individual asset delivery.
               </p>
               <div className="bg-black/20 p-5 rounded-2xl border border-white/5 backdrop-blur-xl">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">CONSOLIDATED_FORMULA_v3.0</p>
                  <div className="font-mono text-[11px] text-white/90 font-bold leading-relaxed space-y-2">
                     <div className="flex justify-between items-center opacity-40"><span>S_FINAL =</span></div>
                     <div className="pl-6 border-l border-white/10">(G_BASE * 0.70) +</div>
                     <div className="pl-6 border-l border-white/10">(P_TASKS * 0.15) +</div>
                     <div className="pl-6 border-l border-white/10">(M_LOGS * 0.15)</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm group">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 h-16 w-16 bg-rose-50 border border-rose-100 rounded-[24px] flex items-center justify-center text-rose-500 shadow-sm transition-transform group-hover:rotate-12">
               <FiAlertCircle size={32} />
            </div>
            <div className="flex-1 space-y-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">Risk Abatement Protocol</h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2 truncate">Critical Performance Deductions & Penalty Multipliers</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Temporal Lag", sub: "Overdue Milestones", desc: "Delayed node delivery degrades Group Base Score integrity.", icon: <FiClock /> },
                    { label: "Asset Void", sub: "Uncompleted Tasks", desc: "Floating Kanban assets directly erode Individual Modifiers.", icon: <FiZap /> },
                    { label: "Presence Gap", sub: "Meeting Absence", desc: "supervisor-logged absence triggers immediate score multipliers.", icon: <FiUser /> }
                  ].map((risk, idx) => (
                    <div key={idx} className="space-y-3 p-4 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-rose-500">
                             {risk.icon}
                          </div>
                          <div>
                             <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tight leading-none">{risk.label}</h4>
                             <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mt-1.5">{risk.sub}</p>
                          </div>
                       </div>
                       <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                          {risk.desc}
                       </p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StudentGradingRubricPage;
