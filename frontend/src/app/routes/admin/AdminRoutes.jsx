import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import RoleRoute from "../RoleRoute.jsx";
import RouteFallback from "../../../components/ui/RouteFallback.jsx";

const AdminOverview = lazy(() => import("../../../features/admin/pages/AdminOverview.jsx"));
const FacultyPage = lazy(() => import("../../../features/admin/pages/FacultyPage.jsx"));
const GroupsPage = lazy(() => import("../../../features/admin/pages/GroupsPage.jsx"));
const StudentsPage = lazy(() => import("../../../features/admin/pages/StudentsPage.jsx"));
const AnnouncementsPage = lazy(
  () => import("../../../features/admin/pages/AnnouncementsPage.jsx"),
);
const AdminEvaluationsPage = lazy(
  () => import("../../../features/admin/pages/AdminEvaluationsPage.jsx"),
);
const TemporalChronologyPage = lazy(
  () => import("../../../features/calendar/pages/TemporalChronologyPage.jsx"),
);

const renderLazy = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

export const adminRoutes = (
  <Route element={<RoleRoute allowedRoles={["admin"]} />}>
    <Route path="/admin" element={renderLazy(AdminOverview)} />
    <Route path="/admin/faculty" element={renderLazy(FacultyPage)} />
    <Route path="/admin/groups" element={renderLazy(GroupsPage)} />
    <Route path="/admin/students" element={renderLazy(StudentsPage)} />
    <Route
      path="/admin/announcements"
      element={renderLazy(AnnouncementsPage)}
    />
    <Route path="/admin/evaluations" element={renderLazy(AdminEvaluationsPage)} />
    <Route path="/admin/calendar" element={renderLazy(TemporalChronologyPage)} />
  </Route>
);