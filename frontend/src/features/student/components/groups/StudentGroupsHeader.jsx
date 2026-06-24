import { FiUsers, FiMail, FiSend, FiGlobe } from "react-icons/fi";

const StudentGroupsHeader = ({ stats }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
        Team <span className="text-indigo-600">Synergy Center</span>
      </h1>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
        Collaborative Workspace & Governance Hub
      </p>
    </div>

    <div className="grid grid-cols-3 gap-2">
      <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm flex flex-col items-center min-w-[70px]">
        <FiMail className="text-indigo-500 mb-1" size={12} />
        <p className="text-[14px] font-black text-slate-800 leading-none">{stats.invites}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Invites</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm flex flex-col items-center min-w-[70px]">
        <FiSend className="text-amber-500 mb-1" size={12} />
        <p className="text-[14px] font-black text-slate-800 leading-none">{stats.requests}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Requests</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm flex flex-col items-center min-w-[70px]">
        <FiGlobe className="text-sky-500 mb-1" size={12} />
        <p className="text-[14px] font-black text-slate-800 leading-none">{stats.groups}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Groups</p>
      </div>
    </div>
  </div>
);

export default StudentGroupsHeader;
