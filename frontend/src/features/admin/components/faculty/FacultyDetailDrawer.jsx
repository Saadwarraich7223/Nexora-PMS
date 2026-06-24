import {
  FiUser,
  FiMail,
  FiBookOpen,
  FiLayers,
  FiSettings,
  FiTrash2,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";
import LoadingSkeleton from "../../../../components/ui/LoadingSkeleton.jsx";
const FacultyDetailDrawer = ({
  open,
  onClose,
  detailStatus,
  detail,
  editForm,
  setEditForm,
  onUpdate,
  onCapacityUpdate,
  onDelete,
  actionStatus,
}) => {
  if (!open) return null;

  const isSupervisor = (detail?.supervisorCapacity ?? 0) > 0;
  const assignedCount = Array.isArray(detail?.assignedGroups)
    ? detail.assignedGroups.length
    : 0;
  const capacity = detail?.supervisorCapacity ?? 0;

  return (
    <div className="fixed inset-0 -top-5  z-50 flex justify-end bg-slate-900/10 backdrop-blur-[2px] p-4 text-[10px]">
      <div className="glass-card flex h-full w-full max-w-[450px] flex-col overflow-hidden p-6 border-none shadow-xl bg-white">
        {/* Header: Identity focal point */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-inner">
              <FiUser size={24} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                {detail?.name || "Faculty Profile"}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">
                {isSupervisor ? "Project Supervisor" : "Teaching Faculty"} |{" "}
                {detail?.department || "Department"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all border border-slate-100"
          >
            <FiXCircle size={18} />
          </button>
        </div>

        {!detail && detailStatus === "loading" ? (
          <div className="flex-1 space-y-4">
            <LoadingSkeleton className="h-20 w-full rounded-xl" />
            <LoadingSkeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
            {/* Identity Details Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">
                  Workload Statistics
                </p>
                <p className="text-xs font-black text-slate-800">
                  {assignedCount} / {capacity}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  Assigned Groups
                </p>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">
                  Communication
                </p>
                <p className="text-xs font-black text-slate-800 truncate">
                  {detail?.email}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  Official Email
                </p>
              </div>
            </div>

            {/* Profile Management Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiSettings className="text-slate-400" size={12} />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Core Configuration
                </h4>
              </div>
              <div className="glass-card bg-slate-50/30 p-4 border border-slate-100 space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">
                    Legal Name
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none rounded-xl focus:border-indigo-400 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">
                    Email Access
                  </label>
                  <input
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none rounded-xl focus:border-indigo-400 transition-all"
                  />
                </div>
                <button
                  onClick={onUpdate}
                  disabled={actionStatus === "loading"}
                  className="w-full h-9 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-[0.98] mt-2 shadow-md shadow-slate-200"
                >
                  {actionStatus === "loading"
                    ? "Syncing..."
                    : "Sync Profile Changes"}
                </button>
              </div>
            </div>

            {/* Capacity Engine Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiLayers className="text-slate-400" size={12} />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Capacity Matrix
                </h4>
              </div>
              <div className="glass-card bg-slate-50/30 p-4 border border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editForm.supervisorCapacity}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        supervisorCapacity: e.target.value,
                      }))
                    }
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none rounded-xl focus:border-indigo-400 transition-all"
                    placeholder="Max Groups"
                  />
                  <button
                    onClick={onCapacityUpdate}
                    disabled={actionStatus === "loading"}
                    className="h-9 px-4 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md shadow-indigo-100"
                  >
                    Update
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 font-medium mt-2 italic px-1">
                  Setting capacity to 0 converts to non-supervisor teaching
                  staff.
                </p>
              </div>
            </div>

            {/* Assigned Groups Feed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiBookOpen className="text-slate-400" size={12} />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Assigned Cohorts
                </h4>
              </div>
              <div className="space-y-2">
                {detail?.assignedGroups && detail.assignedGroups?.length > 0 ? (
                  detail.assignedGroups?.map((group) => (
                    <div
                      key={group._id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all"
                    >
                      <div>
                        <p className="text-[11px] font-black text-slate-700">
                          {group.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                          SEM {group.semester} | {group.department}
                        </p>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          group.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {group.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      No Active Assignments
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tactical Actions Section */}
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={onDelete}
                disabled={actionStatus === "loading"}
                className="w-full h-10 rounded-xl bg-white border border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FiTrash2 size={12} /> Critical: Revoke Access
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDetailDrawer;
