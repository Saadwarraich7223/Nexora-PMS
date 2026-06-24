import { useMemo } from "react";
import { 
  FiCalendar, 
  FiMapPin, 
  FiClock, 
  FiUsers, 
  FiActivity, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiMessageSquare,
  FiStar,
  FiTrello,
  FiList
} from "react-icons/fi";

const MeetingDetailContent = ({ 
  meeting, 
  isPast, 
  presentCount, 
  absentCount, 
  presentMembers = [], 
  absentMembers = [],
  isLeader = false,
  onMarkAttendance,
  attendanceDraft = [],
  setAttendanceDraft,
  members = [],
  actionStatus = "idle",
  children // For footer buttons like Edit/Delete
}) => {
  if (!meeting) return null;

  const type = String(meeting.type || "Meeting").toLowerCase();
  const isSupervisor = type === "supervisor meeting";

  return (
    <div className="flex flex-col gap-6 pb-6 pt-1">
      {/* -- Header Context Tile -------------------------------- */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/40 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isSupervisor 
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
              : "bg-teal-50 border-teal-200 text-teal-700 shadow-[0_0_8px_rgba(45,212,191,0.2)]"
          }`}>
            <FiActivity size={12} />
            {meeting.type || "General Meeting"}
          </span>
          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isPast 
              ? "bg-slate-50 border-slate-200 text-slate-500" 
              : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
          }`}>
            <FiClock size={12} />
            {isPast ? "Completed" : "Upcoming"}
          </span>
          {meeting.location && (
            <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <FiMapPin size={12} className="text-slate-400" />
              {meeting.location}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              <FiMessageSquare size={13} className="text-slate-400" />
              Meeting Agenda
            </label>
            <p className="text-[12px] font-medium leading-relaxed text-slate-700 bg-white/50 rounded-xl p-3 border border-slate-100 shadow-inner">
              {meeting.agenda || "No agenda provided for this session."}
            </p>
          </div>
        </div>
      </div>

      {/* -- Discussion Points ---------------------------------- */}
      {meeting.discussionPoints?.length > 0 && (
        <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-white/40 p-4 shadow-sm backdrop-blur-sm">
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 mb-3">
            <FiList size={14} />
            Key Discussion Points
          </label>
          <ul className="space-y-2">
            {meeting.discussionPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[11px] text-slate-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* -- Attendance Controls / Stats ------------------------ */}
      {presentCount !== undefined && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white/40 p-4 shadow-sm backdrop-blur-sm flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <FiCheckCircle size={12} /> Present
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
          </div>
          <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-white/40 p-4 shadow-sm backdrop-blur-sm flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <FiAlertCircle size={12} /> Absent
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">{absentCount}</p>
          </div>
        </div>
      )}

      {/* -- Leader Attendance Marking -------------------------- */}
      {isLeader && isPast && onMarkAttendance && (
        <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-white/40 p-4 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-3 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700">
              <FiUsers size={14} />
              Mark Attendance
            </label>
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-indigo-100">Leader Control</span>
          </div>
          
          <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-indigo-100 bg-white p-1.5 shadow-inner custom-scrollbar">
            {members.map((member) => {
              const memberId = String(member._id);
              const isChecked = attendanceDraft.includes(memberId);
              return (
                <label key={memberId} className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${
                  isChecked ? 'bg-indigo-50 text-indigo-800 shadow-sm' : 'hover:bg-slate-50 text-slate-600'
                }`}>
                  <span className="text-[11px] font-bold">{member.name}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={actionStatus === "loading"}
                    className="h-4 w-4 rounded-full border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                    onChange={() =>
                      setAttendanceDraft((prev) =>
                        isChecked ? prev.filter((id) => id !== memberId) : [...prev, memberId],
                      )
                    }
                  />
                </label>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={onMarkAttendance}
              disabled={actionStatus === "loading"}
              className="rounded-full bg-indigo-600 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {actionStatus === "loading" ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* -- Linked Updates ------------------------------------- */}
      {(meeting.taskUpdates?.length > 0 || meeting.featureUpdates?.length > 0) && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm space-y-6">
          
          {meeting.taskUpdates?.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-violet-700 mb-3">
                <FiTrello size={14} />
                Linked Task Updates
              </label>
              <div className="grid gap-2.5">
                {meeting.taskUpdates.map((item, idx) => (
                  <div key={idx} className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all group">
                    <p className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.task?.title || "Task"}</p>
                    {item.note && <p className="text-[10px] font-medium text-slate-500 mt-1 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-dashed border-slate-200">{item.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {meeting.featureUpdates?.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 mb-3 pt-2">
                <FiStar size={14} />
                Feature Milestones
              </label>
              <div className="grid gap-2.5">
                {meeting.featureUpdates.map((item, idx) => (
                  <div key={idx} className="rounded-xl bg-white border border-amber-100/50 p-3 shadow-sm flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate uppercase tracking-tight">{item.feature?.name || "Feature"}</p>
                      {item.note && <p className="text-[10px] font-medium text-slate-500 mt-1">{item.note}</p>}
                    </div>
                    {item.progress !== undefined && (
                      <div className="flex flex-col items-center shrink-0 bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 leading-none mb-1">PROG</p>
                        <p className="text-[11px] font-black text-amber-700 leading-none">{item.progress}%</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- Members List --------------------------------------- */}
      {!isLeader && (presentMembers.length > 0 || absentMembers.length > 0) && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm space-y-5">
          {presentMembers.length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                <FiUsers className="text-emerald-500" size={14} /> Present
              </p>
              <div className="flex flex-wrap gap-2">
                {presentMembers.map((member) => (
                  <span key={member._id} className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {presentMembers.length > 0 && absentMembers.length > 0 && <div className="h-px w-full bg-slate-100" />}
          {absentMembers.length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                <FiUsers className="text-rose-500" size={14} /> Absent
              </p>
              <div className="flex flex-wrap gap-2">
                {absentMembers.map((member) => (
                  <span key={member._id} className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-[10px] font-bold text-rose-700 shadow-sm">
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- Custom Actions Footer ------------------------------ */}
      {children && (
        <div className="mt-2 border-t border-slate-200 pt-6 flex flex-wrap items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default MeetingDetailContent;
