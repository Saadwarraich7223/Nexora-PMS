import { Link } from "react-router-dom";
import { FiEye, FiUsers, FiChevronRight, FiLayers } from "react-icons/fi";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";

const GroupPanel = ({
  groupFilter,
  setGroupFilter,
  groupRows,
  groupsStatus,
  onViewGroup,
  hideHeader = false,
}) => {
  if (hideHeader) {
    return (
      <div className="flex flex-col h-full">
        {/* Filter Bar - Minimalist for Hub */}
        <div className="flex items-center justify-between p-4 bg-white/40 border-b border-slate-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            {["pending", "active", "rejected"].map((filter) => (
              <button
                key={filter}
                onClick={() => setGroupFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  groupFilter === filter
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                    : "bg-white text-slate-400 border border-slate-200 hover:border-emerald-100 hover:text-emerald-600 shadow-sm"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Registry</p>
          </div>
        </div>
        
        {/* Table Content */}
        <div className="divide-y divide-slate-100 overflow-auto custom-scrollbar">
          {groupsStatus === "loading" ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`skel-${index}`} className="p-4 flex items-center justify-between">
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-4 w-20" />
              </div>
            ))
          ) : groupRows.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs text-slate-400 font-medium">No results found.</p>
            </div>
          ) : (
            groupRows.map((group) => (
              <div 
                key={group.id || group._id} 
                onClick={() => onViewGroup(group)}
                className="group flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-all border-l-2 border-transparent hover:border-emerald-500"
              >
                <div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">{group.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{group.department} | {group.semester}</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${group.members >= group.capacity ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                     {group.members} / {group.capacity} Members
                   </span>
                   <div className="p-2 rounded-full bg-slate-50/50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors shadow-sm">
                      <FiChevronRight />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card flex max-h-[520px] flex-col overflow-hidden px-4 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
             Group Status
          </h2>
          <p className="text-[10px] font-bold text-slate-500">
            Filter groups by status and review membership capacity.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50/50 border border-slate-100 p-1 text-[11px] font-semibold text-slate-500">
          {[
            { key: "pending", label: "Pending" },
            { key: "active", label: "Active" },
            { key: "rejected", label: "Rejected" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setGroupFilter(item.key)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                groupFilter === item.key
                  ? "bg-white text-emerald-600 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {groupRows.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white/50">
          <div className="grid gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 md:grid-cols-6 border-b border-slate-100">
            <span className="md:col-span-2">Group Identification</span>
            <span className="md:col-span-2 text-center">Membership Status</span>
            <span className="md:col-span-1">Details</span>
            <span className="md:col-span-1 text-right">Action</span>
          </div>

          <div className="divide-y divide-slate-100">
            {groupsStatus === "loading"
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`group-skeleton-${index}`}
                    className="grid w-full items-center gap-2 px-4 py-3 text-sm md:grid-cols-6"
                  >
                    <LoadingSkeleton className="h-4 w-full " />
                    <div></div>
                    <LoadingSkeleton className="h-4 w-full" />
                    <div></div>
                    <LoadingSkeleton className="h-4 w-full" />
                    <LoadingSkeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))
              : groupRows.map((group) => {
                  const percent = group.capacity
                    ? Math.round((group.members / group.capacity) * 100)
                    : 0;
                  const remaining = Math.max(group.capacity - group.members, 0);

                  return (
                    <div
                      key={group.id || group.name}
                      className="grid items-center gap-3 px-4 py-4 text-sm md:grid-cols-6 transition-colors hover:bg-slate-50/50 border-l-2 border-transparent hover:border-emerald-500"
                    >
                      <div className="md:col-span-2">
                        <p className="text-sm font-black text-slate-800 tracking-tight">
                          {group.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Created: {new Date(group.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="md:col-span-2 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase mb-1">
                          <FiUsers className="text-emerald-500" />
                          {group.members}/{group.capacity} Members
                        </div>
                        <div
                          className="h-1.5 w-full max-w-[100px] rounded-full bg-slate-100 overflow-hidden shadow-inner"
                        >
                          <div
                            className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-1 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {group.department} | {group.semester}
                      </div>
                      <div className="md:col-span-1 text-right">
                        <button
                          onClick={() => onViewGroup(group)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      ) : (
        <div className="px-4 py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
          <FiLayers size={32} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-black text-slate-800 uppercase tracking-widest">No Groups Found</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-[200px] mx-auto">Adjust filters to find the groups you're looking for.</p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Link
          to="/admin/groups"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 group transition-all"
        >
          View all groups <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default GroupPanel;
