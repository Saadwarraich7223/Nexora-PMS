import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  FiGrid, 
  FiCalendar, 
  FiLogOut, 
  FiSearch,
  FiClock, 
  FiAward, 
  FiVideo, 
  FiPieChart, 
  FiPenTool 
} from "react-icons/fi";
import { logout } from "../../features/auth/authSlice";
import { showError, showSuccess } from "../ui/toast";
import NotificationDrawer from "../ui/NotificationDrawer.jsx";

const ROLE_TABS = {
  admin: [
    { name: "Alerts", path: "/admin/announcements", icon: <FiClock size={12} /> },
    { name: "Reviews", path: "/admin/evaluations", icon: <FiAward size={12} /> },
  ],
  teacher: [
    { name: "Sessions", path: "/teacher/meetings", icon: <FiVideo size={12} /> },
    { name: "Milestones", path: "/teacher/deadlines", icon: <FiClock size={12} /> },
    { name: "Analytics", path: "/teacher/grading-rubric", icon: <FiPieChart size={12} /> },
  ],
  student: [
    { name: "Milestones", path: "/student/deadlines", icon: <FiClock size={12} /> },
    { name: "Sessions", path: "/student/meetings", icon: <FiVideo size={12} /> },
    { name: "Sandbox", path: "/student/canvas", icon: <FiPenTool size={12} /> },
  ],
};

const TopNav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || "student";
  const tabs = ROLE_TABS[role] || [];

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      showSuccess("Logged out successfully");
    } catch (error) {
      showError("Problem while logging out");
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "ST";

  const handleSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-4">
        <div className="nav-panel-bg flex items-center gap-3 rounded-2xl px-4 py-2 text-[13px] font-black tracking-tighter text-slate-800 border-white/40 shadow-xl shadow-black/[0.01]">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-lg animate-pulse"
            style={{ backgroundColor: 'var(--role-accent)', boxShadow: '0 0 15px var(--role-accent)' }}
          >
            <FiGrid size={16} />
          </div>
          <div className="flex flex-col leading-tight pr-2 border-r border-slate-200/60">
            <span className="uppercase tracking-tighter">Nexora</span>
            <span className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-black">Strategic</span>
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{role}_Layer</span>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter mt-0.5">
               {new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Operational Tabs (Restored) */}
        <div className="nav-panel-bg hidden items-center gap-1 rounded-2xl px-2 py-2 border-white/40 shadow-xl shadow-black/[0.01] lg:flex">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                }`
              }
            >
              {tab.icon}
              <span>{tab.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="nav-panel-bg flex items-center gap-2 rounded-2xl px-2 py-2 border-white/40 shadow-xl shadow-black/[0.01]">
          {/* Minimal Search Trigger */}
          <button 
            onClick={handleSearch}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 transition-all group relative"
            title="Search Commands (Ctrl + K)"
          >
             <FiSearch size={16} className="group-hover:scale-110 transition-transform" />
             <div className="absolute -top-1 -right-1 h-3 px-1 rounded-full bg-slate-900 text-white text-[6px] font-black flex items-center justify-center border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                K
             </div>
          </button>

          <div className="w-px h-6 bg-slate-200/60 mx-1"></div>

          {/* Dynamic Calendar Orchestrator */}
          <button 
            onClick={() => navigate(`/${role}/calendar`)}
            className="relative h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 transition-all group"
            title="Calendar - View Events"
          >
            <FiCalendar size={18} className="group-hover:scale-110 transition-transform" />
            <div className="absolute top-1.5 right-1.5 h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--role-accent)' }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--role-accent)' }}></span>
            </div>
          </button>
          
          <div className="w-px h-6 bg-slate-200/60 mx-1"></div>
          
          <NotificationDrawer role={role} />
        </div>

        <div className="nav-panel-bg flex items-center gap-3 rounded-2xl px-3 py-2 border-white/40 shadow-xl shadow-black/[0.01]">
          <div className="flex flex-col items-end leading-tight">
             <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">
                {user?.name?.split(' ')[0] || 'User'}
             </span>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                Authorized
             </span>
          </div>
          
          <div className="relative group/profile">
            <button
              onClick={() => navigate(`/${role}/profile`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-lg transition-all hover:scale-110 cursor-pointer"
              style={{ backgroundColor: 'var(--role-accent)', boxShadow: '0 4px 12px var(--role-accent-soft)' }}
            >
              <span className="text-[10px] font-black uppercase tracking-tighter">{initials}</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/profile:opacity-100 transition-opacity border-2 border-white"
              title="Logout"
            >
              <FiLogOut size={8} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
