const DeadlinesHeader = ({ stats, horizon, onHorizonChange, search, onSearchChange }) => {
  return (
    <div className="glass-card student-gradient-hero student-glow rounded-2xl px-5 py-4">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Deadlines</h1>
          <p className="student-text-muted text-sm">
            Track tasks and upcoming milestones for your active project.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-slate-200/50"><p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Total</p><p className="font-semibold text-slate-800 text-lg">{stats.total}</p></div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-slate-200/50"><p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Overdue</p><p className="font-semibold text-rose-700 text-lg">{stats.overdue}</p></div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-slate-200/50"><p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Today</p><p className="font-semibold text-amber-700 text-lg">{stats.today}</p></div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-slate-200/50"><p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Next 7 Days</p><p className="font-semibold text-cyan-700 text-lg">{stats.nextSevenDays}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="student-chip rounded-full px-3 py-1">
          <select
            value={horizon}
            onChange={(e) => onHorizonChange(e.target.value)}
            className="bg-transparent text-[11px] text-slate-700 outline-none"
          >
            <option value="all">All deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="7days">Next 7 days</option>
            <option value="30days">Next 30 days</option>
          </select>
        </div>

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search deadline"
          className="student-form-control rounded-full px-3 py-1 text-[11px] text-slate-700 outline-none"
        />
      </div>
    </div>
  );
};

export default DeadlinesHeader;
