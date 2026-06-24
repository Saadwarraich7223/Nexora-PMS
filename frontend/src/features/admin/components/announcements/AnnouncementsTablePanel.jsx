import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";
import { FiList, FiTrash2, FiEye, FiZap, FiTarget, FiFlag, FiRadio } from "react-icons/fi";

const AnnouncementsTablePanel = ({
  rows,
  status,
  onDelete,
}) => (
  <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none rounded-3xl">
    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30">
       <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Broadcasts</h2>
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">History of notification broadcasts</p>
    </div>

    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-8 py-3 bg-slate-50/50 border-b border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title & Date</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Read Rate</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</span>
        </div>

        <div className="divide-y divide-slate-50">
          {status === "loading"
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`announcement-skeleton-${index}`}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] items-center gap-4 px-8 py-4"
                >
                  <LoadingSkeleton className="h-4 w-48 rounded-md" />
                  <LoadingSkeleton className="h-6 w-16 rounded-full" />
                  <LoadingSkeleton className="h-4 w-20 rounded-md" />
                  <LoadingSkeleton className="h-4 w-12 rounded-md" />
                  <div className="flex justify-end">
                    <LoadingSkeleton className="h-8 w-8 rounded-xl" />
                  </div>
                </div>
              ))
            : rows.length > 0
              ? rows.map((row) => (
                  <div
                    key={row._id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] items-center gap-4 px-8 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-slate-800 tracking-tight truncate">{row.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{row.createdAtLabel}</p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          row.priority === "high"
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : row.priority === "medium"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {row.priority}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                      {row.audienceLabel}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-black text-slate-700">
                         {row.readCount}<span className="text-slate-300 font-bold">/</span>{row.recipients}
                       </span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => onDelete(row)}
                        className="h-8 w-8 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              : (
                <div className="px-8 py-16 text-center">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                     <FiRadio size={24} />
                  </div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-widest">No Broadcasts Found</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Updates will appear here once sent.</p>
                </div>
              )}
        </div>
      </div>
    </div>
  </div>
);

export default AnnouncementsTablePanel;
