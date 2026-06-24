import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiFilter,
  FiActivity,
  FiDownload,
  FiMessageCircle,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import adminApi from "../../api/adminApi";
import { showSuccess, showError } from "../../../../components/ui/toast.jsx";
import getErrorMessage from "../../../../utils/error.js";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const SignalRegistryCard = ({ onResolve }) => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("open");
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
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
    const headers = [
      "ID",
      "Type",
      "Severity",
      "Message",
      "Status",
      "Resolution",
      "Created At",
    ];
    const rows = signals.map((s) => [
      s._id,
      s.type,
      s.severity,
      s.message,
      s.status,
      s.resolutionNote || "",
      new Date(s.createdAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `escalations_${filter}_${new Date().toLocaleDateString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Exported to CSV");
  };

  useEffect(() => {
    loadSignals();
  }, [filter]);

  const handleResolve = async (signalId) => {
    try {
      const response = await adminApi.resolveSignal(
        signalId,
        resolutionNote,
        actions
      );
      if (response.success) {
        showSuccess("Signal resolved successfully");
        setResolvingId(null);
        setResolutionNote("");
        setActions({ warnStudents: false, escalateSupervisor: false });
        loadSignals();
        if (onResolve) onResolve();
      }
    } catch (error) {
      showError(getErrorMessage(error, "Failed to resolve signal"));
    }
  };

  const severityStyle = (severity) => {
    switch (severity) {
      case "high":
        return "bg-rose-50 text-rose-600 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-600 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const typeIcon = (type) =>
    type === "integrity" ? (
      <FiAlertTriangle size={14} />
    ) : (
      <FiClock size={14} />
    );

  return (
    <div className="bg-white/80 flex flex-col h-full w-full">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <FiShield size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Escalations</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              System alerts & resolution tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Tabs */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {["open", "resolved"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all ${
                  filter === s
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {signals.length > 0 && (
            <button
              onClick={exportSignals}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200"
              title="Export CSV"
            >
              <FiDownload size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          /* Empty State */
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
              <FiCheckCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              All Clear
            </h3>
            <p className="text-[12px] text-slate-400 font-medium max-w-xs">
              No {filter === "open" ? "active" : "resolved"} escalations found.
              The system is running smoothly.
            </p>
          </div>
        ) : (
          /* Signal Cards Grid */
          <div className="grid gap-3 sm:grid-cols-2">
            {signals.map((signal) => (
              <div
                key={signal._id}
                className={`rounded-xl border p-4 transition-all ${
                  signal.status === "resolved"
                    ? "bg-slate-50/50 border-slate-100 opacity-80"
                    : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md"
                }`}
              >
                {/* Signal Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        signal.type === "integrity"
                          ? "bg-rose-50 text-rose-500"
                          : "bg-amber-50 text-amber-500"
                      }`}
                    >
                      {typeIcon(signal.type)}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      {signal.type}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityStyle(
                      signal.severity
                    )}`}
                  >
                    {signal.severity}
                  </span>
                </div>

                {/* Message */}
                <p className="text-[12px] font-semibold text-slate-800 leading-snug mb-3">
                  {signal.message}
                </p>

                {/* Meta Row */}
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium mb-3">
                  <span>
                    {signal.project?.title ||
                      signal.group?.name ||
                      "System Record"}
                  </span>
                  <span>
                    {new Date(signal.createdAt).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {/* Resolution / Actions */}
                {signal.status === "resolved" ? (
                  <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FiCheckCircle size={10} className="text-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-600">
                        Resolved
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">
                      "{signal.resolutionNote}"
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1">
                      by {signal.resolvedBy?.name} on{" "}
                      {new Date(signal.resolvedAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : resolvingId === signal._id ? (
                  /* Resolve Form */
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={actions.warnStudents}
                          onChange={(e) =>
                            setActions((prev) => ({
                              ...prev,
                              warnStudents: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-700 group-hover:text-rose-600 transition-colors">
                            Send warning to group
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={actions.escalateSupervisor}
                          onChange={(e) =>
                            setActions((prev) => ({
                              ...prev,
                              escalateSupervisor: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">
                            Escalate to supervisor
                          </p>
                        </div>
                      </label>
                    </div>

                    <textarea
                      placeholder="Resolution note..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      className="w-full text-[12px] p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all placeholder:text-slate-400 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(signal._id)}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <FiCheckCircle size={12} />
                        Resolve
                      </button>
                      <button
                        onClick={() => {
                          setResolvingId(null);
                          setActions({
                            warnStudents: false,
                            escalateSupervisor: false,
                          });
                        }}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[11px] font-semibold hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(signal._id)}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <FiMessageCircle size={12} />
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiActivity size={12} className="text-slate-400" />
          <span className="text-[11px] font-medium text-slate-400">
            {signals.length} {filter} escalation{signals.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={loadSignals}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default SignalRegistryCard;
