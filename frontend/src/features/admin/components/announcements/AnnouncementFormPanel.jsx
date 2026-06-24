import { FiSend, FiType, FiMessageSquare, FiFlag, FiLink, FiUsers, FiGrid, FiHash } from "react-icons/fi";

const AnnouncementFormPanel = ({
  form,
  setForm,
  onSubmit,
  actionStatus,
}) => (
  <div className="glass-card flex flex-col overflow-hidden bg-white/70 backdrop-blur-md border-none rounded-3xl">
    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30">
       <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Create Broadcast Notification</h2>
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Broadcast updates through notifications</p>
    </div>

    <div className="p-8 space-y-6 text-[10px]">
      <div className="space-y-2">
        <label className="font-black text-slate-400 uppercase tracking-widest px-1">Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Broadcast summary"
          className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300"
        />
      </div>

      <div className="space-y-2">
        <label className="font-black text-slate-400 uppercase tracking-widest px-1">Message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="Write your notification details..."
          rows={4}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300 resize-none"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="font-black text-slate-400 uppercase tracking-widest px-1 text-[9px]">Priority Level</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-indigo-400 transition-all cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-black text-slate-400 uppercase tracking-widest px-1 text-[9px]">Link (Optional)</label>
          <input
            value={form.link}
            onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
            placeholder="e.g. /student/projects"
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="font-black text-slate-400 uppercase tracking-widest px-1 text-[9px]">Audience</label>
          <select
            value={form.target}
            onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="students">Students Only</option>
            <option value="teachers">Teachers Only</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-black text-slate-400 uppercase tracking-widest px-1 text-[9px]">Department</label>
          <input
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
            placeholder="Any"
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="font-black text-slate-400 uppercase tracking-widest px-1 text-[9px]">Semester</label>
          <select
            value={form.semester}
            onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all cursor-pointer"
          >
            <option value="">Any</option>
            <option value="4">Sem 4</option>
            <option value="8">Sem 8</option>
          </select>
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="w-full h-11 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        disabled={actionStatus === "loading"}
      >
        {actionStatus === "loading" ? (
          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        ) : (
          <FiSend size={14} />
        )}
        {actionStatus === "loading" ? "Sending..." : "Send Broadcast"}
      </button>
    </div>
  </div>
);

export default AnnouncementFormPanel;
