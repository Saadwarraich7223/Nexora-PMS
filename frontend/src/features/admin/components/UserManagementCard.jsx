import { Link } from "react-router-dom";
import { FiEdit2, FiChevronRight, FiUser } from "react-icons/fi";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";

const UserManagementCard = ({
  userFilter,
  setUserFilter,
  tableRows,
  isFacultyLoading,
  viewAllPath,
  onEditUser,
  hideHeader = false,
}) => {
  if (hideHeader) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 bg-white/40 border-b border-slate-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            {[
              { key: "supervisors", label: "Supervisors" },
              { key: "students", label: "Students" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setUserFilter(item.key)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  userFilter === item.key
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-slate-400 border border-slate-200 hover:border-indigo-100 hover:text-indigo-600 shadow-sm"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Directory</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-auto custom-scrollbar">
          {isFacultyLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`skel-${index}`} className="p-4 flex items-center justify-between">
                <LoadingSkeleton className="h-4 w-32" />
                <div className="flex gap-2">
                   <LoadingSkeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            ))
          ) : tableRows.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs text-slate-400 font-medium whitespace-pre">No {userFilter} found in system.</p>
            </div>
          ) : (
            tableRows.map((row) => (
              <div 
                key={`${row.name}-${row.email}`}
                className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-l-2 border-transparent hover:border-indigo-500"
              >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm font-black text-xs ${
                       userFilter === "students" 
                         ? "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white" 
                         : "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                    }`}>
                       {row.name?.charAt(0) || "?"}
                    </div>
                   <div>
                     <h4 className="text-sm font-bold text-slate-800">{row.name}</h4>
                     <p className="text-[10px] text-slate-400 font-medium">{row.email}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-500">
                        {userFilter === "students" ? row.group : `${row.assigned}/${row.capacity} Groups`}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{row.department}</p>
                   </div>
                   <button 
                     onClick={() => onEditUser && onEditUser(row)}
                     className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                   >
                      <FiEdit2 size={10} /> Edit
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
             User Directory
          </h2>
          <p className="text-[10px] font-bold text-slate-500">
            Lifecycle & workload management.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-slate-100 bg-slate-50/50 p-1 rounded-xl">
          {[
            { key: "supervisors", label: "Supervisors" },
            { key: "students", label: "Students" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setUserFilter(item.key)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                userFilter === item.key
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white/50">
        <div className="grid gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid-cols-7 bg-slate-50 border-b border-slate-100">
          <span className="md:col-span-2">Identity</span>
          <span className="md:col-span-2">
            {userFilter === "students" ? "Active Group" : "Load Distribution"}
          </span>
          <span className="md:col-span-2">Departmental Info</span>
          <span className="md:col-span-1 text-right">Controls</span>
        </div>
        <div className="divide-y divide-slate-100">
          {isFacultyLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={`skel-${index}`} className="grid items-center gap-3 px-4 py-4 md:grid-cols-7">
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="h-4 w-28" />
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="h-8 w-16 rounded-lg ml-auto" />
                </div>
              ))
            : tableRows.map((row) => {
                const percent =
                  userFilter === "students" || !row.capacity
                    ? 0
                    : Math.round((row.assigned / row.capacity) * 100);

                return (
                  <div
                    key={`${row.name}-${row.email}`}
                    className="grid items-center gap-3 px-4 py-4 text-sm md:grid-cols-7 hover:bg-slate-50/50 transition-all border-l-2 border-transparent hover:border-indigo-500"
                  >
                    <div className="md:col-span-2 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm font-black text-xs shrink-0 ${
                         userFilter === "students" 
                           ? "bg-indigo-100 text-indigo-600" 
                           : "bg-emerald-100 text-emerald-600"
                      }`}>
                         {row.name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 tracking-tight truncate">{row.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">{row.email}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      {userFilter === "students" ? (
                        <p className="text-[11px] font-bold text-slate-600">{row.group}</p>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between w-full max-w-[120px] mb-1">
                            <span className="text-[10px] font-black text-slate-500">
                              {row.assigned}/{row.capacity}
                            </span>
                            <span className="text-[10px] text-indigo-500 font-black">{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full max-w-[120px] rounded-full bg-slate-100 overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {userFilter === "students"
                        ? `${row.department} | S${row.semester}`
                        : row.department}
                    </div>
                    <div className="md:col-span-1 text-right">
                      <button 
                        onClick={() => onEditUser && onEditUser(row)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          to={viewAllPath}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 group transition-all"
        >
          View Full Directory <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default UserManagementCard;
