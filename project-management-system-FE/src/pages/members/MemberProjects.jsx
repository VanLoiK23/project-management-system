import React, { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axios.customize";
import {
  Search,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  PauseCircle,
  Clock3,
  CalendarDays,
  Users,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";
import getInitials from "../../components/get-avatar-name";

const STATUS_LABEL = {
  PLANNING: "Kế hoạch",
  IN_PROGRESS: "Đang thực hiện",
  ON_HOLD: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
};

const STATUS_BADGE = {
  PLANNING: "bg-slate-100 text-slate-700 ring-slate-500/20",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
  ON_HOLD: "bg-amber-100 text-amber-700 ring-amber-500/20",
  COMPLETED: "bg-blue-100 text-blue-700 ring-blue-500/20",
  CLOSED: "bg-violet-100 text-violet-700 ring-violet-500/20",
  CANCELLED: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const ROLE_LABEL = {
  PM: "Project Manager",
  DEV: "Developer",
  TESTER: "Tester",
  BA: "Business Analyst",
  DESIGNER: "Designer",
  OTHER: "Thành viên",
  MEMBER: "Thành viên",
};

const apiGetMemberProjects = (params = {}) =>
  axios
    .get("/projects/member", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 6,
        keyword: params.keyword ?? "",
        status: params.status || null,
        role: params.role || null,
        sortBy: params.sortBy ?? "joinedAt",
        direction: params.direction ?? "desc",
      },
    })
    .then((res) => res.data);

const apiGetProject = (projectId) =>
  axios.get(`/projects/${projectId}`).then((res) => res.data);

const apiGetProjectMembers = (projectId, params = {}) =>
  axios
    .get(`/projects/${projectId}/members`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        keyword: params.keyword ?? "",
        role: params.role || null,
        status: params.status || null,
        sortBy: params.sortBy ?? "user.fullName",
        direction: params.direction ?? "asc",
      },
    })
    .then((res) => res.data);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("vi-VN");
};

const getProgress = (project) => {
  if (project.progress !== undefined && project.progress !== null) {
    return Math.min(100, Math.max(0, Number(project.progress)));
  }

  switch (project.status) {
    case "COMPLETED":
    case "CLOSED":
      return 100;

    case "IN_PROGRESS":
      return 50;

    case "ON_HOLD":
      return 35;

    case "PLANNING":
      return 0;

    default:
      return 0;
  }
};

