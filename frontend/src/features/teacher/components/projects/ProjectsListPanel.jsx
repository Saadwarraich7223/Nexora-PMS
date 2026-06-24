import React, { useState, useMemo } from "react";
import { FiSearch, FiFilter, FiActivity } from "react-icons/fi";

const ProjectsListPanel = ({
  projects,
  selectedProjectId,
  onSelect,
  statusChipClass,
  formatDate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const filteredProjects = useMemo(() => {
    let result = [...projects].filter((p) => {
      const search = searchTerm.toLowerCase();
      return (
        p.title?.toLowerCase().includes(search) ||
        p.group?.name?.toLowerCase().includes(search)
      );
    });

    result.sort((a, b) => {
      if (sortBy === "alpha") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "health") return (b.healthReport?.score || 0) - (a.healthReport?.score || 0);
      if (sortBy === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

    return result;
  }, [projects, searchTerm, sortBy]);

  return (
    <div className="glass-card bg-white/95 border border-slate-200/50 shadow-sm rounded-2xl p-5 h-fit">
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Project Registry</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{filteredProjects.length} Managed Cohorts</p>
        </div>
        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-sm shadow-indigo-200" />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative group">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={13} />
          <input
            type="text"
            placeholder="SEARCH REGISTRY..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50/50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-9 px-3 bg-white border border-slate-100 rounded-lg shadow-sm">
            <FiFilter className="text-slate-400" size={11} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent text-[8px] font-black text-slate-500 outline-none uppercase tracking-widest cursor-pointer"
            >
              <option value="recent">Recently Registered</option>
              <option value="alpha">Alphabetical Order</option>
              <option value="health">Intelligence Health</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 max-h-[520px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {filteredProjects.map((project) => {
          const active = String(project._id) === String(selectedProjectId);
          return (
            <button
              key={project._id}
              onClick={() => onSelect(String(project._id))}
              className={`w-full group rounded-xl border p-4 text-left transition-all duration-200 relative overflow-hidden ${
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                  : "border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:shadow-md hover:bg-slate-50/30"
              }`}
            >
              {active && (
                <div className="absolute top-0 right-0 p-2 opacity-10">
                   <FiActivity size={40} />
                </div>
              )}
              
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className={`text-[11px] font-black uppercase tracking-tight truncate ${active ? "text-white" : "text-slate-800"}`}>
                    {project.title || "Untitled Intelligence Node"}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                      active
                        ? "border-white/20 bg-white/10 text-white"
                        : statusChipClass(project.status)
                    }`}
                  >
                    {String(project.status || "n/a").replace("_", " ")}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <p className={`truncate text-[9px] font-bold uppercase tracking-widest ${active ? "text-slate-400" : "text-slate-400"}`}>
                    {project.group?.name || "Unknown Strategic Unit"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-[8px] font-black uppercase tracking-widest ${active ? "text-slate-500" : "text-slate-300"}`}>
                      RECOVERED {formatDate(project.createdAt)}
                    </p>
                    {project.healthReport?.score && (
                       <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${project.healthReport.score >= 70 ? "bg-emerald-500" : "bg-amber-500"}`} />
                          <span className={`text-[8px] font-black ${active ? "text-slate-400" : "text-slate-500"}`}>
                             {project.healthReport.score}%
                          </span>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
             <FiActivity className="mx-auto text-slate-300 mb-2" size={20} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching nodes recovered.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsListPanel;
