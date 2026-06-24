const getMemberId = (member) => String(member?._id || member?.user?._id || member?.user || "");

const MeetingsListPanel = ({
  title = "Meeting History",
  meetings,
  loading,
  onSelect,
  formatDate,
  showAttendance = false,
  groupMembers = [],
}) => {
  const groupMemberIds = groupMembers.map(getMemberId).filter(Boolean);

  return (
    <div className="glass-card student-premium-card rounded-2xl px-4 py-4">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="student-text-muted text-xs">Loading meetings...</p>
        ) : meetings.length > 0 ? (
          meetings.map((meeting) => {
            const attendeeIds = (meeting.attendees || []).map((m) => String(m?._id || m));
            const presentCount = attendeeIds.length;
            const absentCount =
              groupMemberIds.length > 0
                ? groupMemberIds.filter((id) => !attendeeIds.includes(id)).length
                : 0;

            return (
              <button
                key={meeting._id}
                onClick={() => onSelect(meeting)}
                className="student-info-tile w-full rounded-xl px-3 py-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {meeting.type || "Meeting"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {meeting.date ? formatDate(meeting.date) : formatDate(meeting.createdAt)}
                    </p>
                  </div>
                  <span className="student-chip rounded-full px-2 py-1 text-[10px] text-slate-700">
                    {meeting.attendees?.length || 0} attendees
                  </span>
                </div>

                <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                  {meeting.agenda || "No agenda added."}
                </p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {meeting.location ? (
                    <span className="student-feature-link-chip rounded-full px-2 py-0.5 text-[9px] text-slate-600">
                      {meeting.location}
                    </span>
                  ) : null}
                  <span className="student-feature-link-chip rounded-full px-2 py-0.5 text-[9px] text-slate-600">
                    Task updates: {meeting.taskUpdates?.length || 0}
                  </span>
                  <span className="student-feature-link-chip rounded-full px-2 py-0.5 text-[9px] text-slate-600">
                    Feature updates: {meeting.featureUpdates?.length || 0}
                  </span>
                  {showAttendance && (
                    <>
                      {presentCount === 0 && absentCount === groupMemberIds.length ? (
                        <span className="rounded-full bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 text-[9px] font-semibold">
                          Pending Attendance
                        </span>
                      ) : (
                        <>
                          <span className="student-feature-status-completed rounded-full px-2 py-0.5 text-[9px] font-semibold">
                            Present: {presentCount}
                          </span>
                          <span className="student-feature-status-pending rounded-full px-2 py-0.5 text-[9px] font-semibold">
                            Absent: {absentCount}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <p className="student-text-muted text-xs">No meetings match current filters.</p>
        )}
      </div>
    </div>
  );
};

export default MeetingsListPanel;
