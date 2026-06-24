import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { showError, showSuccess } from "../../../components/ui/toast.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import { FiMail, FiLock, FiUser, FiHash } from "react-icons/fi";
import authApi from "../../../services/api/authApi.js";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    registrationNumber: "",
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authApi.register(form);
      showSuccess("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Registration failed. Try again.";
      setError(msg);
      showError(msg);
      // Intentionally NOT clearing form -- user can correct and resubmit
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the project workspace platform"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Inputs */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              Registration Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <FiHash className="w-4 h-4" />
              </div>
              <input
                className="w-full pl-11 pr-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
                type="text"
                name="registrationNumber"
                value={form.registrationNumber}
                onChange={handleChange}
                placeholder="20-ARID-105"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <FiUser className="w-4 h-4" />
              </div>
              <input
                className="w-full pl-11 pr-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

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
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              Password
            </label>
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
                placeholder="Min. 6 characters"
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
            <p className="text-xs text-rose-600 font-medium text-center">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-1 inline-flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Register"}
        </button>

        <p className="text-center text-xs text-slate-500 mt-2">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
