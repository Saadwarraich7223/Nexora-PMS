import { useMemo } from "react";
import { FiLayout, FiClock, FiCheckSquare } from "react-icons/fi";

const statusStyle = (status) => {
  const norm = String(status || "todo").toLowerCase();

  if (norm === "todo")
    return {
      bg: "bg-gradient-to-r from-rose-500 to-rose-600",
      body: "bg-rose-50/70",
      percent: "0%",
      border: "border-rose-300/40",
      accent: "text-rose-600",
      percentColor: "text-rose-600/80",
    };
  if (norm === "in-progress" || norm === "in_progress")
    return {
      bg: "bg-gradient-to-r from-indigo-500 to-blue-600",
      body: "bg-indigo-50/70",
      percent: "55%",
      border: "border-indigo-100/50",
      accent: "text-indigo-600",
      percentColor: "text-slate-400",
    };
  if (norm === "review")
    return {
      bg: "bg-gradient-to-r from-amber-400 to-orange-500",
      body: "bg-amber-50/70",
      percent: "80%",
      border: "border-amber-100/50",
      accent: "text-amber-600",
      percentColor: "text-slate-400",
    };
  if (norm === "completed" || norm === "done")
    return {
      bg: "bg-gradient-to-r from-emerald-400 to-teal-500",
      body: "bg-emerald-50/70",
      percent: "100%",
      border: "border-emerald-100/50",
      accent: "text-emerald-600",
      percentColor: "text-white/90",
    };

  return {
    bg: "bg-gradient-to-r from-slate-400 to-slate-500",
    body: "bg-slate-50/70",
    percent: "25%",
    border: "border-slate-200/50",
    accent: "text-slate-600",
    percentColor: "text-slate-400",
  };
};

