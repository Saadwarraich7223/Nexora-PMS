import { toast } from "react-hot-toast";

const baseClass =
  "glass-card flex w-full max-w-sm items-center justify-between gap-3 px-4 py-3 text-xs shadow-lg";

const variantStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-slate-200 bg-white/80 text-slate-700",
};

const renderToast = (t, message, variant) => (
  <div
    className={`${baseClass} ${variantStyles[variant] || variantStyles.info}`}
  >
    <div className="flex items-start justify-center gap-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-current opacity-70" />
      <div className="text-[11px] font-semibold">{message}</div>
    </div>
    <button
      onClick={() => toast.dismiss(t.id)}
      className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
    >
      Close
    </button>
  </div>
);

const showToast = (message, variant = "success") =>
  toast.custom((t) => renderToast(t, message, variant), {
    duration: variant === "error" ? 2000 : 2000,
  });

const showSuccess = (message) => showToast(message, "success");
const showError = (message) => showToast(message, "error");
const showInfo = (message) => showToast(message, "info");

export { showToast, showSuccess, showError, showInfo };
