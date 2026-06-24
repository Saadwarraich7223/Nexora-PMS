import React from "react";
import { FiSearch, FiEye, FiEdit3, FiTrash2, FiUsers, FiFilter } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const StudentsTablePanel = ({
  statusTab,
  setStatusTab,
  search,
  setSearch,
  departmentFilter,
  setDepartmentFilter,
  semesterFilter,
  setSemesterFilter,
  departments,
  rows,
  status,
  onView,
  onEdit,
  onDelete,
}) => (
  <div className="glass-card flex flex-col overflow-hidden">
    {/* Hub Header: Search & Navigation */}
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/30">
      <div className="flex items-center gap-2">
         <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-sm">
            <FiUsers size={16} />
         </div>
         <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Student Matrix</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Unified Personnel Pool</p>
         </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
         <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl mr-2">
           {[
             { key: "all", label: "All" },
             { key: "active", label: "Active" },
             { key: "preapproved", label: "Pre-Approved" },
           ].map((item) => (
             <button
               key={item.key}
               onClick={() => setStatusTab(item.key)}
               className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-lg ${
                 statusTab === item.key
                   ? "bg-slate-900 text-white shadow-sm"
                   : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
               }`}
             >
               {item.label}
             </button>
           ))}
         </div>

         <div className="relative group">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-48 pl-4 pr-4 py-2 bg-white/70 border border-slate-200 text-xs text-slate-600 outline-none rounded-xl focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
            />
         </div>
         <select
           value={departmentFilter}
           onChange={(e) => setDepartmentFilter(e.target.value)}
           className="px-3 py-2 bg-white/70 border border-slate-200 text-xs text-slate-600 outline-none rounded-xl focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
         >
           {departments.map((dept) => (
             <option key={dept} value={dept}>
               {dept === "all" ? "All Departments" : dept}
             </option>
           ))}
         </select>
         <select
           value={semesterFilter}
           onChange={(e) => setSemesterFilter(e.target.value)}
           className="px-3 py-2 bg-white/70 border border-slate-200 text-xs text-slate-600 outline-none rounded-xl focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
         >
            <option value="all">All Semesters</option>
            <option value="4">Semester 04</option>
            <option value="8">Semester 08</option>
         </select>
      </div>
    </div>

    {/* Table Headers */}
    <div className="grid gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid-cols-12">
      <span className="md:col-span-3">Student Identity</span>
      <span className="md:col-span-2">Department</span>
      <span className="md:col-span-1 text-center">Semester</span>
      <span className="md:col-span-2">Status</span>
      <span className="md:col-span-2">Group Status</span>
      <span className="md:col-span-2 text-right">Controls</span>
    </div>

    {/* Table Content */}
    <div className="divide-y divide-slate-100 flex-1 overflow-auto custom-scrollbar">
      {status === "loading"
        ? Array.from({ length: 5 }).map((_, index) => (
            <div key={`loading-${index}`} className="grid items-center gap-4 px-6 py-4 md:grid-cols-12">
               <div className="md:col-span-3 flex items-center gap-3">
                  <LoadingSkeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1">
                     <LoadingSkeleton className="h-4 w-32" />
                     <LoadingSkeleton className="h-3 w-24" />
                  </div>
               </div>
               <div className="md:col-span-2"><LoadingSkeleton className="h-4 w-20" /></div>
               <div className="md:col-span-1"><LoadingSkeleton className="h-4 w-10 ml-auto mr-auto" /></div>
               <div className="md:col-span-2"><LoadingSkeleton className="h-6 w-24 rounded-full" /></div>
               <div className="md:col-span-2"><LoadingSkeleton className="h-4 w-28" /></div>
               <div className="md:col-span-2 flex justify-end"><LoadingSkeleton className="h-8 w-16" /></div>
            </div>
          ))
        : rows.length > 0
          ? rows.map((row) => (
              <div
                key={row._id}
                className="grid items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 md:grid-cols-12 group"
              >
                <div className="md:col-span-3 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all ${row.source === 'active' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <FiUsers size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-none mb-1">{row.name || row.registrationNumber}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] lowercase">{row.email || "Pending verification"}</p>
                  </div>
                </div>

                <div className="md:col-span-2 text-[10px] font-bold text-slate-500 uppercase">
                  {row.department}
                </div>

                <div className="md:col-span-1 text-[10px] font-bold text-slate-500 uppercase text-center">
                  S-{row.semester}
                </div>

                <div className="md:col-span-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                    row.source === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {row.source === 'active' ? 'Verified' : 'Pre-Approved'}
                  </span>
                </div>

                <div className="md:col-span-2">
                  {row.source === "active" ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-700 truncate max-w-[130px]">{row.activeGroup?.name || "Unassigned"}</span>
                      {row.activeGroup?.status && (
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{row.activeGroup.status}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">Awaiting Reg</span>
                  )}
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  {row.source === "active" ? (
                    <button
                      onClick={() => onView(row)}
                      className="h-8 px-4 font-black text-[9px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      Details
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onEdit(row)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                      >
                        <FiEdit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(row)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          : (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-4">
                 <FiUsers size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700">No student records matching filters</p>
              <p className="text-xs text-slate-400 mt-1">Refine your search or upload a new cohort.</p>
            </div>
          )}
    </div>
  </div>
);

export default StudentsTablePanel;
