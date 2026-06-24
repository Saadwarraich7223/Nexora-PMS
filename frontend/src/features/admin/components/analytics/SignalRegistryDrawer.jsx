import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiAlertTriangle, 
  FiClock, 
  FiShield, 
  FiCheckCircle, 
  FiChevronRight, 
  FiMessageCircle,
  FiFilter,
  FiActivity,
  FiDownload
} from 'react-icons/fi';
import adminApi from '../../api/adminApi';
import { showSuccess, showError } from '../../../../components/ui/toast.jsx';
import getErrorMessage from '../../../../utils/error.js';
import LoadingSkeleton from '../../../../components/ui/LoadingSkeleton.jsx';

const SignalRegistryDrawer = ({ open, onClose, onResolve }) => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('open');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actions, setActions] = useState({
    warnStudents: false,
    escalateSupervisor: false,
  });

  const loadSignals = async () => {
    setLoading(true);
    try {
      const response = await adminApi.fetchSignals(filter);
      if (response.success) {
        setSignals(response.data || []);
      }
    } catch (error) {
      showError(getErrorMessage(error, "Failed to load signals"));
    } finally {
      setLoading(false);
    }
  };

  const exportSignals = () => {
    if (signals.length === 0) return;
    const headers = ["ID", "Type", "Severity", "Message", "Status", "Resolution", "Created At"];
    const rows = signals.map(s => [
      s._id,
      s.type,
      s.severity,
      s.message,
      s.status,
      s.resolutionNote || "",
      new Date(s.createdAt).toISOString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `signal_registry_${filter}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Audit trail exported to CSV");
  };

  useEffect(() => {
    if (open) loadSignals();
  }, [open, filter]);

  const handleResolve = async (signalId) => {
    try {
      const response = await adminApi.resolveSignal(signalId, resolutionNote, actions);
      if (response.success) {
        showSuccess("Signal resolved and protocols executed");
        setResolvingId(null);
        setResolutionNote('');
        setActions({ warnStudents: false, escalateSupervisor: false });
        loadSignals();
        if (onResolve) onResolve();
      }
    } catch (error) {
      showError(getErrorMessage(error, "Failed to resolve signal"));
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-slate-50 shadow-2xl z-[70] transform transition-transform duration-500 ease-out border-l border-white overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
                 <FiShield size={20} />
              </div>
              <div>
                 <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900">Incident Registry</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Governance Audit Trail</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              {signals.length > 0 && (
                <button 
                  onClick={exportSignals}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                  title="Export Audit Trail"
                >
                   <FiDownload size={18} />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                 <FiX size={20} />
              </button>
           </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-white/50 border-b border-slate-100 flex items-center gap-2">
           <FiFilter size={14} className="text-slate-400 mr-2" />
           {['open', 'resolved'].map((s) => (
             <button
               key={s}
               onClick={() => setFilter(s)}
               className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                 filter === s 
                 ? 'bg-slate-900 text-white shadow-md' 
                 : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
               }`}
             >
               {s}
             </button>
           ))}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="space-y-4">
               {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} className="h-32 rounded-3xl" />)}
            </div>
          ) : signals.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-10">
               <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
                  <FiCheckCircle size={32} />
               </div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2 text-center">Infrastructure Nominal</h3>
               <p className="text-[11px] text-slate-400 font-medium leading-relaxed text-center">No active signals detected. System heartbeats and compliance layers are currently stable.</p>
            </div>
          ) : (
            <div className="space-y-4">
               {signals.map((signal) => (
                 <div 
                   key={signal._id}
                   className={`glass-card p-5 border shadow-sm transition-all ${
                     signal.status === 'resolved' ? 'opacity-70 bg-white/40' : 'bg-white border-white hover:border-indigo-200'
                   }`}
                 >
                    <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${
                            signal.type === 'integrity' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                          }`}>
                            {signal.type === 'integrity' ? <FiAlertTriangle size={16} /> : <FiClock size={16} />}
                          </div>
                          <div>
                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{signal.type} Anomaly</span>
                             <h4 className="text-[12px] font-black text-slate-900 tracking-tight leading-none mt-0.5">
                               {signal.message}
                             </h4>
                          </div>
                       </div>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                         signal.severity === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                          {signal.severity}
                       </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Entity</p>
                          <p className="text-[10px] font-bold text-slate-700 truncate">
                            {signal.project?.title || signal.group?.name || "System Record"}
                          </p>
                       </div>
                       <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Telemetry Origin</p>
                          <p className="text-[10px] font-bold text-slate-700">
                            {new Date(signal.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                       </div>
                    </div>

                    {signal.status === 'resolved' ? (
                      <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                         <div className="flex items-center gap-2 mb-1">
                            <FiCheckCircle size={10} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Resolution Log</span>
                         </div>
                         <p className="text-[10px] font-medium text-slate-600 italic">"{signal.resolutionNote}"</p>
                         <p className="text-[8px] text-emerald-600 font-bold mt-2 uppercase tracking-tighter">
                           Resolved by {signal.resolvedBy?.name} on {new Date(signal.resolvedAt).toLocaleDateString()}
                         </p>
                      </div>
                    ) : resolvingId === signal._id ? (
                      <div className="animate-in slide-in-from-top-2">
                        <div className="mb-4 space-y-3">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Tactical Response Protocols</p>
                           
                           <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={actions.warnStudents}
                                onChange={(e) => setActions(prev => ({ ...prev, warnStudents: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                              />
                              <div className="flex-1">
                                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight group-hover:text-rose-600 transition-colors">Emit Formal Warning</p>
                                 <p className="text-[8px] text-slate-400 font-medium">Sends automated alert + email to all group members</p>
                              </div>
                           </label>

                           <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={actions.escalateSupervisor}
                                onChange={(e) => setActions(prev => ({ ...prev, escalateSupervisor: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              />
                              <div className="flex-1">
                                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight group-hover:text-amber-600 transition-colors">Escalate to Supervisor</p>
                                 <p className="text-[8px] text-slate-400 font-medium">Sends high-priority tactical briefing to faculty lead</p>
                              </div>
                           </label>
                        </div>

                        <textarea
                          placeholder="Strategic resolution note..."
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          className="w-full text-[11px] p-3 rounded-2xl border border-indigo-200 bg-indigo-50/20 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                          rows={2}
                        />
                        <div className="mt-4 flex gap-2">
                           <button 
                             onClick={() => handleResolve(signal._id)}
                             className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                           >
                             <FiShield size={12} />
                             Confirm & Execute Protocols
                           </button>
                           <button 
                             onClick={() => {
                               setResolvingId(null);
                               setActions({ warnStudents: false, escalateSupervisor: false });
                             }}
                             className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                           >
                             Cancel
                           </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setResolvingId(signal._id)}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 group-hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                      >
                         <FiMessageCircle size={12} />
                         Initiate Resolution Flow
                      </button>
                    )}
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer State */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <FiActivity size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Incidents: {signals.length}</span>
           </div>
           <p className="text-[9px] font-bold text-slate-300 uppercase italic">Secure Governance Node // Nexus-V6.1</p>
        </div>
      </div>
    </>
  );
};

export default SignalRegistryDrawer;
