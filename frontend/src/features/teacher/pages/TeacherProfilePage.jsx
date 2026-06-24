import { useState } from "react";
import { useSelector } from "react-redux";
import DashboardShell from "../../../components/layout/DashboardShell.jsx";
import authApi from "../../../services/api/authApi.js";
import getErrorMessage from "../../../utils/error.js";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";

const TeacherProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!user) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.oldPassword || !form.newPassword) {
      showError("Old and new password are required.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showError("New password and confirmation do not match.");
      return;
    }

    setStatus("loading");
    try {
      await authApi.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setStatus("succeeded");
      showSuccess("Password updated successfully.");
    } catch (error) {
      setStatus("failed");
      showError(getErrorMessage(error, "Failed to change password."));
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        <div className="glass-card rounded-2xl px-5 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your account details and security.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-800">Account</h2>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2">
                <p className="text-[11px] text-slate-500">Name</p>
                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2">
                <p className="text-[11px] text-slate-500">Email</p>
                <p className="text-xs font-semibold text-slate-800">{user.email}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2">
                <p className="text-[11px] text-slate-500">Role</p>
                <p className="text-xs font-semibold capitalize text-slate-800">{user.role}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-800">Change Password</h2>
            <div className="mt-3 space-y-2">
              <input
                type="password"
                value={form.oldPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
                placeholder="Current password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
                disabled={status === "loading"}
              />
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="New password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
                disabled={status === "loading"}
              />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
                disabled={status === "loading"}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
};

export default TeacherProfilePage;