const TaskTimelineBoard = ({ tasks, openTaskDrawer }) => {
  const deadlineTasks = useMemo(() => tasks.filter((t) => t.deadline), [tasks]);

  const { dayCount, days, rows } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let min = new Date(today);
    let max = new Date(today);
    min.setDate(today.getDate() - 3);
    max.setDate(today.getDate() + 10);

    deadlineTasks.forEach((t) => {
      const d = new Date(t.deadline);
      if (d < min) min = new Date(d);
      if (d > max) max = new Date(d);
    });

    min.setDate(min.getDate() - 2);
    max.setDate(max.getDate() + 2);

    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.max(12, Math.ceil((max - min) / msPerDay));

    const dayArr = Array.from({ length: diffDays }).map((_, i) => {
      const d = new Date(min);
      d.setDate(d.getDate() + i);
      return {
        date: d,
        isToday: d.getTime() === today.getTime(),
        label: d.getDate().toString().padStart(2, "0"),
        month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
        isFirstOfMonth: d.getDate() === 1,
      };
    });

    const enriched = deadlineTasks
      .map((t) => {
        const start = t.createdAt ? new Date(t.createdAt) : new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(t.deadline);
        end.setHours(0, 0, 0, 0);

        if (end.getTime() <= start.getTime()) {
          end.setDate(start.getDate() + 2);
        }

        const startIndex = Math.floor((start - min) / msPerDay);
        const spanDays = Math.ceil((end - start) / msPerDay);
        const isOverdue =
          end < today &&
          !["completed", "done"].includes(String(t.status || "").toLowerCase());

        return {
          ...t,
          startIndex: Math.max(0, startIndex),
          spanDays: Math.max(2, spanDays),
          isOverdue,
        };
      })
      .sort((a, b) => a.startIndex - b.startIndex);

    const packedRows = [];
    enriched.forEach((task) => {
      let placed = false;
      for (let i = 0; i < packedRows.length; i++) {
        const row = packedRows[i];
        const overlaps = row.some(
          (r) => task.startIndex < r.startIndex + r.spanDays + 0.5,
        );
        if (!overlaps) {
          row.push(task);
          placed = true;
          break;
        }
      }
      if (!placed) packedRows.push([task]);
    });

    return { dayCount: diffDays, days: dayArr, rows: packedRows };
  }, [deadlineTasks]);

  if (deadlineTasks.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100 bg-white/40 backdrop-blur-sm">
        <FiLayout className="mb-2 text-2xl text-slate-200" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Operational Registry Empty
        </p>
      </div>
    );
  }

  return (
    <div className="relative bg-white border border-slate-100/60 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
      <div className="overflow-x-auto custom-scrollbar relative h-full">
        <div
          className="min-w-[1200px] w-full"
          style={{ minWidth: `${dayCount * 70}px` }}
        >
          {/* Chrono Header - Informative */}
          <div className="flex sticky top-0 z-30 pb-4 pt-10 bg-white/95 backdrop-blur-md border-b border-slate-200">
            {days.map((day, i) => (
              <div key={i} className="flex-1 shrink-0 text-center relative px-2">
                <p className={`text-[8px] font-black tracking-[0.1em] mb-0.5 ${day.isToday ? "text-indigo-600 font-black" : "text-slate-500 font-bold"}`}>
                  {day.month}
                </p>
                <p
                  className={`text-[14px] font-black transition-all ${day.isToday ? "text-indigo-700 scale-110" : "text-slate-600"}`}
                >
                  {day.label}
                </p>
                {day.isToday && (
                  <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                )}
              </div>
            ))}
          </div>

          {/* Tactical Surface */}
          <div className="relative pb-20 min-h-[400px]">
            {/* Grid infrastructure - High Visibility */}
            <div className="absolute inset-x-0 top-0 bottom-0 flex pointer-events-none z-0">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex-1 shrink-0 border-r border-slate-200/60 h-full ${day.isToday ? "bg-indigo-50/40" : ""}`}
                />
              ))}
            </div>

            {/* Mission Rails - Compact Density */}
            <div className="relative z-10 space-y-5 pt-8 px-5">
              {rows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="relative w-full h-[32px] flex items-center animate-in fade-in slide-in-from-left-4 duration-500"
                  style={{ animationDelay: `${rIdx * 70}ms` }}
                >
                  {row.map((task) => {
                    const style = statusStyle(task.status);
                    return (
                      <div
                        key={task._id}
                        className="absolute h-[30px] flex items-center px-1 cursor-pointer transition-all duration-300 group"
                        style={{
                          left: `${(task.startIndex / dayCount) * 100}%`,
                          width: `${(task.spanDays / dayCount) * 100}%`,
                        }}
                        onClick={() => openTaskDrawer(task)}
                      >
                        {/* Compact Capsule */}
                        <div
                          className={`relative w-full h-full rounded-full transition-all duration-300 
                                        ${style.body} border ${style.border} shadow-sm backdrop-blur-sm
                                        group-hover:scale-[1.01] group-hover:shadow-md`}
                        >
                          {/* Progress fill */}
                          <div
                            className={`absolute inset-y-0 left-0 ${style.bg} transition-all duration-700 ease-out flex items-center justify-end rounded-full overflow-hidden`}
                            style={{ width: style.percent }}
                          >
                            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                          </div>

                          {/* Content Overlay */}
                          <div className="absolute inset-0 flex items-center px-3 justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 flex-1 truncate">
                              <div className="w-5 h-5 rounded-full border border-black/5 bg-white/60 flex items-center justify-center text-[8px] font-black text-slate-700 shrink-0 shadow-sm">
                                {task.assignedTo?.name?.[0] || "?"}
                              </div>

                              <div className="truncate">
                                <h3 className="text-[10px] font-black text-slate-700 leading-none truncate tracking-tight group-hover:text-black">
                                  {task.title}
                                </h3>
                              </div>
                            </div>

                            <div
                              className={`text-[11px] font-black tracking-tighter shrink-0 select-none ${style.percentColor}`}
                            >
                              {style.percent}
                            </div>
                          </div>

                          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                        </div>

                        {/* Intelligent Minimalist Tooltip (Smart Positioning) */}
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 w-64 p-4 bg-white rounded-2xl 
                                        shadow-[0_15px_35px_-12px_rgba(0,0,0,0.12)] border border-slate-100 opacity-0 
                                        group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50
                                        ${rIdx < 3 ? "top-full mt-4 translate-y-2 group-hover:translate-y-0" : "bottom-full mb-4 -translate-y-2 group-hover:translate-y-0"}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[8px] font-black uppercase tracking-widest ${style.accent}`}
                            >
                              Metadata
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {task.deadline
                                ? new Date(task.deadline).toLocaleDateString()
                                : "TBD"}
                            </span>
                          </div>
                          <h4 className="text-[12px] font-black text-slate-900 leading-tight mb-3 truncate uppercase tracking-tight">
                            {task.title}
                          </h4>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                            <div>
                              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Operator
                              </p>
                              <span className="text-[10px] font-bold text-slate-600 truncate block">
                                {task.assignedTo?.name || "Unassigned"}
                              </span>
                            </div>
                            <div className="border-l border-slate-50 pl-3">
                              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Progress
                              </p>
                              <span
                                className={`text-[10px] font-black uppercase ${style.accent}`}
                              >
                                {style.percent} Done
                              </span>
                            </div>
                          </div>

                          {/* Tooltip Arrow */}
                          <div
                            className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-slate-100 rotate-45 z-[-1]
                                          ${rIdx < 3 ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-r border-b"}`}
                          />
                        </div>

                        {/* Critical Alert */}
                        {task.isOverdue && (
                          <div className="absolute top-0 right-2 -translate-y-1/2">
                            <span className="flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-lg shadow-rose-500/50"></span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTimelineBoard;
