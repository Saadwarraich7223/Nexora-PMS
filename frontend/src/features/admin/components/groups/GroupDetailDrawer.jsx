import React from "react";
import {
  FiUsers,
  FiLayers,
  FiUser,
  FiCalendar,
  FiEdit3,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiChevronRight,
  FiClock,
  FiActivity,
  FiArrowRight,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { BsAward as GraduationCap } from "react-icons/bs";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";
import HealthForecastingHub from "../analytics/HealthForecastingHub.jsx";
import RubricCoverageDashboard from "../analytics/RubricCoverageDashboard.jsx";

const formatDate = (value) => {
  if (!value) return "?";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "?";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const GroupDetailDrawer = ({
  open,
  onClose,
  group,
  onApprove,
  onReject,
  onActivate,
  onAssign,
  onDelete, 
  actionStatus,
}) => {
  const [activeTab, setActiveTab] = React.useState("identity");
  
  if (!open) return null;

  const members = Array.isArray(group?.members)
    ? group.members
    : Array.isArray(group?.membersList)
      ? group.membersList
      : [];

  const leaderId = group?.leader?._id || group?.leader;
  const supervisorName = group?.supervisor?.name || group?.supervisor;
  const supervisorEmail = group?.supervisor?.email;
  const projectTitle =
    group?.project?.title || group?.project || "Untitled Initiative";
  const projectStatus =
    group?.project?.status || group?.projectStatus || "PENDING";

  const groupStatus = group?.status || "pending";

  const getProjectStatusStyles = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "COMPLETED":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "REJECTED":
        return "bg-rose-50 text-rose-600 border-rose-100";
      default:
        return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  const projectStatusStyles = getProjectStatusStyles(projectStatus);

  return (
    <div className="fixed inset-0 -top-5 z-50 flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4 text-[10px]">
      <div
        className="flex h-full w-full max-w-[430px] flex-col overflow-hidden p-6 border-none shadow-xl bg-white rounded-3xl animate-in slide-in-from-right duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Identity focal point */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-inner">
              <FiUsers size={24} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">
                {group?.name || "Cohort Detail"}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1.5">
                {group?.department} | Semester {group?.semester}
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

        {!group ? (
          <div className="flex-1 space-y-4">
            <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            <LoadingSkeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* High-Fidelity Tab Navigation */}
            <div className="flex items-center gap-1 mb-6 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
               <button 
                 onClick={() => setActiveTab("identity")}
                 className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "identity" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
               >
                 Operational Meta
               </button>
               <button 
                 onClick={() => setActiveTab("strategic")}
                 className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "strategic" ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-400 hover:text-slate-600"}`}
               >
                 <HiSparkles size={12} className={activeTab === "strategic" ? "text-indigo-400" : "opacity-0"} />
                 Strategic Intel
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
              {activeTab === "identity" ? (
                <>
                  {/* Tactical Status Matrix */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">
                        Formation Status
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full anim-pulse-slow ${groupStatus === "active" ? "bg-emerald-500" : "bg-amber-500"}`}
                        ></div>
                        <span
                          className={`text-xs font-black uppercase ${groupStatus === "active" ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          {groupStatus}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium mt-1">
                        Lifecycle Phase
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">
                        Deployment Date
                      </p>
                      <div className="flex items-center gap-2 text-slate-800">
                        <FiClock size={12} className="text-indigo-500" />
                        <span className="text-xs font-black uppercase">
                          {formatDate(group?.createdAt)}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium mt-1">
                        Registry Entry
                      </p>
                    </div>
                  </div>

                  {/* Core intelligence */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiActivity className="text-slate-400" size={12} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Description & Scope
                      </h4>
                    </div>
                    <div className="bg-slate-50/30 p-4 border border-slate-100 rounded-2xl italic">
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                        "
                        {group.description ||
                          "Operational parameters not specified for this cohort."}
                        "
                      </p>
                    </div>
                  </div>

                  {/* Strategic Asset: Project */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiLayers className="text-slate-400" size={12} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Assigned Project
                      </h4>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                          <FiLayers size={18} />
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                            {projectTitle}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                            Active Operation Node
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border shadow-sm ${projectStatusStyles}`}
                      >
                        {projectStatus.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Resource Matrix: Members */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiUsers className="text-slate-400" size={12} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Personnel Matrix
                        </h4>
                      </div>
                      <span className="text-[10px] font-black text-slate-700">
                        {members.length} / {group.maxMembers || 4} Assets
                      </span>
                    </div>
                    <div className="space-y-2">
                      {members.map((m, idx) => {
                        const member = m.user || m;
                        const memberId = member?._id || m._id;
                        const isLeader =
                          leaderId && String(leaderId) === String(memberId);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${isLeader ? "bg-amber-500 border-amber-400 text-white" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                              >
                                <FiUser size={14} />
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-slate-700 leading-tight">
                                  {member?.name || "Student Asset"}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 lowercase tracking-tight">
                                  {member?.email || "No contact verified"}
                                </p>
                              </div>
                            </div>
                            {isLeader && (
                              <span className="bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg border border-amber-100">
                                Leader
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tactical Support: Supervisor */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-slate-400" size={12} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Assigned Support
                      </h4>
                    </div>
                    {supervisorName ? (
                      <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
                            <FiUser size={18} />
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                              {supervisorName}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                              {supervisorEmail}
                            </p>
                          </div>
                        </div>
                        <FiArrowRight
                          size={14}
                          className="text-slate-300 transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          No Support Assigned
                        </p>
                        <button
                          onClick={() => onAssign(group)}
                          className="mt-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                          Assign Supervisor Now
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {/* Health Telemetry Section */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                         <FiActivity className="text-indigo-500" size={14} />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Project Health Telemetry</h4>
                      </div>
                      <HealthForecastingHub groupId={group?._id || group?.id} groupName={group?.name} />
                   </div>

                   {/* Rubric Alignment Section */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                         <GraduationCap className="text-emerald-500" size={14} />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Instructional Rubric Mapping</h4>
                      </div>
                      <RubricCoverageDashboard groupId={group?._id || group?.id} />
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Control Bar */}
        <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
          {group?.status === "pending" && (
            <>
              <button
                onClick={() => onApprove(group)}
                disabled={actionStatus === "loading"}
                className="flex-1 h-11 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-200"
              >
                <FiCheckCircle size={14} /> Approve
              </button>
              <button
                onClick={() => onReject(group)}
                disabled={actionStatus === "loading"}
                className="flex-1 h-11 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <FiXCircle size={14} /> Reject
              </button>
            </>
          )}
          {group?.status === "approved" && (
            <button
              onClick={() => onActivate(group)}
              disabled={actionStatus === "loading"}
              className="w-full h-11 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
            >
              <FiActivity size={14} /> Activate Formation
            </button>
          )}
          {group?.status === "active" && (
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <FiCheckCircle size={14} /> Operational
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailDrawer;
