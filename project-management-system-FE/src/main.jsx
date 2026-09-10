import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import './index.css'
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
import PmTeam from "./pages/pm/PmTeam.jsx";
import ReportsPage from "./pages/pm/ReportsPage.jsx";
import TasksPage from "./pages/pm/TasksPage.jsx";

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
          { path: "users", element: <>{/* <AdminUsers /> */}</> }, // Quản lý Người dùng
          { path: "projects", element: <>{/* <AdminProjects /> */}</> }, // Tất cả Dự án
          { path: "roles", element: <>{/* <AdminRoles /> */}</> }, // Phân quyền
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
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <PmDashboard /> }, // Tổng quan
          { path: "projects", element: <ProjectDashboard /> }, 
          { path: "tasks", element: <TasksPage isPm={true} /> }, // Quản lý Công việc
          { path: "milestones", element: <Milestones /> }, // Lịch trình
          { path: "issues", element: <Issues /> }, // Vấn đề / Lỗi
          { path: "documents", element: <Documents /> }, // Quản lý Tài liệu
          { path: "team", element: <PmTeam /> }, // Thành viên Team
          { path: "reports", element: <ReportsPage isPm={true} /> }, // Báo cáo
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
          { path: "tasks", element: <TasksPage isPm={false} /> }, // Công việc của tôi
          { path: "projects", element: <ProjectDashboard /> }, // Dự án tham gia
          { path: "issues", element: <Issues /> }, // Vấn đề / Lỗi
          { path: "documents", element: <Documents /> }, // Quản lý Tài liệu
          { path: "reports", element: <ReportsPage isPm={false} /> }, // Báo cáo tiến độ
        ],
      },
    ],
  },

  { path: "/projects", element: <>{<ProjectDashboard />}</> }, 

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
