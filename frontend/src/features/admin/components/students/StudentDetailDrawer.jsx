import React from "react";
import { FiUser, FiMail, FiHash, FiGrid, FiLayers, FiActivity, FiXCircle, FiUsers, FiChevronRight } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const StudentDetailDrawer = ({ open, onClose, detail, status }) => {
  if (!open) return null;

  const group = detail?.activeGroup;
  const project = group?.project;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4 text-[10px]">
      <div 
        className="glass-card flex h-full w-full max-w-md flex-col overflow-hidden p-6 border-none shadow-xl bg-white animate-in slide-in-from-right duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Identity focal point */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-inner">
                <FiUser size={24} />
             </div>
             <div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">{detail?.name || "Student Profile"}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">
                   University Student | {detail?.department || "Department"}
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

        {status === "loading" ? (
          <div className="flex-1 space-y-4">
            <LoadingSkeleton className="h-20 w-full rounded-xl" />
            <LoadingSkeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border-dashed border-slate-200">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No detailed record found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
            
            {/* Identity Details Card */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">Registration ID</p>
                  <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                     <FiHash size={12} className="text-slate-400" />
                     {detail.registrationNumber || "N/A"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Primary Key</p>
               </div>
               <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">Communication</p>
                  <p className="text-xs font-black text-slate-800 truncate">{detail.email || "No Email"}</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Official Mail</p>
               </div>
            </div>

            {/* Academic Matrix Section */}
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <FiGrid className="text-slate-400" size={12} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Context</h4>
               </div>
               <div className="glass-card bg-slate-50/30 p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-slate-700">{detail.department}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Phase: Semester {detail.semester}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-black uppercase text-slate-400">Verified</span>
               </div>
            </div>

            {/* Group Assignment Section */}
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <FiUsers className="text-slate-400" size={12} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cohort Assignment</h4>
               </div>
               {group ? (
                 <div className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                          <FiUsers size={18} />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-slate-700">{group.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Status: {group.status || "Active"}</p>
                       </div>
                    </div>
                    <FiChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                 </div>
               ) : (
                 <div className="p-8 text-center bg-slate-50 rounded-2xl border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Group</p>
                 </div>
               )}
            </div>

            {/* Project Operation Section */}
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <FiActivity className="text-slate-400" size={12} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Operation</h4>
               </div>
               {project ? (
                 <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-[11px] font-black text-white">{project.title}</p>
                       <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/10">
                         {project.status || "Active"}
                       </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed border-t border-white/5 pt-2">
                       {project.description?.substring(0, 120)}...
                    </p>
                 </div>
               ) : (
                 <div className="p-8 text-center bg-slate-50 rounded-2xl border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Project</p>
                 </div>
               )}
            </div>

          </div>
        )}

        {/* Global Control Bar */}
        <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
           <button
             onClick={onClose}
             className="w-full h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md shadow-slate-200"
           >
             Close Record
           </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailDrawer;
