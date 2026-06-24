import { useEffect, useState } from "react";
import { FiAward, FiLoader, FiPieChart, FiBarChart2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import adminApi from "../api/adminApi.js";
import getErrorMessage from "../../../utils/error.js";

const EvaluationStatsPanel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await adminApi.fetchEvaluationStats();
        if (active) setStats(res.stats);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load evaluation stats"));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchStats();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5 flex items-center justify-center h-40">
        <FiLoader className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-5 bg-rose-50/50">
        <p className="text-xs text-rose-600">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const totalEvaluated = stats.published + stats.drafts;
  const progressPercent = (stats.published + stats.pending) > 0 
    ? Math.round((stats.published / (stats.published + stats.pending)) * 100) 
    : 0;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FiAward className="text-amber-500" />
            Evaluation Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            System-wide grading and evaluation metrics.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/evaluations")}
          className="text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
        >
          <FiBarChart2 />
          Full Analytics
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg Score</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-slate-800">{stats.avgScore}</p>
            <span className="text-[10px] text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Published</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.published}</p>
        </div>

        <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Drafts</p>
          <p className="text-2xl font-bold text-amber-700">{stats.drafts}</p>
        </div>

        <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100">
          <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-bold text-rose-700">{stats.pending}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 relative z-10">
        <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-2">
          <span>Grading Progress</span>
          <span className="text-emerald-600">{progressPercent}% Published</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500" style={{ width: `${progressPercent}%` }} title="Published"></div>
          <div className="h-full bg-amber-400" style={{ width: `${stats.published + stats.pending > 0 ? (stats.drafts / (stats.published + stats.pending)) * 100 : 0}%` }} title="Drafts"></div>
        </div>
        <div className="mt-2 flex gap-4 text-[9px] text-slate-500">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Published</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Draft</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Pending</div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationStatsPanel;
