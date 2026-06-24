import { FiFolder, FiTarget, FiActivity } from "react-icons/fi";

const projectStatusClass = (status) => {
  const key = String(status || "none").toLowerCase();
  if (["approved", "in_progress", "completed"].includes(key)) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (["submitted", "under_review", "pending"].includes(key)) return "bg-amber-50 text-amber-600 border-amber-100";
  if (key === "rejected") return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
};

const ProjectStatusPanel = ({ project }) => {
  const status = project?.status || "none";

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl h-full hover:shadow-md transition-all group">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiTarget className="text-indigo-600" />
          <h2>Project Core Pulse</h2>
        </div>
        <span
          className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${projectStatusClass(status)}`}
        >
          {status === "none" ? "NO DISCOVERY" : status.replace("_", " ")}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <FiFolder className="text-indigo-500" size={12} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Proposal</p>
          </div>
          <p className="text-sm font-black text-slate-800 tracking-tight leading-snug">
            {project?.title || "Establish technical discovery proposal"}
          </p>
        </div>

        <div className="px-2">
           <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight line-clamp-3">
            {project?.description
              ? project.description
              : "Project documentation and roadmap will appear here once the proposal is initiated."}
          </p>
          <div className="mt-3 flex items-center gap-2 text-emerald-500">
             <FiActivity size={10} className="animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-widest">Sync Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusPanel;