function StatCard({ icon: Icon, title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
          <Icon size={21} className="text-slate-600" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROJECT CARD
========================================================= */

function ProjectCard({ project, onView }) {
  const progress = getProgress(project);

  const memberRole = project.memberRole || project.myRole || project.role;

  const members =
    project.memberCount ?? project.totalMembers ?? project.members?.length ?? 0;

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Header */}
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <FolderKanban size={21} className="text-indigo-600" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-900">
                {project.name}
              </h3>

              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                {project.description || "Chưa có mô tả dự án"}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              STATUS_BADGE[project.status] || "bg-slate-100 text-slate-700"
            }`}
          >
            {STATUS_LABEL[project.status] || project.status}
          </span>
        </div>
      </div>

      {/* Information */}
      <div className="space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <UserRound size={14} />
              Project Manager
            </div>

            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
              {project.projectManagerName || project.pmName || "Chưa xác định"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users size={14} />
              Thành viên
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {members}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays size={16} />

          <span>{formatDate(project.startDate)}</span>

          <span className="text-slate-300">→</span>

          <span>{formatDate(project.endDate)}</span>
        </div>

        {/* Progress */}
        <div className="pt-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tiến độ</span>

            <span className="text-xs font-bold text-slate-700">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* My role */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-400">Vai trò của bạn</p>

            <p className="mt-0.5 text-sm font-semibold text-slate-700">
              {ROLE_LABEL[memberRole] || memberRole || "Thành viên"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onView(project)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Eye size={15} />
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ hasFilter, onReset }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <FolderKanban size={28} className="text-slate-400" />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-800">
        {hasFilter
          ? "Không tìm thấy dự án phù hợp"
          : "Bạn chưa tham gia dự án nào"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {hasFilter
          ? "Thử thay đổi từ khóa hoặc bộ lọc để tìm dự án khác."
          : "Các dự án mà bạn được thêm vào sẽ xuất hiện tại đây."}
      </p>

      {hasFilter && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}

/* =========================================================
   PROJECT DETAIL MODAL
========================================================= */

function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;

  const progress = getProgress(project);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <FolderKanban size={23} className="text-indigo-600" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {project.name}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    STATUS_BADGE[project.status] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {STATUS_LABEL[project.status] || project.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Chi tiết dự án bạn đang tham gia
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Description */}
          <section>
            <h3 className="text-sm font-bold text-slate-900">Mô tả dự án</h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {project.description || "Dự án chưa có mô tả."}
            </p>
          </section>

          {/* General information */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Project Manager</p>

              <p className="mt-1 font-semibold text-slate-800">
                {project.projectManagerName ||
                  project.pmName ||
                  "Chưa xác định"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Vai trò của bạn</p>

              <p className="mt-1 font-semibold text-slate-800">
                {ROLE_LABEL[
                  project.memberRole || project.myRole || project.role
                ] ||
                  project.memberRole ||
                  "Thành viên"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Ngày bắt đầu</p>

              <p className="mt-1 font-semibold text-slate-800">
                {formatDate(project.startDate)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Ngày kết thúc</p>

              <p className="mt-1 font-semibold text-slate-800">
                {formatDate(project.endDate)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <section className="mt-6">
            <div className="flex justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Tiến độ dự án
              </h3>

              <span className="text-sm font-bold text-indigo-600">
                {progress}%
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </section>

          {/* Members */}
          {project.members && project.members.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Thành viên dự án
                </h3>

                <span className="text-xs text-slate-400">
                  {project.members.length} thành viên
                </span>
              </div>

              <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {project.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {getInitials(member.userFullName)}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {member.userFullName}
                        </p>

                        <p className="text-xs text-slate-400">{member.userEmail}</p>
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {ROLE_LABEL[member.role]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MemberProjects() {
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [page, setPage] = useState(0);

  const [size, setSize] = useState(6);

  const [keyword, setKeyword] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [status, setStatus] = useState("");

  const [role, setRole] = useState("");

  const [sortBy, setSortBy] = useState("joinedAt");

  const [direction, setDirection] = useState("desc");

  const [totalPages, setTotalPages] = useState(0);

  const [totalElements, setTotalElements] = useState(0);

  const [selectedProject, setSelectedProject] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiGetMemberProjects({
        page,
        size,
        keyword,
        status,
        role,
        sortBy: "joinedAt",
        direction: "desc",
      });

      setProjects(data.content || []);

      setTotalPages(data.totalPages || 0);

      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message || "Không thể tải danh sách dự án."
      );

      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [page, size, keyword, status, role, sortBy, direction]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(0);

    setKeyword(searchInput.trim());
  };

  /* =====================================================
     RESET
  ===================================================== */

  const resetFilters = () => {
    setSearchInput("");
    setKeyword("");
    setStatus("");
    setRole("");
    setSortBy("joinedAt");
    setDirection("desc");
    setPage(0);
  };

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadProjects();
    } finally {
      setRefreshing(false);
    }
  };

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {
    return {
      total: totalElements,

      inProgress: projects.filter((p) => p.status === "IN_PROGRESS").length,

      onHold: projects.filter((p) => p.status === "ON_HOLD").length,

      completed: projects.filter(
        (p) => p.status === "COMPLETED" || p.status === "CLOSED"
      ).length,
    };
  }, [projects, totalElements]);

  /* =====================================================
     ERROR
  ===================================================== */

  if (error && !projects.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-rose-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <AlertCircle size={26} className="text-rose-500" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Không thể tải dữ liệu
            </h2>

            <p className="mt-2 text-sm text-slate-500">{error}</p>

            <button
              type="button"
              onClick={loadProjects}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <RefreshCw size={16} />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <FolderKanban size={21} className="text-indigo-600" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Dự án tham gia
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Danh sách các dự án bạn đang tham gia và theo dõi tiến độ.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FolderKanban}
            title="Tổng dự án"
            value={stats.total}
            description="Dự án bạn tham gia"
          />

          <StatCard
            icon={CheckCircle2}
            title="Đang thực hiện"
            value={stats.inProgress}
            description="Đang được triển khai"
          />

          <StatCard
            icon={PauseCircle}
            title="Tạm dừng"
            value={stats.onHold}
            description="Đang tạm thời dừng"
          />

          <StatCard
            icon={Clock3}
            title="Hoàn thành"
            value={stats.completed}
            description="Đã hoàn thành / đóng"
          />
        </div>

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex min-w-0 flex-1">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tên hoặc mô tả dự án..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <button
                type="submit"
                className="ml-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tìm
              </button>
            </form>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">Tất cả trạng thái</option>

              <option value="PLANNING">Kế hoạch</option>

              <option value="IN_PROGRESS">Đang thực hiện</option>

              <option value="ON_HOLD">Tạm dừng</option>

              <option value="COMPLETED">Hoàn thành</option>

              <option value="CLOSED">Đã đóng</option>

              <option value="CANCELLED">Đã hủy</option>
            </select>

            {/* Role */}
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(0);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">Tất cả vai trò</option>

              <option value="DEV">Developer</option>

              <option value="TESTER">Tester</option>

              <option value="BA">Business Analyst</option>

              <option value="DESIGNER">Designer</option>

              <option value="OTHER">Thành viên khác</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}:${direction}`}
              onChange={(e) => {
                const [newSort, newDirection] = e.target.value.split(":");

                setSortBy(newSort);
                setDirection(newDirection);
                setPage(0);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="joinedAt:desc">Mới tham gia</option>

              <option value="joinedAt:asc">Cũ tham gia</option>

              <option value="name:asc">Tên A → Z</option>

              <option value="name:desc">Tên Z → A</option>

              <option value="startDate:asc">Ngày bắt đầu gần nhất</option>

              <option value="endDate:asc">Ngày kết thúc gần nhất</option>
            </select>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            hasFilter={!!keyword || !!status || !!role}
            onReset={resetFilters}
          />
        ) : (
          <>
            {/* =================================================
                PROJECT GRID
            ================================================= */}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={setSelectedProject}
                />
              ))}
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Hiển thị{" "}
                <span className="font-semibold text-slate-700">
                  {totalElements === 0 ? 0 : page * size + 1}–
                  {Math.min((page + 1) * size, totalElements)}
                </span>{" "}
                trong{" "}
                <span className="font-semibold text-slate-700">
                  {totalElements}
                </span>{" "}
                dự án
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-600 outline-none"
                >
                  <option value={6}>6 / trang</option>

                  <option value={10}>10 / trang</option>

                  <option value={20}>20 / trang</option>
                </select>

                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, index) => index
                  )
                    .slice(
                      Math.max(0, page - 2),
                      Math.min(totalPages, page + 3)
                    )
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                          pageNumber === page
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pageNumber + 1}
                      </button>
                    ))}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          DETAIL MODAL
      ===================================================== */}

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
