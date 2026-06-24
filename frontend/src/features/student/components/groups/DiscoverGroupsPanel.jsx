import { FiSearch, FiArrowRight, FiUsers } from "react-icons/fi";

const DiscoverGroupsPanel = ({ groups, myGroupId, actionLoading, onJoin }) => {
  const list = groups.filter((g) => String(g._id || g.id) !== String(myGroupId || ""));

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-xs rounded-xl h-full transition-all group/panel">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
          <FiSearch className="text-indigo-600" size={12} />
          <h2>Squad Discovery Registry</h2>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {list.length > 0 ? list.map((group) => (
          <div key={group._id || group.id} className="p-4 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group/item">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight group-hover/item:text-indigo-600 transition-colors truncate leading-none">{group.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{group.department} | S{group.semester}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-slate-100">
                <FiUsers className="text-slate-400" size={10} />
                <span className="text-[9px] font-black text-slate-700">{(group.members || []).length}/{group.maxMembers || 4}</span>
              </div>
            </div>
            
            <button
              onClick={() => onJoin(group._id || group.id)}
              disabled={actionLoading}
              className="w-full h-8 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              Request Access
            </button>
          </div>
        )) : (
          <div className="py-12 text-center flex flex-col items-center">
            <FiSearch size={24} className="text-slate-200 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No Available Squads</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverGroupsPanel;
