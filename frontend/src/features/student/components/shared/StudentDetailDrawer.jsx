const StudentDetailDrawer = ({ open, title, subtitle, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="student-detail-drawer fixed inset-0 h-screen  overflow-hidden   z-50 flex justify-end  p-4">
      <div
        onClick={onClose}
        className="inset-0 absolute  z-90  bg-slate-900/50 "
      />
      <div className="bg-white/95 backdrop-blur-xl rounded-xl border-l border-slate-200 flex h-full w-full max-w-md flex-col overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="h-8 px-4 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-xs hover:bg-rose-50"
          >
            Close
          </button>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailDrawer;
