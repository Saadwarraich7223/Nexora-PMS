const MeetingsHeader = ({ stats, meetingType, onTypeChange, search, onSearchChange }) => {
  return (
    <div className="glass-card student-gradient-hero student-glow rounded-2xl px-5 py-4">
      <h1 className="text-2xl font-bold text-slate-900">Meeting Logs</h1>
      <p className="student-text-muted text-sm">
        Review upcoming schedule and preserve complete attendance-aware history for past meetings.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5">
        <div className="student-chip rounded-xl px-3 py-2 text-center"><p className="text-slate-500">Total</p><p className="font-semibold text-slate-800">{stats.total}</p></div>
        <div className="student-chip rounded-xl px-3 py-2 text-center"><p className="text-slate-500">Upcoming</p><p className="font-semibold text-indigo-700">{stats.upcoming}</p></div>
        <div className="student-chip rounded-xl px-3 py-2 text-center"><p className="text-slate-500">Previous</p><p className="font-semibold text-emerald-700">{stats.previous}</p></div>
        <div className="student-chip rounded-xl px-3 py-2 text-center"><p className="text-slate-500">Team</p><p className="font-semibold text-cyan-700">{stats.team}</p></div>
        <div className="student-chip rounded-xl px-3 py-2 text-center"><p className="text-slate-500">Supervisor</p><p className="font-semibold text-amber-700">{stats.supervisor}</p></div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="student-chip rounded-full px-3 py-1">
          <select
            value={meetingType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="bg-transparent text-[11px] text-slate-700 outline-none"
          >
            <option value="all">All meeting types</option>
            <option value="team meeting">Team Meeting</option>
            <option value="supervisor meeting">Supervisor Meeting</option>
            <option value="demo">Demo</option>
            <option value="other">Other</option>
          </select>
        </div>

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search agenda or location"
          className="student-form-control rounded-full px-3 py-1 text-[11px] text-slate-700 outline-none"
        />
      </div>
    </div>
  );
};

export default MeetingsHeader;
