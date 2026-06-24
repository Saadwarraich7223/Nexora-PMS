const priorityStyles = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

const AnnouncementsPanel = ({ items = [] }) => (
  <div className="glass-card px-4 py-4">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-800">Announcements</h3>
      <span className="text-[11px] text-slate-500">{items.length}</span>
    </div>
    <div className="mt-3 space-y-3">
      {items.length > 0 ? (
        items.map((item) => (
          <div key={item._id} className="rounded-2xl card-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-800">
                {item.title || "Announcement"}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  priorityStyles[item.priority] || priorityStyles.low
                }`}
              >
                {item.priority || "low"}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-600">{item.message}</p>
            <p className="mt-2 text-[10px] text-slate-400">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))
      ) : (
        <div className="rounded-2xl card-surface p-3">
          <p className="text-[11px] text-slate-500">No announcements yet.</p>
        </div>
      )}
    </div>
  </div>
);

export default AnnouncementsPanel;
