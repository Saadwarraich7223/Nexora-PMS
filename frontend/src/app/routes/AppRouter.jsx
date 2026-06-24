import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { adminRoutes } from "./admin/AdminRoutes.jsx";
import { teacherRoutes } from "./teacher/TeacherRoutes.jsx";
import { studentRoutes } from "./student/StudentRoutes.jsx";
import { useSelector } from "react-redux";
import PublicRoute from "./publicRoute/PublicRoute.jsx";
import RouteFallback from "../../components/ui/RouteFallback.jsx";

const LoginPage = lazy(() => import("../../features/auth/pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../../features/auth/pages/RegisterPage.jsx"));
const NotFound = lazy(() => import("../../components/ui/NotFound.jsx"));
const Forbidden = lazy(() => import("../../components/ui/Forbidden.jsx"));

const renderLazy = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

const AppRouter = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route
        path="/login"
        element={<PublicRoute>{renderLazy(LoginPage)}</PublicRoute>}
      />
      <Route
        path="/register"
        element={<PublicRoute>{renderLazy(RegisterPage)}</PublicRoute>}
      />
      <Route path="/forbidden" element={renderLazy(Forbidden)} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {adminRoutes}
        {teacherRoutes}
        {studentRoutes}
      </Route>

      <Route path="*" element={renderLazy(NotFound)} />
    </Routes>
  );
};

export default AppRouter;