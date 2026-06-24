import { useState } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiRefreshCw,
  FiArrowUp,
  FiAlertTriangle,
  FiThumbsUp,
  FiTarget,
  FiShield,
  FiClock,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const ProposalAnalyzerPanel = ({ analysis, onReanalyze, projectId }) => {
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  if (!analysis) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-100 border-emerald-200";
    if (score >= 60) return "text-amber-600 bg-amber-100 border-amber-200";
    return "text-rose-600 bg-rose-100 border-rose-200";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Insufficient";
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return "bg-emerald-400";
    if (score >= 60) return "bg-amber-400";
    return "bg-rose-400";
  };

  const handleReanalyze = async () => {
    if (!onReanalyze || isReanalyzing) return;
    setIsReanalyzing(true);
    try {
      await onReanalyze(projectId);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const booleanFlags = [
    { label: "Problem Statement", value: analysis.hasProblemStatement },
    { label: "Solution", value: analysis.hasSolution },
    { label: "Tech Stack", value: analysis.hasTechStack },
    { label: "Architecture", value: analysis.hasArchitecture },
    { label: "Outcomes", value: analysis.hasOutcomes },
  ];

  const hasAIData = analysis.analyzedByAI && (
    (analysis.strengths && analysis.strengths.length > 0) ||
    (analysis.weaknesses && analysis.weaknesses.length > 0) ||
    (analysis.suggestions && analysis.suggestions.length > 0)
  );

  const isPlagiarism = analysis.riskFlags?.includes("HIGH_PLAGIARISM_RISK") || analysis.isDuplicate;

  return (
    <div className={`mt-4 rounded-2xl border p-5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 ${isPlagiarism ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200/50'}`}>

      {/* --- Plagiarism Warning ------------------------------------ */}
      {isPlagiarism && (
        <div className="mb-6 flex items-start gap-4 rounded-xl bg-rose-600 p-4 text-white shadow-lg animate-pulse">
          <FiAlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-1">
              Plagiarism Protocol Triggered
            </p>
            <p className="text-[13px] font-black leading-relaxed tracking-tight">
              {analysis.contextObservation || "This proposal is a functional duplicate of an existing project in the registry. Integrity breach detected."}
            </p>
            <div className="mt-3 flex items-center gap-2">
               <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Action: Automatic Score Nullified</span>
               <span className="text-[9px] font-black uppercase tracking-widest bg-rose-900/40 px-2 py-0.5 rounded border border-rose-400/30">Priority: Critical</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Header ------------------------------------------------ */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <FiZap className="text-indigo-500" size={13} />
          </div>
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">
            AI Proposal Intelligence
          </span>
          {analysis.analyzedByAI && (
            <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-500 border border-indigo-200 rounded-lg uppercase tracking-widest scale-90">
              SYNTHESIZED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getScoreColor(analysis.score)}`}>
            {analysis.score} / 100 · {getScoreLabel(analysis.score)}
          </div>
        </div>
      </div>

      {/* --- Score Bar --------------------------------------------- */}
      <div className="mb-4 px-1">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getScoreBarColor(analysis.score)}`}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">
            <FiClock className="inline mr-1" size={9} />
            {analysis.aiAnalyzedAt
              ? `Synthesized ${new Date(analysis.aiAnalyzedAt).toLocaleString()}`
              : "Keyword Spectrum Analysis"}
          </span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">
            {analysis.wordCount} Semantic Units
          </span>
        </div>
      </div>

      {/* --- Boolean Flags ----------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
        {booleanFlags.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
              item.value
                ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm shadow-emerald-500/5 focus:ring-4 focus:ring-emerald-500/10"
                : "bg-rose-50 border-rose-100 text-rose-600 opacity-60 shadow-inner"
            }`}
          >
            {item.value ? (
              <FiCheckCircle size={10} />
            ) : (
              <FiAlertCircle size={10} />
            )}
            {item.label}
          </div>
        ))}
      </div>

      {/* --- AI Insights Grid -------------------------------------- */}
      {hasAIData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-2 mb-3 relative overflow-hidden h-4">
                <FiThumbsUp className="text-emerald-500 group-hover:-translate-y-10 group-hover:opacity-0 transition-all duration-300" size={11} />
                <FiZap className="text-emerald-500 absolute top-10 group-hover:top-0 transition-all duration-300" size={11} />
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                  Strategic Strengths
                </span>
              </div>
              <ul className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 mt-1 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
                    <span className="text-[11px] font-bold text-emerald-900 leading-tight tracking-tight uppercase opacity-80">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-2 mb-3 relative overflow-hidden h-4">
                <FiAlertTriangle className="text-amber-500 group-hover:-translate-y-10 group-hover:opacity-0 transition-all duration-300" size={11} />
                <FiAlertCircle className="text-amber-500 absolute top-10 group-hover:top-0 transition-all duration-300" size={11} />
                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                  Weakness Indices
                </span>
              </div>
              <ul className="space-y-2">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 mt-1 rounded-full bg-amber-400 shrink-0 shadow-sm" />
                    <span className="text-[11px] font-bold text-amber-900 leading-tight tracking-tight uppercase opacity-80">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-2 mb-3 relative overflow-hidden h-4">
                <FiTarget className="text-indigo-500 group-hover:-translate-y-10 group-hover:opacity-0 transition-all duration-300" size={11} />
                <FiZap className="text-indigo-500 absolute top-10 group-hover:top-0 transition-all duration-300" size={11} />
                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                  Optimization Path
                </span>
              </div>
              <ul className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FiArrowUp className="text-indigo-400 mt-0.5 shrink-0" size={11} />
                    <span className="text-[11px] font-bold text-indigo-900 leading-tight tracking-tight uppercase opacity-80">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Flags */}
          {analysis.riskFlags && analysis.riskFlags.length > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-2 mb-3 relative overflow-hidden h-4">
                <FiShield className="text-rose-500 group-hover:-translate-y-10 group-hover:opacity-0 transition-all duration-300" size={11} />
                <FiAlertTriangle className="text-rose-500 absolute top-10 group-hover:top-0 transition-all duration-300" size={11} />
                <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">
                  Critical Risk Flags
                </span>
              </div>
              <ul className="space-y-2">
                {analysis.riskFlags.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 mt-1 rounded-full bg-rose-400 shrink-0 shadow-sm" />
                    <span className="text-[11px] font-bold text-rose-900 leading-tight tracking-tight uppercase opacity-80">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* --- Recommendation ---------------------------------------- */}
      {analysis.recommendation && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner group">
           <div className="flex items-center gap-2 mb-2">
              <HiSparkles className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={12} />
              <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Final Strategy Alignment</span>
           </div>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight leading-relaxed opacity-70">
            {analysis.recommendation}
          </p>
        </div>
      )}

      {/* --- Re-Analyze Button ------------------------------------- */}
      {onReanalyze && (
        <div className="mt-4 flex justify-end px-1">
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={isReanalyzing ? "animate-spin" : ""} size={12} />
            {isReanalyzing ? "Synthesizing Protocol..." : "Re-Analyze Node"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProposalAnalyzerPanel;
