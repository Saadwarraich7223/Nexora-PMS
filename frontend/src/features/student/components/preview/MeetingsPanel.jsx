import { FiClock, FiCalendar, FiMapPin, FiArrowRight, FiVideo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const MeetingsPanel = ({ meetings, onOpen }) => {
  const navigate = useNavigate();
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  const upcomingMeetings = [...meetings]
    .filter((m) => new Date(m.date || m.createdAt).getTime() >= now.getTime())
    .sort(
      (a, b) =>
        new Date(a.date || a.createdAt).getTime() -
        new Date(b.date || b.createdAt).getTime(),
    );

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl h-full hover:shadow-md transition-all group">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiCalendar className="text-indigo-600" />
          <h2>Live Agenda Log</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Live Sync</span>
        </div>
      </div>

      <div className="p-3 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {upcomingMeetings.slice(0, 4).map((m) => {
          const mDate = new Date(m.date || m.createdAt);
          const mStartOfDay = new Date(
            mDate.getFullYear(),
            mDate.getMonth(),
            mDate.getDate(),
          ).getTime();
          const daysRemaining = Math.max(
            0,
            Math.round((mStartOfDay - startOfToday) / 86400000),
          );

          let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
          let badgeText = `In ${daysRemaining} days`;

          if (daysRemaining === 0) {
            badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
            badgeText = "Today";
          } else if (daysRemaining === 1) {
            badgeClass = "bg-amber-50 text-amber-600 border-amber-100";
            badgeText = "Tomorrow";
          }

          return (
            <button
              key={m._id}
              onClick={() => onOpen?.(m)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all text-left shadow-sm flex items-start gap-3 group/item"
            >
              <div className="flex flex-col items-center justify-center h-10 w-10 shrink-0 bg-slate-900 rounded-lg shadow-md border border-slate-800 group-hover/item:bg-indigo-600 group-hover/item:border-indigo-500 transition-colors">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-indigo-200">
                    {mDate.toLocaleDateString("en-US", { month: "short" })}
                 </span>
                 <span className="text-sm font-black text-white mt-0.5">
                    {mDate.getDate()}
                 </span>
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover/item:text-indigo-600 transition-colors">
                      {m.title || m.type || "Academic Sync Session"}
                    </p>
                    <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${badgeClass}`}>
                       {badgeText}
                    </span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 line-clamp-1">
                    {m.agenda || "General project coordination review"}
                 </p>
                 <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                       <FiClock size={10} className="text-indigo-500" />
                       {mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {m.location && (
                       <>
                         <div className="h-1 w-1 rounded-full bg-slate-200" />
                         <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <FiVideo size={10} className="text-emerald-500" />
                            {m.location}
                         </div>
                       </>
                    )}
                 </div>
              </div>
            </button>
          );
        })}

        {upcomingMeetings.length === 0 && (
          <div className="py-12 text-center flex flex-col items-center">
             <div className="h-12 w-12 mb-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                <FiCalendar size={24} />
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Agenda Clear</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/30">
        <button
          onClick={() => navigate("/student/meetings")}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors group"
        >
          View Full Schedule <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default MeetingsPanel;
