import { FiSend, FiPlus, FiSearch, FiMail, FiCheckSquare, FiLogOut, FiArrowRight } from "react-icons/fi";

const ActionButton = ({ title, subtitle, icon: Icon, onClick, color, bg }) => (
  <button
    onClick={onClick}
    className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-all group shadow-sm flex items-start gap-4 text-left"
  >
    <div className={`h-10 w-10 shrink-0 rounded-xl ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
        {title} <FiArrowRight className="h-3 w-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
      </p>
      <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{subtitle}</p>
    </div>
  </button>
);

const GroupActionCenterPanel = ({ group, isLeader, invitesCount, joinRequestsCount, onAction }) => (
  <div className="flex flex-col overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl h-full hover:shadow-md transition-all group">
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
      <div className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
        <FiSend className="text-indigo-600" />
        <h2>Action Strategy Hub</h2>
      </div>
    </div>

    <div className="p-4 grid gap-3">
      {!group && (
        <>
          <ActionButton
            title="Initialize Group"
            subtitle="Establish a new project cohort"
            icon={FiPlus}
            onClick={() => onAction("create")}
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          <ActionButton
            title="Browse Directory"
            subtitle="Search for existing collectives"
            icon={FiSearch}
            onClick={() => onAction("browse")}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </>
      )}

      {group && isLeader && (
        <>
          <ActionButton
            title="Recruit Talent"
            subtitle="Send invitations to fellows"
            icon={FiMail}
            onClick={() => onAction("invite")}
            color="text-sky-600"
            bg="bg-sky-50"
          />
          <ActionButton
            title="Protocol Approval"
            subtitle="Submit group for review"
            icon={FiCheckSquare}
            onClick={() => onAction("submit")}
            color="text-rose-600"
            bg="bg-rose-50"
          />
          <div className="px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
             <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                {joinRequestsCount} Pending Requests
             </p>
          </div>
        </>
      )}

      {group && !isLeader && (
        <>
          <ActionButton
             title="Exit Collective"
             subtitle="Resign from current group"
             icon={FiLogOut}
             onClick={() => onAction("leave")}
             color="text-slate-600"
             bg="bg-slate-50"
          />
          <div className="px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
             <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                {invitesCount} Received Invites
             </p>
          </div>
        </>
      )}
    </div>
  </div>
);

export default GroupActionCenterPanel;
