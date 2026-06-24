import { FiPlusCircle, FiLayers, FiCalendar, FiBriefcase } from "react-icons/fi";
import { useState } from "react";

const CreateGroupPanel = ({ loading, onCreate }) => {
  const [form, setForm] = useState({ name: "", department: "", semester: "" });

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-xs rounded-xl h-full transition-all group/panel">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiPlusCircle className="text-indigo-600" size={12} />
          <h2>Initiation Protocol</h2>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">
        <div className="flex-1 space-y-3">
          <div className="relative group/field">
            <FiLayers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-indigo-500 transition-colors" size={14} />
            <input
              type="text"
              placeholder="SQUAD IDENTIFIER"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-100 placeholder:text-slate-300 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-200 focus:shadow-sm transition-all"
            />
          </div>

          <div className="relative group/field">
            <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-indigo-500 transition-colors" size={14} />
            <input
              type="text"
              placeholder="DEPARTMENT UNIT"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-100 placeholder:text-slate-300 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-200 focus:shadow-sm transition-all"
            />
          </div>

          <div className="relative group/field">
            <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-indigo-500 transition-colors" size={14} />
            <input
              type="number"
              placeholder="ACADEMIC SEMESTER"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-100 placeholder:text-slate-300 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-200 focus:shadow-sm transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => onCreate(form)}
          disabled={loading || !form.name || !form.department}
          className="w-full h-11 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Initialize Workspace
        </button>
      </div>
    </div>
  );
};

export default CreateGroupPanel;
