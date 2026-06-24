import LoadingSkeleton from "../../../components/ui/LoadingSkeleton.jsx";

const StatsCards = ({ stats, status }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {stats.map((stat) => (
      <div key={stat.label} className="glass-card p-4 border-l-4 border-indigo-500 hover:shadow-lg transition-all">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
        <div className="flex items-baseline gap-2">
          {status === "loading" ? (
            <LoadingSkeleton className="h-8 w-16 rounded-lg" />
          ) : (
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stat.value}
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-400">{stat.sub}</span>
        </div>
      </div>
    ))}
  </div>
);

export default StatsCards;
