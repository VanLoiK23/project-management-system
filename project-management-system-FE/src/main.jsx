import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthWrapper } from "./components/context/auth.context.jsx";
import AuthPage from "./pages/auth/AuthPage.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import NotFound from "./pages/error/NotFound";
import Forbidden from "./pages/error/Forbidden";
import ProtectedRoute from "./route/ProtectedRoute.jsx";
import RoleRoute from "./route/RoleRoute.jsx";

import ProjectDashboard from "./pages/pm/ProjectDashboard.jsx";
import Milestones from "./pages/pm/Milestones.jsx";
import Issues from "./pages/pm/Issues.jsx";
import Documents from "./pages/pm/Documents.jsx";
import PmDashboard from "./pages/pm/PmDashboard.jsx";
import PMTeam from "./pages/pm/PmTeam.jsx";
import ReportsPage from "./pages/pm/ReportsPage.jsx";
import TasksPage from "./pages/pm/TasksPage.jsx";
import AccountManagement from "./pages/admin/AccountManagement.jsx";
import AdminProjectManagement from "./pages/admin/AdminProjectManagement.jsx";
import MemberProjects from "./pages/members/MemberProjects.jsx";
import Progress from "./pages/pm/ProgressManagement.jsx";
import ProjectDetailPage from "./pages/pm/ProjectDetailPage.jsx";
import MemberTasks from "./pages/members/MemberTasks.jsx";
import MemberIssues from "./pages/members/MemberIssues.jsx";
import MemberDocuments from "./pages/members/Memberdocuments.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      // ================= ADMIN =================
      {
        path: "admin",
        element: (
          <RoleRoute allowedRoles={["ADMIN"]}>
            <Outlet />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <>{/* <AdminDashboard /> */}</> }, // Tổng quan Hệ thống
          { path: "users", element: <>{<AccountManagement />} </> }, // Quản lý Người dùng
          { path: "projects", element: <>{<AdminProjectManagement />}</> }, // Tất cả Dự án
          { path: "settings", element: <>{/* <AdminSettings /> */}</> }, // Cài đặt Hệ thống
        ],
      },

      // ================= PM (MANAGER) =================
      {
        path: "pm",
        element: (
          <RoleRoute allowedRoles={["PM"]}>
            <Outlet />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="projects" replace /> },
          { path: "dashboard", element: <PmDashboard /> },
          { path: "projects", element: <ProjectDashboard /> }, // (Module 2)
          { path: "projects/:projectId", element: <ProjectDetailPage isPm={true} /> },
          { path: "tasks", element: <TasksPage isPm={true} /> }, // (Module 4)
          { path: "progress", element: <Progress isPm={true} /> }, // (Module 5)
          { path: "milestones", element: <Milestones /> }, // (Module 6)
          { path: "issues", element: <Issues /> }, // (Module 7)
          { path: "documents", element: <Documents /> }, // (Module 8 & 10)
          { path: "team", element: <PMTeam /> }, // (Module 3)
          { path: "reports", element: <ReportsPage isPm={true} /> },
          { path: "notifications", element:<>{/* <ManageNotifications /> */}</> }, // Bổ sung: Gửi thông báo (Module 9)
        ],
      },

      // ================= MEMBER (USER) =================
      {
        path: "member",
        element: (
          <RoleRoute allowedRoles={["MEMBER"]}>
            <Outlet />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="projects" replace /> },
          { path: "projects", element: <MemberProjects /> }, // (Module 2)
          { path: "tasks", element: <MemberTasks /> }, // (Module 4)
          { path: "issues", element: <MemberIssues /> }, // (Module 7)
          { path: "documents", element: <MemberDocuments /> }, // (Module 8)
          
          { path: "reports", element: <ReportsPage isPm={false} /> }, // Báo cáo tiến độ
          { path: "projects/:projectId", element: <ProjectDetailPage isPm={false} /> },
        ],
      },
      { path: "notifications", element: <>{/* <MyNotifications /> */}</> }
    ],
  },

  // PUBLIC
  { path: "/auth", element: <AuthPage /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password/:token", element: <ResetPassword /> },
  { path: "/403", element: <Forbidden /> },
  { path: "*", element: <NotFound /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthWrapper>
      <ToastContainer position="top-right" autoClose={3000} />
      <RouterProvider router={router} />
    </AuthWrapper>
  </React.StrictMode>
);
