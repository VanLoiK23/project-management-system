import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FolderKanban,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  UserPlus,
  PlusCircle,
  Briefcase,
  Lock,
  Unlock,
  Building2,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import axios from "../../utils/axios.customize";

const ROLE_LABEL = {
  ADMIN: "Quản trị viên",
  PM: "Quản lý dự án",
  MEMBER: "Thành viên",
};

const ROLE_COLORS = {
  ADMIN: "#8b5cf6", // Violet
  PM: "#3b82f6",    // Blue
  MEMBER: "#10b981", // Emerald
};

const STATUS_PROJECT_CONFIG = {
  PLANNING: { label: "Lập kế hoạch", color: "#f59e0b", bg: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "#3b82f6", bg: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  ON_HOLD: { label: "Tạm dừng", color: "#8b5cf6", bg: "bg-purple-50 text-purple-700 ring-purple-600/20" },
  COMPLETED: { label: "Hoàn thành", color: "#10b981", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  CLOSED: { label: "Đã đóng", color: "#64748b", bg: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  CANCELLED: { label: "Đã hủy", color: "#ef4444", bg: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [usersRes, projectsRes] = await Promise.all([
        axios.get("/users", { params: { page: 0, size: 100 } }),
        axios.get("/projects/admin", { params: { page: 0, size: 100 } }),
      ]);

      const userList = usersRes?.data?.content || [];
      const projectList = projectsRes?.data?.content || [];

      setUsers(userList);
      setProjects(projectList);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Thống kê người dùng
  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const locked = users.filter((u) => u.status === "LOCKED").length;
    const pmCount = users.filter((u) => u.role === "PM").length;
    const memberCount = users.filter((u) => u.role === "MEMBER").length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;

    return { total, active, locked, pmCount, memberCount, adminCount };
  }, [users]);

  // Thống kê dự án
  const projectStats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter((p) => p.status === "IN_PROGRESS").length;
    const planning = projects.filter((p) => p.status === "PLANNING").length;
    const completed = projects.filter((p) => p.status === "COMPLETED" || p.status === "CLOSED").length;
    const other = total - inProgress - planning - completed;

    return { total, inProgress, planning, completed, other };
  }, [projects]);

  // Dữ liệu biểu đồ trạng thái dự án
  const projectChartData = useMemo(() => {
    const counts = {};
    Object.keys(STATUS_PROJECT_CONFIG).forEach((k) => (counts[k] = 0));
    projects.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return Object.entries(counts).map(([key, val]) => ({
      name: STATUS_PROJECT_CONFIG[key].label,
      key,
      count: val,
      color: STATUS_PROJECT_CONFIG[key].color,
    }));
  }, [projects]);

  // Dữ liệu biểu đồ vai trò người dùng
  const roleChartData = useMemo(() => {
    return [
      { name: "Quản trị viên (Admin)", value: userStats.adminCount, color: ROLE_COLORS.ADMIN },
      { name: "Quản lý dự án (PM)", value: userStats.pmCount, color: ROLE_COLORS.PM },
      { name: "Thành viên (Member)", value: userStats.memberCount, color: ROLE_COLORS.MEMBER },
    ].filter((item) => item.value > 0);
  }, [userStats]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [projects]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [users]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Tổng quan Hệ thống
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Theo dõi tài khoản người dùng, tiến độ các dự án và tình trạng vận hành hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Đang đồng bộ..." : "Làm mới dữ liệu"}
            </button>
          </div>
        </div>

        {/* Trang trí nền */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-navy-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng người dùng */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {userStats.active} hoạt động
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Tổng người dùng</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? "..." : userStats.total}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Đang hoạt động: <strong className="text-emerald-600">{userStats.active}</strong></span>
              <span>Bị khóa: <strong className="text-rose-500">{userStats.locked}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Quản lý dự án (PM) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck size={24} />
            </div>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
              Quản lý
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Project Managers (PM)</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? "..." : userStats.pmCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Đảm nhiệm điều hành và quản lý tiến độ dự án
            </p>
          </div>
        </div>

        {/* Card 3: Thành viên (Member) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={24} />
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Thành viên
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Thành viên (Member)</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? "..." : userStats.memberCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Kỹ sư, lập trình viên, tester thực thi dự án
            </p>
          </div>
        </div>

        {/* Card 4: Tổng dự án */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FolderKanban size={24} />
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {projectStats.inProgress} đang chạy
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Tổng số Dự án</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? "..." : projectStats.total}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Đang chạy: <strong className="text-blue-600">{projectStats.inProgress}</strong></span>
              <span>Hoàn thành: <strong className="text-emerald-600">{projectStats.completed}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Biểu đồ 1: Tình trạng dự án */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Trạng thái các Dự án</h2>
              <p className="text-xs text-slate-500">Phân bố dự án theo các giai đoạn phát triển</p>
            </div>
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-navy-800"
            >
              Xem chi tiết <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => [`${value} dự án`, "Số lượng"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {projectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ 2: Cơ cấu vai trò người dùng */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Phân bổ Vai trò</h2>
              <p className="text-xs text-slate-500">Tỷ lệ các nhóm người dùng</p>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-navy-800"
            >
              Quản lý <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} người dùng`, name]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-2 border-t border-slate-100 pt-3">
            {roleChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLES SECTION: RECENT PROJECTS & RECENT USERS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bảng: Dự án mới nhất */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="font-bold text-slate-900">Dự án mới cập nhật</h3>
              <p className="text-xs text-slate-500">Các dự án được tạo hoặc có hoạt động gần đây</p>
            </div>
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Tất cả dự án <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Tên dự án</th>
                  <th className="px-5 py-3">Quản lý (PM)</th>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentProjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                      Chưa có dự án nào
                    </td>
                  </tr>
                ) : (
                  recentProjects.map((p) => {
                    const statusConf = STATUS_PROJECT_CONFIG[p.status] || STATUS_PROJECT_CONFIG.PLANNING;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {p.name}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {p.projectManager?.fullName || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {formatDate(p.startDate)} - {formatDate(p.endDate)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusConf.bg}`}
                          >
                            {statusConf.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng: Người dùng mới nhất */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="font-bold text-slate-900">Người dùng mới</h3>
              <p className="text-xs text-slate-500">Thành viên vừa tham gia hoặc được tạo</p>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Xem danh sách <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Họ và tên</th>
                  <th className="px-5 py-3">Vai trò</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                      Chưa có người dùng nào
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => {
                    const isLocked = u.status === "LOCKED";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800">{u.fullName}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <span
                            className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: `${ROLE_COLORS[u.role] || "#94a3b8"}15`,
                              color: ROLE_COLORS[u.role] || "#475569",
                            }}
                          >
                            {ROLE_LABEL[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              isLocked
                                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isLocked ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                            />
                            {isLocked ? "Đã khóa" : "Hoạt động"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-slate-500">
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
