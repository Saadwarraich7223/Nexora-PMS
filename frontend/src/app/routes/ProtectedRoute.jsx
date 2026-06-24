import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const { user, status } = useSelector((state) => state.auth);

  if (status === "loading" || status === "idle") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg animate-bounce text-xl font-bold">
          N
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse tracking-wide">Loading workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
