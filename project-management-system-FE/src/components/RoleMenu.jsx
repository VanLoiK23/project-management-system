import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  ShieldAlert,
  ClipboardList,
} from "lucide-react";

const roleMenus = {
  ADMIN: [
    {
      label: "Tổng quan Hệ thống",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    { label: "Quản lý Người dùng", icon: Users, path: "/admin/users" },
    { label: "Tất cả Dự án", icon: FolderKanban, path: "/admin/projects" },
    { label: "Phân quyền", icon: ShieldAlert, path: "/admin/roles" },
    { label: "Cài đặt Hệ thống", icon: Settings, path: "/admin/settings" },
  ],
  PM: [
    { label: "Tổng quan", icon: LayoutDashboard, path: "/pm/dashboard" },
    { label: "Dự án của tôi", icon: FolderKanban, path: "/pm/projects" },
    { label: "Quản lý Công việc", icon: CheckSquare, path: "/pm/tasks" },
    { label: "Quản lý tiến độ", icon: CheckSquare, path: "/pm/progress" },
    { label: "Thành viên Team", icon: Users, path: "/pm/team" },
    { label: "Báo cáo", icon: ClipboardList, path: "/pm/reports" },
  ],
  MEMBER: [
    { label: "Công việc của tôi", icon: CheckSquare, path: "/member/tasks" },
    { label: "Dự án tham gia", icon: FolderKanban, path: "/member/projects" },
    { label: "Báo cáo tiến độ", icon: ClipboardList, path: "/member/reports" },
    { label: "Tiến độ dự án", icon: ClipboardList, path: "/member/progress" },
  ],
};

export default roleMenus;
