import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";

const PreApprovedTablePanel = ({
  search,
  setSearch,
  departmentFilter,
  setDepartmentFilter,
  semesterFilter,
  setSemesterFilter,
  registrationFilter,
  setRegistrationFilter,
  departments,
  rows,
  status,
  onEdit,
  onDelete,
}) => (
  <div className="glass-card px-4 py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Preapproved Students</h2>
        <p className="text-xs text-slate-500">Upload and manage approved student IDs.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search registration"
            className="bg-transparent text-xs text-slate-600 outline-none"
          />
        </div>
        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-600 outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "all" ? "All departments" : dept}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-2">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-600 outline-none"
          >
            <option value="all">All semesters</option>
            <option value="4">Semester 4</option>
            <option value="8">Semester 8</option>
          </select>
        </div>
        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-2">
          <select
            value={registrationFilter}
            onChange={(e) => setRegistrationFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-600 outline-none"
          >
            <option value="all">All status</option>
            <option value="registered">Registered</option>
            <option value="pending">Not registered</option>
          </select>
        </div>
      </div>
    </div>

    <div className="mt-4 overflow-hidden rounded-2xl border border-white/60 bg-white/70">
      <div className="grid gap-3 px-4 py-3 text-xs font-semibold text-slate-500 md:grid-cols-6">
        <span className="md:col-span-2">Registration</span>
        <span className="md:col-span-1">Department</span>
        <span className="md:col-span-1">Semester</span>
        <span className="md:col-span-1">Status</span>
        <span className="md:col-span-1">Actions</span>
      </div>
      <div className="divide-y divide-white/60">
        {status === "loading"
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`preapproved-skeleton-${index}`}
                className="grid items-center gap-3 px-4 py-3 text-sm md:grid-cols-6"
              >
                <LoadingSkeleton className="h-4 w-28" />
                <LoadingSkeleton className="h-4 w-20" />
                <LoadingSkeleton className="h-4 w-16" />
                <LoadingSkeleton className="h-6 w-16 rounded-full" />
                <LoadingSkeleton className="h-6 w-16 rounded-full" />
              </div>
            ))
          : rows.length > 0
            ? rows.map((row) => (
                <div
                  key={row._id}
                  className="grid items-center gap-3 px-4 py-3 text-sm md:grid-cols-6"
                >
                  <div className="md:col-span-2">
                    <p className="font-semibold text-slate-800">{row.registrationNumber}</p>
                    <p className="text-[11px] text-slate-500">{row.createdAtLabel}</p>
                  </div>
                  <div className="md:col-span-1 text-slate-500">{row.department}</div>
                  <div className="md:col-span-1 text-slate-500">{row.semester}</div>
                  <div className="md:col-span-1">
                    <span
                      className={`status-pill ${
                        row.isRegistered
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.isRegistered ? "Registered" : "Pending"}
                    </span>
                  </div>
                  <div className="md:col-span-1 flex items-center gap-2">
                    <button
                      onClick={() => onEdit(row)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(row)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No preapproved students found</p>
                <p className="mt-1 text-xs text-slate-500">Adjust filters or upload a CSV file.</p>
              </div>
            )}
      </div>
    </div>
  </div>
);

export default PreApprovedTablePanel;
