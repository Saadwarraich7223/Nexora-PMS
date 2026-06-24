import { FiRefreshCw } from "react-icons/fi";

const StudentOverviewHeader = ({ name, onRefresh }) => (
  <div className=" flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
        Welcome back,{" "}
        <span className="text-indigo-600">
          {name?.split(" ")[0] || "Scholar"}
        </span>
      </h1>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
        Academic Registry & Project Portfolio Dashboard
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-indigo-100 group transition-all"
      >
        <FiRefreshCw
          size={12}
          className="text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500"
        />
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
          Protocol Sync
        </span>
      </button>
    </div>
  </div>
);

export default StudentOverviewHeader;
