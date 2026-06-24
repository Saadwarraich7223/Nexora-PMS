const ProjectStatusFilters = ({ options, value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-xl border px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm ${
            value === option.value
              ? "border-slate-900 bg-slate-900 text-white shadow-slate-200"
              : "border-slate-100 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ProjectStatusFilters;
