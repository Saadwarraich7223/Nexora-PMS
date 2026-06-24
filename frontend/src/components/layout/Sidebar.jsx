import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { showError, showSuccess } from "../ui/toast";
import {
  FiGrid,
  FiClock,
  FiCheckSquare,
  FiLayout,
  FiUsers,
  FiVideo,
  FiSettings,
  FiLogOut,
  FiAward,
  FiCalendar,
  FiBell,
  FiPenTool,
  FiPieChart,
} from "react-icons/fi";

const ICONS = {
  grid: <FiGrid className="w-4 h-4" />,
  clock: <FiClock className="w-4 h-4" />,
  list: <FiCheckSquare className="w-4 h-4" />,
  rows: <FiLayout className="w-4 h-4" />,
  users: <FiUsers className="w-4 h-4" />,
  apps: <FiVideo className="w-4 h-4" />,
  settings: <FiSettings className="w-4 h-4" />,
  menu: <FiLogOut className="w-4 h-4 ml-0.5" />,
  canvas: <FiPenTool className="w-4 h-4" />,
  pie: <FiPieChart className="w-4 h-4" />,
  award: <FiAward className="w-4 h-4" />,
  calendar: <FiCalendar className="w-4 h-4" />,
  bell: <FiBell className="w-4 h-4" />,
};

const ROLE_NAV = {
  admin: [
    { path: "/admin", icon: "grid" },
    { path: "/admin/faculty", icon: "users" },
    { path: "/admin/groups", icon: "list" },
    { path: "/admin/students", icon: "rows" },
    { path: "/admin/announcements", icon: "clock" },
    { path: "/admin/evaluations", icon: "award" },
    { path: "/admin/calendar", icon: "calendar" },
  ],
  teacher: [
    { path: "/teacher", icon: "grid" },
    { path: "/teacher/groups", icon: "users" },
    { path: "/teacher/projects", icon: "list" },
    { path: "/teacher/meetings", icon: "apps" },
    { path: "/teacher/deadlines", icon: "clock" },
    { path: "/teacher/notifications", icon: "bell" },
    { path: "/teacher/grading-rubric", icon: "pie" },
    { path: "/teacher/calendar", icon: "calendar" },
  ],
  student: [
    { path: "/student", icon: "grid" },
    { path: "/student/deadlines", icon: "clock" },
    { path: "/student/meetings", icon: "apps" },
    { path: "/student/projects", icon: "rows" },
    { path: "/student/groups", icon: "users" },
    { path: "/student/tasks", icon: "list" },
    { path: "/student/canvas", icon: "canvas" },
    { path: "/student/calendar", icon: "calendar" },
  ],
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const role = user?.role || "student";
  const navItems = ROLE_NAV[role] || ROLE_NAV.student;

  const handleLogout = async () => {
    try {
      const res = await dispatch(logout());
      console.log(res);
      showSuccess("Logged out successfully");
    } catch (error) {
      console.log(error);
      showError("Problem while logging out");
    }
  };

  return (
    <aside className="flex h-full flex-col justify-between items-center py-6 custom-scrollbar w-12 group/sidebar transition-all duration-500">
      <div className="nav-panel-bg rounded-2xl flex w-full flex-col items-center gap-4 p-2 border-white/40 shadow-xl shadow-black/[0.02]">
        {navItems
          .filter((item) => item.icon !== "calendar" && item.icon !== "bell")
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}`}
              className={({ isActive }) =>
                `flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-500 relative group/nav ${
                  isActive
                    ? "text-[var(--role-accent)] bg-[var(--role-accent-soft)]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`transition-all duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_8px_var(--role-accent)]" : "group-hover/nav:scale-110"}`}
                  >
                    {ICONS[item.icon]}
                  </div>
                  {isActive && (
                    <div
                      className="absolute -left-1 w-1 h-4 rounded-full"
                      style={{
                        backgroundColor: "var(--role-accent)",
                        boxShadow: "0 0 12px var(--role-accent)",
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
      </div>

      <div className="nav-panel-bg rounded-2xl flex w-full flex-col items-center gap-2 p-1.5 border-white/40 shadow-xl shadow-black/[0.02]">
        <div className="h-8 w-8 rounded-xl bg-slate-900 border border-white/20 flex flex-col items-center justify-center text-[7px] font-black text-white uppercase tracking-tighter leading-none select-none">
          <span>{role.charAt(0)}</span>
          <div
            className="w-1 h-1 rounded-full mt-0.5"
            style={{ backgroundColor: "var(--role-accent)" }}
          ></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
