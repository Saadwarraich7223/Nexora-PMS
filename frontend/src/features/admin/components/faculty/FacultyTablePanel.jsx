import { FiUsers } from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const FacultyTablePanel = ({
  search,
  setSearch,
  departmentFilter,
  setDepartmentFilter,
  availabilityFilter,
  setAvailabilityFilter,
  departments,
  rows,
  facultyStatus,
  statusPill,
  onView,
}) => (
  <div className="glass-card flex flex-col overflow-hidden">
    {/* Hub Header: Search & Navigation */}
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/30">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-sm">
          <FiUsers size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            Resource Matrix
          </h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            Unified Faculty Pool
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative group">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty..."
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
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          className="px-3 py-2 bg-white/70 border border-slate-200 text-xs text-slate-600 outline-none rounded-xl focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
        >
          <option value="all">All Availability</option>
          <option value="available">Available</option>
          <option value="at-capacity">At Capacity</option>
          <option value="no-capacity">No Capacity</option>
        </select>
      </div>
    </div>

    {/* Table Headers */}
    <div className="grid gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid-cols-7">
      <span className="md:col-span-2">Faculty Identity</span>
      <span className="md:col-span-2 text-center md:text-left">
        Workload / Capacity
      </span>
      <span className="md:col-span-1">Department</span>
      <span className="md:col-span-1">Status</span>
      <span className="md:col-span-1 text-right">Control</span>
    </div>

    {/* Table Content */}
    <div className="divide-y divide-slate-100 flex-1 overflow-auto custom-scrollbar">
      {facultyStatus === "loading" ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`faculty-skeleton-${index}`}
            className="grid items-center gap-4 px-6 py-4 text-sm md:grid-cols-7"
          >
            <LoadingSkeleton className="h-4 w-32 rounded-md" />
            <div className="md:col-span-2">
              <LoadingSkeleton className="h-4 w-40 rounded-md" />
              <LoadingSkeleton className="mt-1 h-1 w-24 rounded-full" />
            </div>
            <LoadingSkeleton className="h-4 w-20 rounded-md" />
            <LoadingSkeleton className="h-6 w-20 rounded-full" />
            <div className="text-right">
              <LoadingSkeleton className="h-8 w-16 rounded-lg ml-auto" />
            </div>
          </div>
        ))
      ) : rows.length > 0 ? (
        rows.map((row) => (
          <div
            key={row._id}
            className="grid group items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 md:grid-cols-7"
          >
            <div className="md:col-span-2 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs shadow-sm shrink-0 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                {row.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {row.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {row.email}
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5 w-full max-w-[160px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  {row.assigned} / {row.capacity} Groups
                </span>
                <span className="text-[9px] font-black text-indigo-500 uppercase">
                  {row.availability} Left
                </span>
              </div>
              <div className="h-1.5 w-full max-w-[160px] bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${row.capacity ? Math.min(Math.round((row.assigned / row.capacity) * 100), 100) : 0}%`,
                    backgroundColor:
                      row.status === "at-capacity"
                        ? "var(--bar-supervisor)"
                        : "var(--bar-group)",
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-1 text-[10px] font-bold text-slate-500 uppercase">
              {row.department || "N/A"}
            </div>

            <div className="md:col-span-1">
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                  row.status === "available"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : row.status === "at-capacity"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {row.status.replace("-", " ")}
              </span>
            </div>

            <div className="md:col-span-1 text-right">
              <button
                onClick={() => onView(row._id)}
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
          <p className="text-sm font-bold text-slate-700">
            No faculty members found
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Refine your strategic filters or search query.
          </p>
        </div>
      )}
    </div>
  </div>
);

export default FacultyTablePanel;
