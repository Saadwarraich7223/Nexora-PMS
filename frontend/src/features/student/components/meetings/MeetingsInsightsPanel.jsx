const MeetingsInsightsPanel = ({ meetings, formatDate }) => {
  const latest = [...meetings]
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="glass-card student-premium-card rounded-2xl px-4 py-4">
      <h2 className="text-sm font-semibold text-slate-800">Latest Notes</h2>
      <div className="mt-3 space-y-2">
        {latest.length > 0 ? (
          latest.map((meeting) => (
            <div key={meeting._id} className="student-feature-link-chip rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-slate-700">{meeting.type || "Meeting"}</p>
              <p className="text-[10px] text-slate-500">
                {formatDate(meeting.date || meeting.createdAt)}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] text-slate-600">
                {meeting.discussionPoints?.[0] || meeting.agenda || "No discussion summary."}
              </p>
            </div>
          ))
        ) : (
          <p className="student-text-muted text-xs">No meeting notes yet.</p>
        )}
      </div>
    </div>
  );
};

export default MeetingsInsightsPanel;
