import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import RoleRoute from "../RoleRoute.jsx";
import RouteFallback from "../../../components/ui/RouteFallback.jsx";

const StudentDashboard = lazy(
  () => import("../../../features/student/pages/StudentDashboard.jsx"),
);
const StudentGroupsPage = lazy(
  () => import("../../../features/student/pages/StudentGroupsPage.jsx"),
);
const StudentTasksPage = lazy(
  () => import("../../../features/student/pages/StudentTasksPage.jsx"),
);
const StudentGradingRubricPage = lazy(
  () => import("../../../features/student/pages/StudentGradingRubricPage.jsx"),
);
const StudentProjectsPage = lazy(
  () => import("../../../features/student/pages/StudentProjectsPage.jsx"),
);
const StudentNotificationsPage = lazy(
  () => import("../../../features/student/pages/StudentNotificationsPage.jsx"),
);
const StudentDeadlinesPage = lazy(
  () => import("../../../features/student/pages/StudentDeadlinesPage.jsx"),
);
const StudentMeetingsPage = lazy(
  () => import("../../../features/student/pages/StudentMeetingsPage.jsx"),
);
const StudentProfilePage = lazy(
  () => import("../../../features/student/pages/StudentProfilePage.jsx"),
);
const StudentCanvasPage = lazy(
  () => import("../../../features/student/pages/StudentCanvasPage.jsx"),
);
const StudentEvaluationPage = lazy(
  () => import("../../../features/student/pages/StudentEvaluationPage.jsx"),
);
const TemporalChronologyPage = lazy(
  () => import("../../../features/calendar/pages/TemporalChronologyPage.jsx"),
);

const renderLazy = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

export const studentRoutes = (
  <Route element={<RoleRoute allowedRoles={["student"]} />}>
    <Route path="/student" element={renderLazy(StudentDashboard)} />
    <Route path="/student/groups" element={renderLazy(StudentGroupsPage)} />
    <Route path="/student/tasks" element={renderLazy(StudentTasksPage)} />
    <Route path="/student/grading-rubric" element={renderLazy(StudentGradingRubricPage)} />
    <Route
      path="/student/projects"
      element={renderLazy(StudentProjectsPage)}
    />
    <Route
      path="/student/projects/evaluation"
      element={renderLazy(StudentEvaluationPage)}
    />
    <Route
      path="/student/deadlines"
      element={renderLazy(StudentDeadlinesPage)}
    />
    <Route
      path="/student/meetings"
      element={renderLazy(StudentMeetingsPage)}
    />
    <Route
      path="/student/notifications"
      element={renderLazy(StudentNotificationsPage)}
    />
    <Route path="/student/profile" element={renderLazy(StudentProfilePage)} />
    <Route path="/student/canvas" element={renderLazy(StudentCanvasPage)} />
    <Route path="/student/calendar" element={renderLazy(TemporalChronologyPage)} />
  </Route>
);