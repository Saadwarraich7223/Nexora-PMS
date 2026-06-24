import React, { useState, useEffect } from "react";
import { FiXCircle, FiSave, FiTrash2, FiHash, FiGrid, FiLayers, FiAlertCircle, FiUser } from "react-icons/fi";

const PreApprovedEditDrawer = ({ open, onClose, item, onSave, onDelete, actionStatus }) => {
  const [formData, setFormData] = useState({
    registrationNumber: "",
    department: "",
    semester: "",
    isRegistered: false,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        registrationNumber: item.registrationNumber || "",
        department: item.department || "",
        semester: String(item.semester || ""),
        isRegistered: item.isRegistered || false,
      });
    }
  }, [item]);

  if (!open) return null;

  const handleSave = () => onSave(formData);

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4 text-[10px]">
      <div 
        className="glass-card flex h-full w-full max-md flex-col overflow-hidden p-6 border-none shadow-xl bg-white animate-in slide-in-from-right duration-500 max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Identity focal point */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-inner">
                <FiUser size={24} />
             </div>
             <div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">Edit Student Record</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">
                   Pre-Approved Resource | {formData.department || "Division"}
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

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
          {/* Subtle Warning */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-3">
             <FiAlertCircle className="text-slate-400 mt-0.5 shrink-0" size={14} />
             <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                Editing the registration number will affect how the system verifies this student during account creation.
             </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1 flex items-center gap-2">
                  <FiHash size={10} /> Registration Number
               </label>
               <input
                 value={formData.registrationNumber}
                 onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                 className="w-full bg-white border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none rounded-xl focus:border-indigo-400 transition-all"
                 placeholder="e.g. 21-CS-123"
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1 flex items-center gap-2">
                  <FiGrid size={10} /> Department
               </label>
               <input
                 value={formData.department}
                 onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                 className="w-full bg-white border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none rounded-xl focus:border-indigo-400 transition-all"
                 placeholder="e.g. Computer Science"
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1 flex items-center gap-2">
                  <FiLayers size={10} /> Academic Year / Semester
               </label>
               <select
                 value={formData.semester}
                 onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                 className="w-full bg-white border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none rounded-xl focus:border-indigo-400 transition-all cursor-pointer"
               >
                 <option value="4">Semester 04</option>
                 <option value="8">Semester 08</option>
               </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
               <input
                 type="checkbox"
                 id="isRegistered"
                 checked={formData.isRegistered}
                 onChange={(e) => setFormData({ ...formData, isRegistered: e.target.checked })}
                 className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
               />
               <label htmlFor="isRegistered" className="text-[10px] font-bold text-slate-600 uppercase tracking-tight cursor-pointer select-none">
                  Mark as Verified Profile
               </label>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
           <button
             onClick={handleSave}
             disabled={actionStatus === "loading"}
             className="w-full h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md shadow-slate-200 flex items-center justify-center gap-2"
           >
              {actionStatus === "loading" ? (
                <FiRefreshCw className="animate-spin" size={12} />
              ) : (
                <FiSave size={12} />
              )}
              {actionStatus === "loading" ? "Updating..." : "Save Record Changes"}
           </button>
           <button
             onClick={() => onDelete(item)}
             disabled={actionStatus === "loading"}
             className="w-full h-10 rounded-xl bg-white border border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
           >
              <FiTrash2 size={12} /> Delete Record
           </button>
        </div>
      </div>
    </div>
  );
};

export default PreApprovedEditDrawer;
