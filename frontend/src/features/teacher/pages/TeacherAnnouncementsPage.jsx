import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiRadio, FiBell, FiClock, FiSearch } from "react-icons/fi";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import { fetchAnnouncements } from "../../admin/slices/adminSlice.js";
import getErrorMessage from "../../../utils/error.js";
import { showError } from "../../../components/ui/toast.jsx";

const formatDate = (value) => {
  if (!value) return "?";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "?";
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TeacherAnnouncementsPage = () => {
  const dispatch = useDispatch();
  const { announcements, announcementsStatus } = useSelector((state) => state.admin);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAnnouncements())
      .unwrap()
      .catch((error) => {
        showError(getErrorMessage(error, "Failed to load broadcast notifications."));
      });
  }, [dispatch]);

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((ann) => {
        const matchesSearch = ann.title.toLowerCase().includes(search.toLowerCase()) || 
                             ann.message.toLowerCase().includes(search.toLowerCase());
        // Only show if no target roles specified (all) or if "teacher" is in target roles
        const isTargeted = ann.targetRoles?.length > 0;
        const isForTeacher = !isTargeted || ann.targetRoles.includes("teacher");
        return matchesSearch && isForTeacher;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [announcements, search]);

  return (
    <DashboardShell>
      <div className="h-full bg-transparent overflow-y-auto custom-scrollbar">
        <main className="max-w-[1400px] mx-auto space-y-6 pb-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FiRadio className="text-indigo-600" />
                Broadcast Notifications
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Official Faculty & Institutional Communications
              </p>
            </div>
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={12} />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH_BROADCASTS..."
                className="h-8 pl-9 pr-4 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all w-60 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {announcementsStatus === "loading" ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/50 animate-pulse rounded-2xl border border-slate-100" />
              ))
            ) : filteredAnnouncements.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <FiBell className="text-slate-300" size={32} />
                </div>
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Broadcast Feed Clear</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">No active broadcasts detected in the current stream.</p>
              </div>
            ) : (
              filteredAnnouncements.map((ann) => (
                <div 
                  key={ann._id} 
                  className={`glass-card p-4 bg-white shadow-sm rounded-xl border-none transition-all hover:bg-slate-50 group relative overflow-hidden`}
                >
                  {ann.priority === 'high' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                          ann.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          ann.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          {ann.priority} Priority
                        </span>
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                          <FiClock size={9} />
                          {formatDate(ann.createdAt)}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-[11px] font-black text-slate-900 tracking-tight uppercase">
                          {ann.title}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight mt-1 whitespace-pre-wrap max-w-4xl">
                          {ann.message}
                        </p>
                      </div>
                      {ann.link && (
                        <a 
                          href={ann.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors bg-indigo-50/50 px-2.5 py-1 rounded-md border border-indigo-100"
                        >
                          External Protocol
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </DashboardShell>
  );
};

export default TeacherAnnouncementsPage;
