import React from "react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { FiChevronUp, FiChevronDown, FiFileText, FiUsers } from "react-icons/fi";

const ProjectOverviewTab = ({ 
  project, 
  isProposalTextOpen, 
  setIsProposalTextOpen, 
  handlePreviewProjectFile 
}) => {
  const grp = project.group;
  const members = Array.isArray(grp?.members) ? grp.members : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Description Section */}
      <div className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl p-5 overflow-hidden group">
        <button 
          onClick={() => setIsProposalTextOpen(!isProposalTextOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-900 border border-slate-100 rounded-xl outline-none group/btn transition-all shadow-sm"
        >
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-white border border-slate-100 rounded-lg group-hover/btn:bg-slate-800 transition-colors">
                <FiFileText className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-indigo-400" />
             </div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover/btn:text-white transition-colors">Strategic Abstract</span>
          </div>
          {isProposalTextOpen ? <FiChevronUp className="text-slate-400 group-hover/btn:text-white" /> : <FiChevronDown className="text-slate-400 group-hover/btn:text-white" />}
        </button>

        {isProposalTextOpen && (
          <div data-color-mode="light" className="mt-4 p-5 bg-slate-50/50 border border-slate-100 rounded-2xl max-h-[400px] overflow-y-auto animate-in slide-in-from-top-2 duration-300">
            <MDEditor.Markdown 
              source={project.description || "NO_DESCRIPTION_SYNCHRONIZED"} 
              rehypePlugins={[[rehypeSanitize]]} 
              style={{ background: 'transparent', fontSize: '13px', color: '#334155', fontWeight: '500', lineHeight: '1.6' }} 
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-6 px-1">
          {[
            { label: "Grouping", value: grp?.name },
            { label: "Division", value: grp?.department },
            { label: "Cycle", value: grp?.semester }
          ].map((meta, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{meta.label}</span>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{meta.value || "N/A"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <div className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiUsers size={60} />
           </div>
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                <FiUsers className="w-4 h-4 text-indigo-500" />
             </div>
             <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">Assignment Roster</h3>
          </div>
          
          {members.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NO_MEMBER_DATA_INDEXED</p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {members.map((m, i) => {
                const userData = m?.user || m;
                const name = userData?.name || userData?.email || `OPERATIVE_${i + 1}`;
                const isLeader = String(userData?._id || userData) === String(grp?.leader?._id || grp?.leader);
                return (
                  <div key={userData?._id || i} className="flex items-center justify-between rounded-xl bg-white border border-slate-100 px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition-all group/member">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0 group-hover/member:bg-indigo-500 group-hover/member:text-white transition-colors">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate block">{name}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                           {userData?.rollNo || "REDACTED"}
                        </span>
                      </div>
                    </div>
                    {isLeader && (
                      <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg uppercase tracking-[0.2em]">Leader</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className="glass-card bg-white border border-slate-200/50 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiFileText size={60} />
           </div>
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                <FiFileText className="w-4 h-4 text-emerald-500" />
             </div>
             <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">Intelligence Assets</h3>
          </div>
          
          {project.files && project.files.length > 0 ? (
            <div className="grid gap-2.5">
              {project.files.map((f, idx) => (
                <button
                  key={f._id || idx}
                  onClick={() => handlePreviewProjectFile(f)}
                  className="flex items-center justify-between w-full p-3.5 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/20 transition-all text-left shadow-sm group/file"
                >
                   <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-400 group-hover/file:bg-emerald-500 group-hover/file:text-white transition-colors">
                         <FiFileText size={16} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">{f.originalName || "ASSET_NODE"}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-60">SYSTEM_FILE_NODE</p>
                      </div>
                   </div>
                   <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 group-hover/file:bg-emerald-100 group-hover/file:text-emerald-600 transition-colors">
                      <FiChevronDown className="-rotate-90" size={12} />
                   </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NO_ASSETS_DETECTED</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverviewTab;
