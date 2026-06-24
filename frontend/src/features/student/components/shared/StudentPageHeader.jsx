import React from "react";
import { FiLock } from "react-icons/fi";

const StudentPageHeader = ({
  protocolName,
  title,
  subtitle,
  groupName,
  rightSide,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="space-y-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            {protocolName || "PROTOCOL_UNDEFINED"}
          </span>
          <div className="h-1 w-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Protocol_Active
          </div>
        </div>
        <h1
          className="text-3xl font-black py-1 tracking-tight leading-none 
bg-clip-text text-transparent 
bg-gradient-to-r from-slate-900 via-indigo-500 to-violet-400
drop-shadow-[0_2px_8px_rgba(99,102,241,0.25)]
animate-in fade-in duration-1000"
        >
          {title}
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2">
          {subtitle}
          <span className="h-1 w-1 rounded-full bg-slate-200"></span>
          <span className="text-slate-500">
            {groupName || "Initializing..."}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {rightSide ? (
          rightSide
        ) : (
          <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
            <FiLock className="text-slate-400" size={14} />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Official_Protocol
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPageHeader;
