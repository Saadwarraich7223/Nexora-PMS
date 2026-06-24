import { useState } from "react";
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiBell,
  FiCheck,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import teacherApi from "../api/teacherApi.js";

const SupervisorAtRiskPanel = ({ atRiskGroups = [], atRiskStatus }) => {
  const [warningStatus, setWarningStatus] = useState({});
  const navigate = useNavigate();

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "high":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "medium":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100"><FiAlertTriangle size={14} /></div>;
      case "medium":
        return <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100"><FiAlertCircle size={14} /></div>;
      default:
        return <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-sm border border-slate-100"><FiInfo size={14} /></div>;
    }
  };

  const handleSendWarning = async (group) => {
    const id = String(group.groupId);
    setWarningStatus((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const res = await teacherApi.warnGroup(id, group.issues || []);
      showSuccess(res.message || `Warning sent to ${group.groupName}.`);
      setWarningStatus((prev) => ({ ...prev, [id]: "sent" }));
      setTimeout(() => setWarningStatus((prev) => ({ ...prev, [id]: null })), 4000);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to send warning.");
      setWarningStatus((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none shadow-sm rounded-3xl">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">Intervention Console</h2>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">High-priority at-risk cohorts requiring oversight</p>
      </div>

      <div className="divide-y divide-slate-50 overflow-y-auto max-h-[400px]">
        {atRiskStatus === "loading" ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div key={`skel-${index}`} className="p-6 flex items-center gap-4">
              <LoadingSkeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                 <LoadingSkeleton className="h-4 w-1/3 rounded" />
                 <LoadingSkeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))
        ) : atRiskGroups.length > 0 ? (
          atRiskGroups.map((group) => {
            const id = String(group.groupId);
            const status = warningStatus[id];
            return (
              <div key={id} className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-4 flex-1">
                   {getSeverityIcon(group.severity)}
                   <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-rose-600 transition-colors">{group.groupName}</p>
                      <span className={`inline-flex px-2 py-0.5 mt-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getSeverityStyle(group.severity)}`}>
                        {group.severity} Lethality
                      </span>
                   </div>
                </div>

                <div className="w-full md:w-auto flex-1 bg-white/50 border border-slate-100 rounded-xl p-3">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Detected Friction</p>
                   <p className="text-[10px] font-bold text-slate-600 line-clamp-1 italic">{group.issues[0]} {group.issues.length > 1 && `(+${group.issues.length - 1} more)`}</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                   <button
                     onClick={() => navigate(`/teacher/groups`)}
                     className="h-8 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white transition-all shadow-sm"
                   >
                     Protocol
                   </button>
                   <button
                     onClick={() => handleSendWarning(group)}
                     disabled={status === "loading" || status === "sent"}
                     className={`h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${
                       status === "sent" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                       status === "loading" ? "bg-slate-50 text-slate-300 border border-slate-100 cursor-wait" :
                       "bg-rose-600 text-white border-transparent hover:bg-rose-700 active:scale-95 shadow-rose-200/50"
                     }`}
                   >
                     {status === "sent" ? <><FiCheck /> Dispatch</> : status === "loading" ? "Sending" : <><FiBell /> Warn</>}
                   </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center flex flex-col items-center">
             <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 shadow-sm border border-emerald-100">
                <FiCheck size={20} />
             </div>
             <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Active Stability</p>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">All cohorts are operating within normal parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorAtRiskPanel;
