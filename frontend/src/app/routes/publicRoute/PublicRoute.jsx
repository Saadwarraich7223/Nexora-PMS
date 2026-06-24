import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useRef } from "react";

const PublicRoute = ({ children }) => {
  const { user, status } = useSelector((state) => state.auth);

  // Track whether we've completed the *initial* session check.
  // Once status leaves "idle"/"loading" for the first time, we're initialized.
  const initializedRef = useRef(false);
  if (status !== "idle" && status !== "loading") {
    initializedRef.current = true;
  }

  // Only show full-screen loader on the very first app load (session check),
  // NOT on subsequent login/register submissions which have their own inline states.
  if (!initializedRef.current && (status === "idle" || status === "loading")) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg animate-bounce text-xl font-bold">
          N
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse tracking-wide">Authenticating...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

export default PublicRoute;
