import React, { useState } from "react";
import { 
  FiFileText, 
  FiLink, 
  FiCpu, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock,
  FiUpload,
  FiExternalLink,
  FiMoreVertical,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";

/**
 * EvidenceRegistry allows viewing and submitting proof for grading criteria.
 * Supports both Student (submission) and Teacher (validation) modes.
 */
const EvidenceRegistry = ({ 
  criteria = [], 
  registry = [], 
  isReadOnly = false,
  onSubmitEvidence = null,
  onValidateEvidence = null,
  onPreview = null,
}) => {
  const [expandedKey, setExpandedKey] = useState(null);

  const getEvidenceForCriterion = (key) => registry.find(e => e.criterionKey === key);

  const StatusIcon = ({ status, isRequired }) => {
    switch (status) {
      case "approved": return <FiCheckCircle className="text-emerald-500" />;
      case "rejected": return <FiAlertCircle className="text-rose-500" />;
      case "pending": return <FiClock className="text-blue-500 animate-pulse" />;
      default: return isRequired ? <FiAlertCircle className="text-slate-300" /> : <FiClock className="text-slate-200" />;
    }
  };

  return (
    <div className="space-y-2">
      {criteria.map((criterion) => {
        const evidence = getEvidenceForCriterion(criterion.key);
        const isExpanded = expandedKey === criterion.key;
        const hasEvidence = !!evidence;

        return (
          <div 
            key={criterion.key}
            className={`
              rounded-xl border transition-all duration-300 overflow-hidden
              ${isExpanded ? "border-indigo-200 bg-indigo-50/10 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"}
            `}
          >
            {/* Minimalist Header */}
            <div 
              className="flex items-center gap-3 p-3 cursor-pointer group"
              onClick={() => setExpandedKey(isExpanded ? null : criterion.key)}
            >
              <div className={`w-1 self-stretch rounded-full ${
                evidence?.validationStatus === 'approved' ? 'bg-emerald-400' :
                evidence?.validationStatus === 'rejected' ? 'bg-rose-400' :
                evidence?.validationStatus === 'pending' ? 'bg-blue-400' : 'bg-slate-200'
              }`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate border-b border-transparent group-hover:border-slate-200 transition-all">{criterion.label}</h4>
                  {criterion.isRequired && (
                    <span className="text-[8px] font-black uppercase text-rose-500 tracking-tighter">
                      * Req
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{criterion.evidenceType}</p>
              </div>

              <div className="flex items-center gap-2">
                <StatusIcon status={evidence?.validationStatus} isRequired={criterion.isRequired} />
                {isExpanded ? <FiChevronUp className="text-slate-300 w-3 h-3" /> : <FiChevronDown className="text-slate-300 w-3 h-3" />}
              </div>
            </div>

            {/* Compact Expanded Content */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-2 border-t border-slate-100/50 space-y-3">
                <p className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  {criterion.description}
                </p>

                {/* Evidence View/Input Section */}
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  {criterion.evidenceType === "automated" ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <FiCpu className="animate-spin-slow w-3 h-3" />
                        System Audit
                      </div>
                      <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                        View
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hasEvidence ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className="text-[10px] text-slate-700 font-bold truncate">{evidence.originalName || evidence.value}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {(criterion.evidenceType === "link" || criterion.evidenceType === "file") && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (criterion.evidenceType === "file" && onPreview) {
                                      onPreview(evidence);
                                    } else {
                                      const url = criterion.evidenceType === "link" ? evidence.value : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${evidence.value}`;
                                      window.open(url, "_blank");
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 text-[9px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-95"
                                >
                                  Preview
                                </button>
                              )}
                              {!isReadOnly && (
                                <button 
                                  onClick={() => onSubmitEvidence && onSubmitEvidence(criterion.key)}
                                  className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
                                >
                                  Swap
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Validation Note / Feedback */}
                          {evidence.validationNote && (
                            <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Audit Note</p>
                              <p className="text-[10px] text-slate-600 leading-tight">"{evidence.validationNote}"</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        !isReadOnly && (
                          <button 
                            onClick={() => onSubmitEvidence && onSubmitEvidence(criterion.key)}
                            className="w-full py-2 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                          >
                            <FiUpload className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Provide Proof</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Teacher Validation Section */}
                {evidence && onValidateEvidence && evidence.validationStatus === "pending" && (
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100/30">
                     <div className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       Verify Protocol
                     </div>
                    <button 
                      onClick={() => onValidateEvidence(evidence._id, 'approved')}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onValidateEvidence(evidence._id, 'rejected')}
                      className="px-3 py-1 rounded-lg bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EvidenceRegistry;
