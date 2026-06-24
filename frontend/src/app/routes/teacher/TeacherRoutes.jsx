import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import RoleRoute from "../RoleRoute.jsx";
import RouteFallback from "../../../components/ui/RouteFallback.jsx";

const TeacherDashboard = lazy(
  () => import("../../../features/teacher/pages/TeacherDashboard.jsx"),
);
const TeacherGroupsPage = lazy(
  () => import("../../../features/teacher/pages/TeacherGroupsPage.jsx"),
);
const TeacherProjectsPage = lazy(
  () => import("../../../features/teacher/pages/TeacherProjectsPage.jsx"),
);
const TeacherMeetingsPage = lazy(
  () => import("../../../features/teacher/pages/TeacherMeetingsPage.jsx"),
);
const TeacherDeadlinesPage = lazy(
  () => import("../../../features/teacher/pages/TeacherDeadlinesPage.jsx"),
);
const TeacherNotificationsPage = lazy(
  () => import("../../../features/teacher/pages/TeacherNotificationsPage.jsx"),
);
const TeacherProfilePage = lazy(
  () => import("../../../features/teacher/pages/TeacherProfilePage.jsx"),
);
const TeacherEvaluationPage = lazy(
  () => import("../../../features/teacher/pages/TeacherEvaluationPage.jsx"),
);
const TeacherGradingRubricPage = lazy(
  () => import("../../../features/teacher/pages/TeacherGradingRubricPage.jsx"),
);
const TemporalChronologyPage = lazy(
  () => import("../../../features/calendar/pages/TemporalChronologyPage.jsx"),
);
const TeacherAnnouncementsPage = lazy(
  () => import("../../../features/teacher/pages/TeacherAnnouncementsPage.jsx"),
);

const renderLazy = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

export const teacherRoutes = (
  <Route element={<RoleRoute allowedRoles={["teacher"]} />}>
    <Route path="/teacher" element={renderLazy(TeacherDashboard)} />
    <Route path="/teacher/groups" element={renderLazy(TeacherGroupsPage)} />
    <Route
      path="/teacher/projects"
      element={renderLazy(TeacherProjectsPage)}
    />
    <Route
      path="/teacher/projects/:projectId/evaluation"
      element={renderLazy(TeacherEvaluationPage)}
    />
    <Route
      path="/teacher/meetings"
      element={renderLazy(TeacherMeetingsPage)}
    />
    <Route
      path="/teacher/deadlines"
      element={renderLazy(TeacherDeadlinesPage)}
    />
    <Route
      path="/teacher/notifications"
      element={renderLazy(TeacherNotificationsPage)}
    />
    <Route path="/teacher/profile" element={renderLazy(TeacherProfilePage)} />
    <Route path="/teacher/grading-rubric" element={renderLazy(TeacherGradingRubricPage)} />
    <Route path="/teacher/calendar" element={renderLazy(TemporalChronologyPage)} />
    <Route path="/teacher/announcements" element={renderLazy(TeacherAnnouncementsPage)} />
  </Route>
);