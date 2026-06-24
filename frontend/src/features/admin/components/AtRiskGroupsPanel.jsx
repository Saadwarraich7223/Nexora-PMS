import { useState } from "react";
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiBell,
  FiCheck,
  FiUsers,
  FiUserX,
  FiTarget,
  FiChevronRight,
  FiMinusCircle,
  FiShield,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";
import adminApi from "../api/adminApi.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const AtRiskGroupsPanel = ({ atRiskGroups, atRiskStatus, onViewGroup }) => {
  const [warningStatus, setWarningStatus] = useState({});
  const [activeTab, setActiveTab] = useState("failing");

  const data = atRiskGroups || {
    orphanGroups: [],
    unresponsiveSupervisors: [],
    failingGroups: [],
  };
  const orphans = data.orphanGroups || [];
  const supervisors = data.unresponsiveSupervisors || [];
  const failing = data.failingGroups || [];

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "high":
        return "border-rose-500 bg-rose-50/30";
      case "medium":
        return "border-amber-400 bg-amber-50/30";
      default:
        return "border-slate-200 bg-slate-50/30";
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "high":
        return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
      case "medium":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
      default:
        return "bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.4)]";
    }
  };

  const handleSendWarning = async (groupId, issues = []) => {
    const id = String(groupId);
    setWarningStatus((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const res = await adminApi.warnGroup(id, issues);
      showSuccess(res.message || `Warning sent.`);
      setWarningStatus((prev) => ({ ...prev, [id]: "sent" }));
      setTimeout(
        () => setWarningStatus((prev) => ({ ...prev, [id]: null })),
        4000,
      );
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to send warning.");
      setWarningStatus((prev) => ({ ...prev, [id]: null }));
    }
  };

  const renderGroupList = (list, emptyMessage) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-700">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[30px] rounded-full animate-pulse scale-150"></div>
            <div className="relative z-10 w-12 h-12 rounded-2xl bg-white border border-emerald-50 flex items-center justify-center shadow-xl shadow-emerald-100/50">
              <FiShield className="text-emerald-500" size={20} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg shadow-emerald-200">
               <FiCheck className="text-white" size={10} />
            </div>
          </div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
            Governance Core Stable
          </h3>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest max-w-[200px] leading-tight opacity-50">
            {emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-3 p-4">
        {list.map((item, idx) => {
          const isSupervisor = !!item.supervisorId;
          const id = String(isSupervisor ? item.supervisorId : item.groupId);
          const status = warningStatus[id];
          const severity = item.severity || "low";

          return (
            <div
              key={`${id}-${idx}`}
              className={`group relative flex flex-col md:flex-row md:items-center justify-between border-l-4 rounded-xl p-4 transition-all hover:shadow-sm ${getSeverityStyle(severity)} overflow-hidden`}
            >
              {/* Background Glow */}
              {severity === "high" && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-3xl rounded-full"></div>
              )}

              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${getSeverityBadge(severity)}`}
                  ></div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">
                    {isSupervisor ? item.supervisorName : item.groupName}
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-white/80 border border-slate-100 px-2 py-0.5 rounded text-slate-500">
                    {item.department || "Academic"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.issues.map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-white/60 border border-slate-100 rounded-md px-2 py-1"
                    >
                      <FiMinusCircle
                        className={
                          severity === "high"
                            ? "text-rose-500"
                            : "text-amber-500"
                        }
                        size={10}
                      />
                      <span className="text-[10px] font-bold text-slate-600 line-clamp-1">
                        {issue}
                      </span>
                    </div>
                  ))}
                </div>

                {isSupervisor && item.affectedGroups && (
                  <p className="mt-2 text-[9px] text-slate-400 font-bold flex items-center gap-1">
                    <FiUsers size={12} /> Impacting:{" "}
                    {item.affectedGroups.join(", ")}
                  </p>
                )}
              </div>

              <div className="relative z-10 flex items-center gap-2 mt-4 md:mt-0 md:pl-6 md:border-l border-slate-200/50">
                {!isSupervisor && (
                  <button
                    onClick={() =>
                      onViewGroup({
                        _id: item.groupId,
                        id: item.groupId,
                        name: item.groupName,
                      })
                    }
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all hover:bg-indigo-50 shadow-sm"
                    title="View Details"
                  >
                    <FiChevronRight />
                  </button>
                )}
                {!isSupervisor && (
                  <button
                    onClick={() => handleSendWarning(item.groupId, item.issues)}
                    disabled={status === "loading" || status === "sent"}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      status === "sent"
                        ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        : status === "loading"
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.3)] hover:scale-105 active:scale-95"
                    }`}
                  >
                    {status === "sent" ? (
                      <>
                        <FiCheck /> Sent
                      </>
                    ) : status === "loading" ? (
                      <>Processing</>
                    ) : (
                      <>
                        <FiBell /> Warn
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-card flex flex-col min-h-fit transition-all duration-500">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Escalation Center
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-700">
            Resolving {failing.length + orphans.length + supervisors.length}{" "}
            active system bottleneck(s).
          </p>
        </div>

        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/50">
          {[
            {
              id: "failing",
              label: "Bottlenecks",
              count: failing.length,
              color: "text-rose-600",
            },
            {
              id: "orphans",
              label: "Orphans",
              count: orphans.length,
              color: "text-indigo-600",
            },
            {
              id: "supervisors",
              label: "Stalled",
              count: supervisors.length,
              color: "text-amber-600",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? `bg-white shadow-sm border border-slate-100 ${tab.color}`
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeTab === tab.id ? "bg-slate-100 font-black" : "bg-transparent font-normal"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-50/20">
        {atRiskStatus === "loading" ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white/50 border border-slate-100 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === "failing" &&
              renderGroupList(
                failing,
                "No groups have hit critical failure thresholds.",
              )}
            {activeTab === "orphans" &&
              renderGroupList(
                orphans,
                "Zero orphan groups detected in active cohorts.",
              )}
            {activeTab === "supervisors" &&
              renderGroupList(
                supervisors,
                "All faculty mentors are tracking normal participation.",
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default AtRiskGroupsPanel;
