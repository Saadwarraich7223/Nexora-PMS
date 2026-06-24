import { useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import "../studentTheme.css";

const StudentProfilePage = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  return (
    <DashboardShell>
      <div className="student-role space-y-4  mx-auto">
        {/* Header Hero Area */}
        <div className="glass-card student-gradient-hero student-glow rounded-2xl px-6 py-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-white/60 p-1 shadow-sm border border-white/50 shrink-0">
            <div className="h-full w-full rounded-full bg-indigo-100/50 flex items-center justify-center text-indigo-700 text-3xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
            <p className="student-text-muted mt-1 text-sm">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <span className="student-role-chip-member rounded-full px-3 py-1 text-[11px] font-semibold capitalize">
                {user.role}
              </span>
              <span className="student-chip rounded-full px-3 py-1 text-[11px] font-medium text-slate-600">
                User ID: {user._id?.substring(0, 8) || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Account Details Panel */}
          <div className="glass-card student-premium-card rounded-2xl px-5 py-5">
            <h2 className="text-sm font-semibold text-slate-800">
              Account Details
            </h2>
            <p className="student-text-muted mt-1 text-xs mb-4">
              Your registered platform information.
            </p>

            <div className="space-y-3">
              <div className="student-info-tile rounded-xl p-3 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Full Name</span>
                <span className="text-[11px] font-semibold text-slate-800">
                  {user.name}
                </span>
              </div>
              <div className="student-info-tile rounded-xl p-3 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Email Address
                </span>
                <span className="text-[11px] font-semibold text-slate-800">
                  {user.email}
                </span>
              </div>
              <div className="student-info-tile rounded-xl p-3 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Role</span>
                <span className="text-[11px] font-semibold text-slate-800 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Preferences Panel Placeholder */}
          <div className="glass-card student-premium-card rounded-2xl px-5 py-5">
            <h2 className="text-sm font-semibold text-slate-800">
              Preferences
            </h2>
            <p className="student-text-muted mt-1 text-xs mb-4">
              Manage your personal dashboard settings.
            </p>

            <div className="space-y-3">
              <div className="student-info-tile rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Email Notifications
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Receive alerts to your inbox
                  </p>
                </div>
                <div className="w-8 h-4 bg-indigo-500 rounded-full flex items-center p-0.5 shadow-inner">
                  <div className="w-3 h-3 bg-white rounded-full shadow translate-x-4 transition-transform"></div>
                </div>
              </div>

              <div className="student-info-tile rounded-xl p-3 flex justify-between items-center opacity-70 cursor-not-allowed">
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Dark Mode
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Premium styling currently disabled
                  </p>
                </div>
                <div className="w-8 h-4 bg-slate-300 rounded-full flex items-center p-0.5 shadow-inner">
                  <div className="w-3 h-3 bg-white rounded-full shadow transition-transform"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StudentProfilePage;
