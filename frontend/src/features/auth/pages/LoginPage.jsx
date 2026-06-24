import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { login } from "../authSlice.js";
import { useNavigate, Link } from "react-router-dom";
import {
  showError,
  showSuccess,
} from "../../../components/ui/toast.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import { FiMail, FiLock } from "react-icons/fi";

const ROLES = [
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "admin", label: "Admin" },
];

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "student",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (roleId) => {
    setForm((prev) => ({ ...prev, role: roleId }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(login(form));

    if (result.meta.requestStatus === "rejected") {
      showError(result.payload);
    }
    if (result.meta.requestStatus === "fulfilled") {
      showSuccess("Logged in successfully");
      navigate(`/${result.payload.role}`);
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your project workspace"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Role Pills */}
        <div className="flex p-1 bg-slate-100/80 rounded-full shadow-inner border border-slate-200/50">
          {ROLES.map((r) => {
            const isActive = form.role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white text-indigo-600 shadow shadow-black/5"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <FiMail className="w-4 h-4" />
              </div>
              <input
                className="w-full pl-11 pr-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <button type="button" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                Forgot?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                className="w-full pl-11 pr-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
            <p className="text-xs text-rose-600 font-medium text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-1 inline-flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Authenticating..." : "Sign in"}
        </button>

        <p className="text-center text-xs text-slate-500 mt-2">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
