import { FiUserPlus, FiSearch, FiSend } from "react-icons/fi";
import { useState } from "react";

const InviteStudentsPanel = ({
  students,
  myGroupMemberIds,
  isLeader,
  actionLoading,
  onInvite,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  if (!isLeader) return null;

  const filtered = students.filter((s) => {
    const isAlreadyMember = myGroupMemberIds.includes(String(s._id || s.id));
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadyMember && matchesSearch;
  });

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-xs rounded-xl h-full transition-all group/panel">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiUserPlus className="text-indigo-600" size={12} />
          <h2>Personnel Recruitment</h2>
        </div>
        <div className="relative w-full sm:w-48 group/search">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors"
            size={12}
          />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-lg bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-200 transition-all text-xs"
          />
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {filtered.length > 0 ? (
          filtered.map((student) => (
            <div
              key={student._id || student.id}
              className="p-4 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group/item flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight group-hover/item:text-indigo-600 transition-colors truncate">
                  {student.name}
                </p>
                <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">
                  {student.email}
                </p>
              </div>

              <button
                onClick={async () => {
                  const id = student._id || student.id;
                  setLoadingId(id);
                  try {
                    await onInvite(id);
                  } finally {
                    setLoadingId(null);
                  }
                }}
                disabled={loadingId === (student._id || student.id)}
                className="px-4 h-8 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <FiSend size={12} />
                {loadingId === (student._id || student.id)
                  ? "Inviting..."
                  : "Dispatch"}
              </button>
            </div>
          ))
        ) : (
          <div className="py-12 text-center flex flex-col items-center">
            <FiSearch size={24} className="text-slate-200 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              No Available Personnel
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteStudentsPanel;
