import { Link } from "react-router-dom";
import { FiUserPlus, FiLayers, FiChevronRight, FiClock } from "react-icons/fi";
import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";

const SupervisorPanel = ({
  showAssignPanel,
  setShowAssignPanel,
  supervisorRequests,
  unassignedGroups,
  isLoading,
  hideHeader = false,
}) => {
  if (hideHeader) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 bg-white/40 border-b border-slate-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignment Engine</p>
          </div>
          <button 
            onClick={() => setShowAssignPanel(!showAssignPanel)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              showAssignPanel 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm"
            }`}
          >
            {showAssignPanel ? "View Requests" : "Direct Assign"}
          </button>
        </div>

         <div className="divide-y divide-slate-100 overflow-auto custom-scrollbar">
           {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="p-4"><LoadingSkeleton className="h-12 w-full" /></div>
             ))
           ) : showAssignPanel ? (
             unassignedGroups.length === 0 ? (
               <div className="py-12 text-center text-[11px] text-slate-400 font-medium">No unassigned groups.</div>
             ) : (
               unassignedGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-l-2 border-transparent hover:border-indigo-500">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">{group.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{group.size} Members | {group.department}</p>
                  </div>
                  <Link to="/admin/groups" className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100">
                    <FiUserPlus size={14} />
                  </Link>
                </div>
               ))
             )
           ) : (
             supervisorRequests.length === 0 ? (
               <div className="py-12 text-center text-[11px] text-slate-400 font-medium">No pending requests.</div>
             ) : (
               supervisorRequests.map((req) => (
                <div key={req.id} className="flex flex-col p-4 hover:bg-slate-50 transition-all border-l-2 border-transparent hover:border-amber-500">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">{req.group}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-black uppercase tracking-tighter">Pending</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-3">Req: {req.requestedSupervisor} | {req.department}</p>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-amber-100 flex items-center justify-center text-amber-600 text-[10px] font-black shadow-sm">
                           {req.requestedBy?.charAt(0) || "S"}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tight">{req.requestedBy}</p>
                      </div>
                     <button 
                        onClick={() => setShowAssignPanel(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-slate-200 px-4 py-1.5 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                     >
                        Assign Now
                     </button>
                  </div>
                </div>
               ))
             )
           )}
         </div>
      </div>
    );
  }

  return (
    <div className="glass-card px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
           {showAssignPanel ? "Direct Assignment" : "Supervisor Requests"}
        </h2>
        <button
          onClick={() => setShowAssignPanel((prev) => !prev)}
          className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            showAssignPanel 
              ? "bg-slate-900 text-white shadow-[0_0_12px_rgba(15,23,42,0.3)]" 
              : "bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-sm"
          }`}
        >
          {showAssignPanel ? "View Requests" : "Assign Supervisor"}
        </button>
      </div>
      <p className="text-[10px] font-bold text-slate-500 mb-6">
        {showAssignPanel
          ? "Identify groups without mentors and assign faculty directly."
          : "Process incoming mentored project requests from students."}
      </p>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 animate-pulse h-16"></div>
            ))
          : !showAssignPanel ? (
              supervisorRequests.length > 0 ? (
                supervisorRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-100 bg-white/50 p-4 transition-all hover:shadow-md hover:border-indigo-100 border-l-4 border-l-amber-500">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">{request.group}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{request.department}</p>
                      </div>
                      <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">Request</span>
                    </div>
                    <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Requested: <span className="text-slate-800">{request.requestedSupervisor}</span></p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">By {request.requestedBy}</p>
                      <button onClick={() => setShowAssignPanel(true)} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100">Resolve</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                  <FiLayers className="mx-auto text-slate-200 mb-2" size={24} />
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No pending requests</p>
                </div>
              )
          ) : (
             unassignedGroups.length > 0 ? (
                unassignedGroups.slice(0, 3).map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white/50 border-l-4 border-l-indigo-500 hover:shadow-md transition-all">
                    <div>
                      <p className="text-xs font-black text-slate-800 tracking-tight">{group.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{group.department} | {group.size} students</p>
                    </div>
                    <Link to="/admin/groups" className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100">
                      <FiUserPlus size={14} />
                    </Link>
                  </div>
                ))
             ) : (
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center py-4">All groups assigned.</p>
             )
          )}
      </div>

      <div className="mt-6 flex justify-center">
         <Link to="/admin/groups" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group">
            Manage All Assignments <FiChevronRight className="inline group-hover:translate-x-1 transition-transform" />
         </Link>
      </div>
    </div>
  );
};

export default SupervisorPanel;
