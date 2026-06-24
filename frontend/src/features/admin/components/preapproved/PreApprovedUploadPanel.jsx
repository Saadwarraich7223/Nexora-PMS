import React from "react";
import { FiUploadCloud, FiFileText, FiRefreshCw, FiInfo, FiCheckCircle } from "react-icons/fi";

const PreApprovedUploadPanel = ({
  file,
  setFile,
  onUpload,
  onReset,
  actionStatus,
  previewRows,
  previewLabel,
}) => (
  <div className="glass-card overflow-hidden border-none shadow-xl bg-white/70 backdrop-blur-md rounded-3xl p-6">
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Template Preview Section */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2">
           <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
              <FiFileText size={14} />
           </div>
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
             {previewRows?.length ? previewLabel || "Records Preview" : "CSV Structure"}
           </h3>
        </div>
        
        {previewRows?.length ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            <div className="rounded-xl bg-slate-900 px-4 py-3 text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] border border-slate-800 shadow-lg shadow-indigo-900/10">
              reg_no, dept, semester
            </div>
            {previewRows.map((row, index) => (
              <div
                key={`${row.registrationNumber}-${index}`}
                className="flex items-center justify-between rounded-xl border border-white bg-white px-4 py-3 shadow-sm group hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[11px] font-bold text-slate-700">{row.registrationNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase">
                   <span className="text-slate-400 tracking-tighter">{row.department}</span>
                   <span className="text-indigo-500">SEM-{row.semester}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FiInfo size={12} className="text-indigo-400" /> Template Requirements
               </p>
               <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                 Upload a CSV with exactly these three columns:
               </p>
               <code className="block w-full p-3 bg-slate-900 rounded-xl text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-2 border border-slate-800">
                 registrationNumber, department, semester
               </code>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semesters</span>
                  <span className="text-[10px] font-black text-slate-700 uppercase">4 or 8</span>
               </div>
               <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validation</span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Auto-Check</span>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Action Section */}
      <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-6 transition-all hover:bg-slate-50">
        <div className="h-20 w-20 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all duration-500">
           <FiUploadCloud size={32} />
        </div>
        
        <div className="space-y-1">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bulk Student Upload</h2>
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Add multiple student records at once.</p>
        </div>

        <div className="w-full space-y-4">
          <label className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[180px]">
                 {file?.name || "Select CSV file"}
              </span>
              <span className="h-8 px-4 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                Browse
              </span>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onUpload}
              disabled={!file || actionStatus === "loading"}
              className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              {actionStatus === "loading" ? (
                 <FiRefreshCw className="animate-spin" size={14} />
              ) : (
                 <FiCheckCircle size={14} />
              )}
              {actionStatus === "loading" ? "Uploading..." : "Import Students"}
            </button>
            <button
              onClick={onReset}
              disabled={actionStatus === "loading"}
              className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center"
              title="Reset Form"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PreApprovedUploadPanel;
