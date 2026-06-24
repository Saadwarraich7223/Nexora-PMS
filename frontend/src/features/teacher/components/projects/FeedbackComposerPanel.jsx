import React, { useState, useRef, useEffect } from "react";
import { HiSparkles } from "react-icons/hi";
import {
  FiLoader,
  FiPlus,
  FiFile,
  FiPaperclip,
  FiHash,
  FiZap,
  FiMessageSquare,
  FiChevronDown,
} from "react-icons/fi";

const FeedbackComposerPanel = ({
  visible,
  form,
  setForm,
  features,
  actionStatus,
  onSubmit,
  onGenerateAIDraft,
  isDraftingAI,
}) => {
  const [tone, setTone] = useState("encouraging");
  const textareaRef = useRef(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [form.message]);

  if (!visible) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {/* --- Header & AI Draft Bar --- */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-white/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <FiMessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">
            Feedback Orchestra
          </h3>
        </div>

        {/* Improved AI Draft Bar */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <div className="flex bg-white/60 p-0.5 rounded-lg border border-slate-200">
            {["encouraging", "direct", "strict"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all duration-200 ${
                  tone === t
                    ? "bg-slate-900 rounded-md text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onGenerateAIDraft(tone)}
            disabled={isDraftingAI || actionStatus === "loading"}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-indigo-200 disabled:opacity-50"
          >
            {isDraftingAI ? (
              <FiLoader className="w-3 h-3 animate-spin" />
            ) : (
              <HiSparkles className="w-3 h-3 text-indigo-300" />
            )}
            {isDraftingAI ? "Synthesizing..." : "AI Intelligence Draft"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* --- Metadata Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Transmission Mode
            </label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-black uppercase text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer tracking-wider"
              >
                <option value="suggestion">Suggestion</option>
                <option value="issue">Issue</option>
                <option value="praise">Praise</option>
              </select>
              <FiChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Priority Index
            </label>
            <div className="relative">
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-black uppercase text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer tracking-wider"
              >
                <option value="low">Low Intensity</option>
                <option value="medium">Medium Priority</option>
                <option value="high">Critical Direct</option>
              </select>
              <FiChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Node Title
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="ENTRY_SUBJECT..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[11px] font-black uppercase placeholder:text-slate-300 text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all tracking-wider"
            />
          </div>
        </div>

        {/* --- Message Area --- */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Intelligence Message
          </label>
          <textarea
            ref={textareaRef}
            rows={4}
            value={form.message}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, message: e.target.value }))
            }
            placeholder="POST_FEEDBACK_DATA..."
            className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[13px] leading-relaxed text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none shadow-inner font-bold uppercase tracking-tight"
          />
        </div>

        {/* --- Linked Features --- */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FiHash className="text-indigo-400" size={14} />
              Feature Linkage Matrix
            </label>
            <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-[0.2em]">
              {form.featureIds.length} Linked Nodes
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
            {features.length === 0 && (
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest py-2 italic opacity-60">
                No features detected in the current node.
              </p>
            )}
            {features.map((feature) => {
              const featureId = String(feature._id);
              const checked = form.featureIds.includes(featureId);
              return (
                <button
                  key={featureId}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      featureIds: checked
                        ? prev.featureIds.filter((id) => id !== featureId)
                        : [...prev.featureIds, featureId],
                    }))
                  }
                  className={`px-3.5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                    checked
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {feature.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Attachment & Submit --- */}
        <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              multiple
              id="feedback-files"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  files: Array.from(e.target.files || []).slice(0, 5),
                }))
              }
              className="hidden"
            />
            <label
              htmlFor="feedback-files"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-500 transition-all cursor-pointer border border-slate-100 hover:border-slate-900 group/file"
            >
              <FiPaperclip
                size={14}
                className="text-slate-400 group-hover/file:text-indigo-400 transition-colors"
              />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {form.files.length > 0
                  ? `${form.files.length} NODE_FILES`
                  : "Attach External Assets"}
              </span>
            </label>

            {form.files.length > 0 && (
              <div className="flex gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                {Array.from(form.files).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200 animate-pulse"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setForm({
                  type: "suggestion",
                  title: "",
                  message: "",
                  priority: "medium",
                  files: [],
                  featureIds: [],
                })
              }
              className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-rose-500 transition-colors"
            >
              Clear Matrix
            </button>
            <button
              type="submit"
              disabled={actionStatus === "loading" || isDraftingAI}
              className="px-10 py-3.5 bg-slate-950 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {actionStatus === "loading"
                ? "SYNCHRONIZING..."
                : "Transmit Feedback"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </form>
  );
};

export default FeedbackComposerPanel;
