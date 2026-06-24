import React from 'react';
import { FiTarget, FiZap, FiPlus, FiAlertCircle } from "react-icons/fi";

const StudentTasksHeader = ({
  group,
  isLeader,
  stats,
  onCreateTaskClick,
  onPrioritizeClick,
  isPrioritizing
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-xl px-4 py-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-50 shrink-0">
            <FiTarget size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                Task_Command_v4.0
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Protocol_Active
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-600 to-indigo-400 animate-in fade-in duration-1000">
              Operations Command Center
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2">
              Strategic Mission Dispatch
              <span className="h-1 w-1 rounded-full bg-slate-200"></span>
              <span className="text-slate-500">{group?.name || "Initializing..."}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPrioritizeClick}
            disabled={!group || isPrioritizing}
            className="h-10 px-4 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs hover:shadow-md active:scale-95 group/btn"
          >
            <FiZap className={`transition-colors ${isPrioritizing ? 'text-indigo-500 animate-pulse' : 'text-slate-400 group-hover/btn:text-indigo-500'}`} size={14} />
            {isPrioritizing ? "Analyzing Strategy..." : "AI Prioritization"}
          </button>
          
          <button
            onClick={onCreateTaskClick}
            disabled={!group || !isLeader}
            className="h-10 px-6 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiPlus size={14} />
            Initialize Task
          </button>
        </div>
      </div>

      {!group && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-100">
          <FiAlertCircle className="text-rose-500" size={14} />
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
            Identity Unverified: Join or create a group to activate the Operations Center.
          </p>
        </div>
      )}
      
      {group && !isLeader && (
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Restricted Access: Non-leader accounts are limited to status updates and personal load management.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTasksHeader;
