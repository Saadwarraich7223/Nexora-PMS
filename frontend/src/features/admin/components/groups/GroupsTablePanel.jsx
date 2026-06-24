import { FiUsers, FiSearch, FiFilter } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const GroupsTablePanel = ({
  statusTab,
  setStatusTab,
  search,
  setSearch,
  departmentFilter,
  setDepartmentFilter,
  departments,
  rows,
  groupsStatus,
  onView,
}) => (
  <div className="glass-card flex flex-col overflow-hidden">
    {/* Hub Header: Search & Navigation */}
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/30">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/50">
        {[
          { key: "pending", label: "Pending" },
          { key: "active", label: "Active" },
          { key: "all", label: "All" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusTab(item.key)}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${
              statusTab === item.key
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative group">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cohorts..."
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
      </div>
    </div>

    {/* Table Headers */}
    <div className="grid gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid-cols-7">
      <span className="md:col-span-2">Group Identity</span>
      <span className="md:col-span-2 text-center md:text-left">
        Formation Progress
      </span>
      <span className="md:col-span-1">Metadata</span>
      <span className="md:col-span-1">Assigned Support</span>
      <span className="md:col-span-1 text-right">Control</span>
    </div>

    {/* Table Content */}
    <div className="divide-y divide-slate-100 flex-1 overflow-auto custom-scrollbar">
      {groupsStatus === "loading" ? (
        Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`group-skeleton-${index}`}
            className="grid items-center gap-4 px-6 py-4 text-sm md:grid-cols-7"
          >
            <LoadingSkeleton className="h-4 w-32 rounded-md" />
            <div className="md:col-span-2">
              <LoadingSkeleton className="h-4 w-40 rounded-md" />
              <LoadingSkeleton className="mt-1 h-1 w-24 rounded-full" />
            </div>
            <LoadingSkeleton className="h-4 w-20 rounded-md" />
            <LoadingSkeleton className="h-4 w-20 rounded-md" />
            <div className="text-right">
              <LoadingSkeleton className="h-8 w-16 rounded-lg ml-auto" />
            </div>
          </div>
        ))
      ) : rows.length > 0 ? (
        rows.map((row) => (
          <div
            key={row.id}
            className="grid items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 md:grid-cols-7"
          >
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-slate-800">{row.name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                DEP: {row.department}
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5 w-full max-w-[160px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  {row.members} / {row.capacity} Members
                </span>
                <span className="text-[9px] font-black text-indigo-500 uppercase">
                  {Math.max(row.capacity - row.members, 0)} Seats
                </span>
              </div>
              <div className="h-1.5 w-full max-w-[160px] bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${row.capacity ? Math.min(Math.round((row.members / row.capacity) * 100), 100) : 0}%`,
                    backgroundColor: "var(--bar-group)",
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                SEM {row.semester}
              </p>
              <div className="mt-1 flex flex-col items-start gap-1">
                <span
                  className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    row.status === "active"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : row.status === "pending"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {row.status}
                </span>
                {row.status === "pending" && (
                  <span className="inline-flex px-1 py-0.5 rounded-[4px] bg-amber-500 text-white text-[7px] font-black uppercase tracking-tighter shadow-sm shadow-amber-100">
                    Needed Attention
                  </span>
                )}
              </div>
            </div>

            <div className="md:col-span-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase truncate">
                {row.supervisor || "---"}
              </p>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
                Supervisor
              </p>
            </div>

            <div className="md:col-span-1 text-right">
              <button
                onClick={() => onView(row)}
                className="h-8 px-4 font-black text-[9px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all active:scale-95"
              >
                Details
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="px-6 py-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-4">
            <FiUsers size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">No cohorts found</p>
          <p className="text-xs text-slate-400 mt-1">
            Refine your search or filter parameters.
          </p>
        </div>
      )}
    </div>
  </div>
);

export default GroupsTablePanel;
