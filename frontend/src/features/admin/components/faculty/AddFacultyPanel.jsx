const AddFacultyPanel = ({ form, setForm, onSubmit, actionStatus }) => (
  <div className="glass-card flex h-full flex-col p-6">
    <div className="mb-6">
       <h2 className="text-base font-black text-slate-800 tracking-tight">Onboard Faculty</h2>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Provisioning Hub</p>
    </div>

    <form onSubmit={onSubmit} className="flex flex-1 flex-col">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
               <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Full Name</label>
               <input
                 value={form.name}
                 onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                 placeholder="e.g. John Doe"
                 className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none rounded-xl focus:bg-white focus:border-indigo-300 transition-all shadow-sm"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Email Domain</label>
               <input
                 value={form.email}
                 onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                 placeholder="johndoe@university.edu"
                 className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none rounded-xl focus:bg-white focus:border-indigo-300 transition-all shadow-sm"
               />
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
               <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Academic Department</label>
               <input
                 value={form.department}
                 onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                 placeholder="e.g. Computer Science"
                 className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none rounded-xl focus:bg-white focus:border-indigo-300 transition-all shadow-sm"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Supervisor Capacity</label>
               <input
                 type="number"
                 min="0"
                 value={form.supervisorCapacity}
                 onChange={(e) => setForm((prev) => ({ ...prev, supervisorCapacity: e.target.value }))}
                 placeholder="0-10"
                 className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none rounded-xl focus:bg-white focus:border-indigo-300 transition-all shadow-sm"
               />
            </div>
        </div>

        <div className="space-y-1.5">
           <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Temporary Security Access</label>
           <input
             type="password"
             value={form.password}
             onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
             placeholder="••••••••••••"
             className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none rounded-xl focus:bg-white focus:border-indigo-300 transition-all shadow-sm"
           />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50">
        <button
          type="submit"
          className="w-full h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
          disabled={actionStatus === "loading"}
        >
          {actionStatus === "loading" ? "Initializing..." : "Authorize Portal Access"}
        </button>
      </div>
    </form>
  </div>
);

export default AddFacultyPanel;
