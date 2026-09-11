import { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axios.customize";

import {
  Search,
  RefreshCw,
  Users,
  FolderKanban,
  CircleCheck,
  LockKeyhole,
  PauseCircle,
  Clock3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  CircleX,
  SlidersHorizontal,
  ArrowUpDown,
  UserRound,
  LayoutList,
} from "lucide-react";
import getInitials from "../../components/get-avatar-name";
import { toast } from "react-toastify";

const STATUS_LABEL = {
  PLANNING: "Kế hoạch",
  IN_PROGRESS: "Đang thực hiện",
  ON_HOLD: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
};

const STATUS_STYLE = {
  PLANNING: {
    badge: "bg-slate-100 text-slate-700 ring-slate-500/20",
    dot: "bg-slate-500",
  },

  IN_PROGRESS: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
    dot: "bg-emerald-500",
  },

  ON_HOLD: {
    badge: "bg-amber-50 text-amber-700 ring-amber-500/20",
    dot: "bg-amber-500",
  },

  COMPLETED: {
    badge: "bg-blue-50 text-blue-700 ring-blue-500/20",
    dot: "bg-blue-500",
  },

  CLOSED: {
    badge: "bg-violet-50 text-violet-700 ring-violet-500/20",
    dot: "bg-violet-500",
  },

  CANCELLED: {
    badge: "bg-rose-50 text-rose-700 ring-rose-500/20",
    dot: "bg-rose-500",
  },
};

const STATUS_OPTIONS = [
  {
    value: "",
    label: "Tất cả trạng thái",
  },
  {
    value: "PLANNING",
    label: "Kế hoạch",
  },
  {
    value: "IN_PROGRESS",
    label: "Đang thực hiện",
  },
  {
    value: "ON_HOLD",
    label: "Tạm dừng",
  },
  {
    value: "COMPLETED",
    label: "Hoàn thành",
  },
  {
    value: "CLOSED",
    label: "Đã đóng",
  },
  {
    value: "CANCELLED",
    label: "Đã hủy",
  },
];

const SORT_OPTIONS = [
  {
    value: "createdAt",
    label: "Ngày tạo",
  },
  {
    value: "name",
    label: "Tên dự án",
  },
  {
    value: "startDate",
    label: "Ngày bắt đầu",
  },
  {
    value: "endDate",
    label: "Ngày kết thúc",
  },
];
const apiGetPMs = () => axios.get(`/users/pm`).then((res) => res.data);

const apiGetAdminProjects = (params) =>
  axios.get("/projects/admin", { params }).then((res) => res.data);

const apiGetProject = (id) =>
  axios.get(`/projects/${id}`).then((res) => res.data);

const apiCreateProject = (payload) =>
  axios.post("/projects", payload).then((res) => res.data);

const apiUpdateProject = (id, payload) =>
  axios.put(`/projects/${id}`, payload).then((res) => res.data);

const apiCloseProject = (id) =>
  axios.post(`/projects/${id}/close`).then((res) => res.data);

const apiDeleteProject = (id) =>
  axios.delete(`/projects/${id}`).then((res) => res.data);

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getProgress(project) {
  if (project?.progress != null) {
    return Math.min(100, Math.max(0, Number(project.progress)));
  }

  switch (project?.status) {
    case "PLANNING":
      return 0;

    case "COMPLETED":
    case "CLOSED":
      return 100;

    default:
      return 0;
  }
}

function getManagerName(project) {
  const managerName = project?.projectManagerName;

  return managerName || "Chưa có PM";
}

function getManagerEmail(project) {
  const managerEmail = project?.projectManagerEmail;

  return managerEmail || "";
}

function getMemberCount(project) {
  if (project?.memberCount != null) {
    return project.memberCount;
  }

  return 0;
}

export default function AdminProjectManagement() {
  const [projectManagers, setProjectManagers] = useState([]);

  const [projects, setProjects] = useState([]);

  const [totalElements, setTotalElements] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [keyword, setKeyword] = useState("");

  const [status, setStatus] = useState("");

  const [managerId, setManagerId] = useState("");

  const [startDateFrom, setStartDateFrom] = useState("");

  const [startDateTo, setStartDateTo] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");

  const [direction, setDirection] = useState("desc");

  const [showFilters, setShowFilters] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);

  const [showDetail, setShowDetail] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [showEdit, setShowEdit] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  const [showClose, setShowClose] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiGetAdminProjects({
        page,
        size,
        keyword: keyword.trim() || undefined,
        status: status || undefined,
        projectManagerId: managerId || undefined,
        startDateFrom: startDateFrom || undefined,
        startDateTo: startDateTo || undefined,
        sortBy,
        direction,
      });

      setProjects(response?.content || []);

      setTotalElements(response?.totalElements || 0);

      setTotalPages(response?.totalPages || 0);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách dự án."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [
    page,
    size,
    status,
    managerId,
    startDateFrom,
    startDateTo,
    sortBy,
    direction,
  ]);

  useEffect(() => {
    const getAllPMs = async () => {
      try {
        const response = await apiGetPMs();

        setProjectManagers(response || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Không thể tải danh sách PM.");
      }
    };

    getAllPMs();
  }, showFilters);

  const stats = useMemo(() => {
    return {
      total: totalElements || projects.length,

      active: projects.filter((project) => project.status === "IN_PROGRESS")
        .length,

      completed: projects.filter((project) => project.status === "COMPLETED")
        .length,

      closed: projects.filter((project) => project.status === "CLOSED").length,

      onHold: projects.filter((project) => project.status === "ON_HOLD").length,
    };
  }, [projects, totalElements]);



  const handleSearch = () => {
    setPage(0);
    loadProjects();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };


  const resetFilters = () => {
    setKeyword("");
    setStatus("");
    setManagerId("");
    setStartDateFrom("");
    setStartDateTo("");
    setSortBy("createdAt");
    setDirection("desc");
    setPage(0);
    setShowFilters(false);
  };



  const openDetail = async (project) => {
    try {
      setActionLoading(true);

      const detail = await apiGetProject(project.id);

      setSelectedProject(detail);
      setShowDetail(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải chi tiết dự án.");
    } finally {
      setActionLoading(false);
    }
  };



  const openCreateModal = () => {
    setForm({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    });

    setError("");
    setShowCreate(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Tên dự án không được để trống.";
    }

    if (!form.startDate) {
      return "Ngày bắt đầu không được để trống.";
    }

    if (!form.endDate) {
      return "Ngày kết thúc không được để trống.";
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      return "Ngày kết thúc phải lớn hơn hoặc " + "bằng ngày bắt đầu.";
    }

    return "";
  };

  const handleCreate = async () => {
    const validation = validateForm();

    if (validation) {
      setError(validation);
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await apiCreateProject({
        name: form.name.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        memberIds: [],
      });

      toast.success("Tạo dự án thành công !");
      setShowCreate(false);
      setPage(0);

      await loadProjects();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tạo dự án.");
      toast.error(err?.response?.data?.message || "Không thể tạo dự án.");
    } finally {
      setActionLoading(false);
    }
  };



  const openEditModal = (project) => {
    setSelectedProject(project);

    setForm({
      name: project.name || "",
      description: project.description || "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
    });

    setError("");
    setShowDetail(false);
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    const validation = validateForm();

    if (validation) {
      setError(validation);
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await apiUpdateProject(selectedProject.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      });

      toast.success("Cập nhật dự án thàn công!");
      setShowEdit(false);
      setSelectedProject(null);

      await loadProjects();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể cập nhật dự án.");
      toast.error(err?.response?.data?.message || "Không thể cập nhật dự án.");
    } finally {
      setActionLoading(false);
    }
  };

  const openCloseModal = (project) => {
    setSelectedProject(project);
    setShowDetail(false);
    setShowClose(true);
  };

  const handleCloseProject = async () => {
    try {
      setActionLoading(true);
      setError("");

      await apiCloseProject(selectedProject.id);

      toast.success("Đóng dự án thành công !");
      setShowClose(false);
      setSelectedProject(null);

      await loadProjects();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể đóng dự án.");
      toast.error(err?.response?.data?.message || "Không thể đóng dự án.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    setShowDetail(false);
    setShowDelete(true);
  };

  const handleDeleteProject = async () => {
    try {
      setActionLoading(true);
      setError("");

      await apiDeleteProject(selectedProject.id);

      toast.success("Xóa dự án thành công !");
      setShowDelete(false);
      setSelectedProject(null);

      await loadProjects();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể xóa dự án.");
      toast.error(err?.response?.data?.message || "Không thể xóa dự án.");
    } finally {
      setActionLoading(false);
    }
  };

  const activeFilterCount = [
    status,
    managerId,
    startDateFrom,
    startDateTo,
  ].filter(Boolean).length;



  const firstItem = totalElements === 0 ? 0 : page * size + 1;

  const lastItem = Math.min((page + 1) * size, totalElements);

  return (
    <div className="min-h-full bg-[#f8fafc] p-5 md:p-6">

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[25px] font-semibold tracking-tight text-[#17365d]">
            Quản lý dự án
          </h1>

          <p className="mt-1 text-[14px] text-[#7890ae]">
            Quản lý và theo dõi toàn bộ dự án trong hệ thống.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#17365d] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#102b4c]"
        >
          <Plus size={18} />
          Tạo dự án mới
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng dự án"
          value={stats.total}
          description="Tổng số dự án"
          icon={FolderKanban}
          iconWrapper="bg-[#eef4fb]"
          iconColor="text-[#55789e]"
        />

        <StatCard
          title="Đang thực hiện"
          value={stats.active}
          description="Dự án đang hoạt động"
          icon={CircleCheck}
          iconWrapper="bg-emerald-100"
          iconColor="text-emerald-600"
        />

        <StatCard
          title="Hoàn thành"
          value={stats.completed}
          description="Dự án đã hoàn thành"
          icon={CheckCircle2}
          iconWrapper="bg-blue-100"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Đã đóng"
          value={stats.closed}
          description="Dự án đã đóng"
          icon={LockKeyhole}
          iconWrapper="bg-violet-100"
          iconColor="text-violet-600"
        />
      </div>



      <div className="mb-5 rounded-2xl border border-[#dfe7f0] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 xl:flex-row">
          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ca2bc]"
            />

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm theo tên hoặc mô tả dự án..."
              className="h-[52px] w-full rounded-xl border border-[#dce5ef] bg-[#fbfcfe] pl-11 pr-4 text-[14px] text-[#334e68] outline-none transition placeholder:text-[#91a5bd] focus:border-[#91abc8] focus:bg-white focus:ring-2 focus:ring-[#dce8f5]"
            />
          </div>

          {/* STATUS */}

          <FilterSelect
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
            options={STATUS_OPTIONS}
            className="xl:w-[190px]"
          />

          {/* ADVANCED */}

          <button
            onClick={() => setShowFilters((value) => !value)}
            className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border px-4 text-[14px] font-medium transition xl:w-auto ${
              showFilters || activeFilterCount > 0
                ? "border-[#a9bfd8] bg-[#f2f7fc] text-[#345a82]"
                : "border-[#dce5ef] bg-white text-[#5e7692] hover:bg-[#f8fafc]"
            }`}
          >
            <SlidersHorizontal size={18} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#315d8b] px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`transition ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {/* REFRESH */}

          <button
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[#dce5ef] bg-white px-5 text-[14px] font-medium text-[#496783] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>


        {showFilters && (
          <div className="mt-4 border-t border-[#edf1f5] pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* PM */}

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#526b86]">
                  Quản lý dự án
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a5bd]"
                  />

                  <select
                    value={managerId}
                    onChange={(e) => {
                      setManagerId(e.target.value);
                      setPage(0);
                    }}
                    className="h-11 w-full appearance-none rounded-xl border border-[#dce5ef] bg-white pl-10 pr-9 text-[14px] text-[#526b86] outline-none focus:border-[#91abc8]"
                  >
                    <option value="">Tất cả PM</option>

                    {projectManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.fullName}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#91a5bd]"
                  />
                </div>
              </div>

              {/* FROM */}

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#526b86]">
                  Bắt đầu từ ngày
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a5bd]"
                  />

                  <input
                    type="date"
                    value={startDateFrom}
                    onChange={(e) => {
                      setStartDateFrom(e.target.value);
                      setPage(0);
                    }}
                    className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white pl-10 pr-3 text-[14px] text-[#526b86] outline-none focus:border-[#91abc8]"
                  />
                </div>
              </div>

              {/* TO */}

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#526b86]">
                  Đến ngày
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a5bd]"
                  />

                  <input
                    type="date"
                    min={startDateFrom || undefined}
                    value={startDateTo}
                    onChange={(e) => {
                      setStartDateTo(e.target.value);
                      setPage(0);
                    }}
                    className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white pl-10 pr-3 text-[14px] text-[#526b86] outline-none focus:border-[#91abc8]"
                  />
                </div>
              </div>

              {/* SORT */}

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#526b86]">
                  Sắp xếp
                </label>

                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <ArrowUpDown
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a5bd]"
                    />

                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setPage(0);
                      }}
                      className="h-11 w-full appearance-none rounded-xl border border-[#dce5ef] bg-white pl-10 pr-8 text-[14px] text-[#526b86] outline-none focus:border-[#91abc8]"
                    >
                      {SORT_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#91a5bd]"
                    />
                  </div>

                  <button
                    onClick={() =>
                      setDirection(direction === "desc" ? "asc" : "desc")
                    }
                    className="h-11 rounded-xl border border-[#dce5ef] px-3 text-[13px] font-medium text-[#526b86] hover:bg-[#f8fafc]"
                  >
                    {direction === "desc" ? "↓" : "↑"}
                  </button>
                </div>
              </div>
            </div>

            {/* ACTIVE FILTERS */}

            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-[#7890ae]">
                  Bộ lọc đang dùng:
                </span>

                {status && (
                  <FilterChip
                    label={STATUS_LABEL[status]}
                    onRemove={() => setStatus("")}
                  />
                )}

                {managerId && (
                  <FilterChip
                    label="Đã chọn PM"
                    onRemove={() => setManagerId("")}
                  />
                )}

                {startDateFrom && (
                  <FilterChip
                    label={`Từ ${formatDate(startDateFrom)}`}
                    onRemove={() => setStartDateFrom("")}
                  />
                )}

                {startDateTo && (
                  <FilterChip
                    label={`Đến ${formatDate(startDateTo)}`}
                    onRemove={() => setStartDateTo("")}
                  />
                )}

                <button
                  onClick={resetFilters}
                  className="ml-1 text-[13px] font-medium text-[#3d6791] hover:underline"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      <div className="overflow-hidden rounded-2xl border border-[#dfe7f0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead>
              <tr className="border-b border-[#dce5ef] bg-[#f8fafc]">
                <th className="px-6 py-4 text-left text-[12px] font-bold uppercase tracking-wide text-[#607995]">
                  DỰ ÁN
                </th>

                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wide text-[#607995]">
                  QUẢN LÝ
                </th>

                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wide text-[#607995]">
                  TRẠNG THÁI
                </th>

                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wide text-[#607995]">
                  TIẾN ĐỘ
                </th>

                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wide text-[#607995]">
                  THỜI GIAN
                </th>

                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wide text-[#607995]">
                  THÀNH VIÊN
                </th>

                <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wide text-[#607995]">
                  THAO TÁC
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf1f5]">
              {loading ? (
                <ProjectTableSkeleton />
              ) : projects.length === 0 ? (
                <ProjectEmptyState
                  hasFilter={keyword || activeFilterCount > 0}
                  onReset={resetFilters}
                />
              ) : (
                projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onView={() => openDetail(project)}
                    onEdit={() => openEditModal(project)}
                    onClose={() => openCloseModal(project)}
                    onDelete={() => openDeleteModal(project)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>


        <div className="flex flex-col gap-4 border-t border-[#e7edf3] px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-[14px] text-[#7890ae]">
            Hiển thị{" "}
            <span className="font-semibold text-[#405b77]">
              {firstItem}
              {"–"}
              {lastItem}
            </span>{" "}
            trong{" "}
            <span className="font-semibold text-[#405b77]">
              {totalElements}
            </span>{" "}
            dự án
          </div>

          <div className="flex items-center gap-2">
            {/* SIZE */}

            <div className="relative">
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="h-10 appearance-none rounded-xl border border-[#dce5ef] bg-white pl-3 pr-8 text-[13px] font-medium text-[#58718d] outline-none hover:bg-[#f8fafc]"
              >
                <option value={5}>5 / trang</option>

                <option value={10}>10 / trang</option>

                <option value={20}>20 / trang</option>

                <option value={50}>50 / trang</option>
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8da2b9]"
              />
            </div>

            {/* FIRST */}

            <PaginationButton
              disabled={page === 0 || totalPages === 0}
              onClick={() => setPage(0)}
            >
              <ChevronsLeft size={16} />
            </PaginationButton>

            {/* PREVIOUS */}

            <PaginationButton
              disabled={page === 0 || totalPages === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft size={16} />
            </PaginationButton>

            {/* PAGE NUMBERS */}

            <PageNumbers
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />

            {/* NEXT */}

            <PaginationButton
              disabled={totalPages === 0 || page >= totalPages - 1}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight size={16} />
            </PaginationButton>

            {/* LAST */}

            <PaginationButton
              disabled={totalPages === 0 || page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              <ChevronsRight size={16} />
            </PaginationButton>
          </div>
        </div>
      </div>

      {showDetail && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => {
            setShowDetail(false);
            setSelectedProject(null);
          }}
          onEdit={() => openEditModal(selectedProject)}
          onCloseProject={() => openCloseModal(selectedProject)}
          onDelete={() => openDeleteModal(selectedProject)}
        />
      )}


      {showCreate && (
        <ProjectFormModal
          title="Tạo dự án mới"
          subtitle="Tạo một dự án mới trong hệ thống."
          form={form}
          setForm={setForm}
          loading={actionLoading}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}


      {showEdit && selectedProject && (
        <ProjectFormModal
          title="Chỉnh sửa dự án"
          subtitle="Cập nhật thông tin dự án."
          form={form}
          setForm={setForm}
          loading={actionLoading}
          onClose={() => {
            setShowEdit(false);
            setSelectedProject(null);
          }}
          onSubmit={handleUpdate}
        />
      )}



      {showClose && selectedProject && (
        <ConfirmModal
          type="close"
          title="Đóng dự án?"
          description={
            <>
              Bạn có chắc chắn muốn đóng dự án
              <strong>{selectedProject.name}</strong>
              ?
              <br />
              <span className="mt-2 block text-[13px]">
                Sau khi đóng, dự án sẽ không thể tiếp tục chỉnh sửa.
              </span>
            </>
          }
          confirmText="Đóng dự án"
          loading={actionLoading}
          onClose={() => setShowClose(false)}
          onConfirm={handleCloseProject}
        />
      )}



      {showDelete && selectedProject && (
        <ConfirmModal
          type="delete"
          title="Xóa dự án?"
          description={
            <>
              Bạn đang thực hiện xóa dự án
              <strong>{selectedProject.name}</strong>
              .
              <br />
              <span className="mt-2 block text-[13px]">
                Dữ liệu liên quan có thể bị ảnh hưởng. Hành động này không thể
                hoàn tác.
              </span>
            </>
          }
          confirmText="Xóa dự án"
          loading={actionLoading}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteProject}
        />
      )}
    </div>
  );
}


function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconWrapper,
  iconColor,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe7f0] bg-white px-6 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[15px] font-medium text-[#607995]">{title}</p>

          <p className="mt-2 text-[30px] font-semibold leading-none text-[#071a33]">
            {value}
          </p>

          <p className="mt-3 text-[13px] text-[#8aa0b9]">{description}</p>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconWrapper}`}
        >
          <Icon size={27} strokeWidth={1.9} className={iconColor} />
        </div>
      </div>
    </div>
  );
}



function FilterSelect({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full appearance-none rounded-xl border border-[#dce5ef] bg-white px-4 pr-10 text-[14px] font-medium text-[#526b86] outline-none transition hover:bg-[#fbfcfe] focus:border-[#91abc8] focus:ring-2 focus:ring-[#e2ebf5]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={17}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7890ae]"
      />
    </div>
  );
}



function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e4f0] bg-[#f4f8fc] px-2.5 py-1.5 text-[12px] font-medium text-[#52708f]">
      {label}

      <button
        onClick={onRemove}
        className="rounded-full text-[#7890ae] hover:text-[#315d8b]"
      >
        <X size={13} />
      </button>
    </span>
  );
}


function ProjectRow({ project, onView, onEdit, onClose, onDelete }) {
  const statusStyle = STATUS_STYLE[project.status] || STATUS_STYLE.PLANNING;

  const progress = getProgress(project);

  const managerName = getManagerName(project);

  const managerEmail = getManagerEmail(project);

  const memberCount = getMemberCount(project);

  const canEdit = project.status !== "CLOSED" && project.status !== "CANCELLED";

  const canClose =
    project.status !== "CLOSED" && project.status !== "CANCELLED";

  const canDelete =
    project.status === "PLANNING" ||
    project.status === "CLOSED" ||
    project.status === "CANCELLED";

  return (
    <tr className="group transition hover:bg-[#fbfdff]">
      {/* PROJECT */}

      <td className="px-6 py-5">
        <button onClick={onView} className="text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4fa] text-[#55799e]">
              <FolderKanban size={19} />
            </div>

            <div className="min-w-0">
              <p className="max-w-[250px] truncate text-[14px] font-semibold text-[#243b53] transition group-hover:text-[#315d8b]">
                {project.name}
              </p>

              <p className="mt-1 max-w-[280px] truncate text-[12px] text-[#91a2b5]">
                {project.description || "Chưa có mô tả"}
              </p>
            </div>
          </div>
        </button>
      </td>

      {/* MANAGER */}

      <td className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf1f8] text-[13px] font-semibold text-[#476887]">
            {getInitials(managerName)}
          </div>

          <div className="min-w-0">
            <p className="max-w-[155px] truncate text-[13px] font-semibold text-[#405b77]">
              {managerName}
            </p>

            {managerEmail && (
              <p className="mt-0.5 max-w-[155px] truncate text-[11px] text-[#9aabbd]">
                {managerEmail}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* STATUS */}

      <td className="px-5 py-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ${statusStyle.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />

          {STATUS_LABEL[project.status]}
        </span>
      </td>

      {/* PROGRESS */}

      <td className="px-5 py-5">
        <div className="w-[130px]">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] text-[#91a2b5]">Tiến độ</span>

            <span className="text-[11px] font-semibold text-[#58718d]">
              {progress}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f7]">
            <div
              className="h-full rounded-full bg-[#5d7f9f] transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </td>

      {/* TIME */}

      <td className="px-5 py-5">
        <div className="flex items-start gap-2">
          <CalendarDays size={15} className="mt-0.5 text-[#8ca2b9]" />

          <div>
            <p className="text-[12px] font-medium text-[#526b86]">
              {formatDate(project.startDate)}
            </p>

            <p className="mt-0.5 text-[11px] text-[#9aabbd]">
              đến {formatDate(project.endDate)}
            </p>
          </div>
        </div>
      </td>

      {/* MEMBERS */}

      <td className="px-5 py-5">
        <div className="inline-flex items-center gap-1.5 text-[13px] text-[#607995]">
          <Users size={16} className="text-[#8ca2b9]" />

          {memberCount}
        </div>
      </td>

      {/* ACTIONS */}

      <td className="px-6 py-5">
        <div className="flex justify-end gap-1.5">
          <ActionButton title="Xem chi tiết" onClick={onView}>
            <Eye size={16} />
          </ActionButton>

          {canEdit && (
            <ActionButton title="Chỉnh sửa" onClick={onEdit}>
              <Pencil size={16} />
            </ActionButton>
          )}

          {canClose && (
            <ActionButton
              title="Đóng dự án"
              onClick={onClose}
              className="hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
            >
              <LockKeyhole size={16} />
            </ActionButton>
          )}

          {canDelete && (
            <ActionButton
              title="Xóa dự án"
              onClick={onDelete}
              className="hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={16} />
            </ActionButton>
          )}
        </div>
      </td>
    </tr>
  );
}

function ActionButton({ children, title, onClick, className = "" }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe7ef] bg-white text-[#6d839b] transition hover:bg-[#f5f8fb] hover:text-[#315d8b] ${className}`}
    >
      {children}
    </button>
  );
}


function ProjectEmptyState({ hasFilter, onReset }) {
  return (
    <tr>
      <td colSpan="7" className="h-[390px]">
        <div className="flex h-full flex-col items-center justify-center px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f1f5f9]">
            {hasFilter ? (
              <Search size={34} strokeWidth={1.7} className="text-[#91a5bb]" />
            ) : (
              <LayoutList
                size={34}
                strokeWidth={1.7}
                className="text-[#91a5bb]"
              />
            )}
          </div>

          <h3 className="mt-5 text-[15px] font-semibold text-[#243b53]">
            {hasFilter ? "Không tìm thấy dự án" : "Chưa có dự án"}
          </h3>

          <p className="mt-2 max-w-sm text-center text-[13px] leading-5 text-[#8ca0b7]">
            {hasFilter
              ? "Không có dự án nào phù hợp với từ khóa hoặc bộ lọc hiện tại."
              : "Hiện tại hệ thống chưa có dự án nào được tạo."}
          </p>

          {hasFilter && (
            <button
              onClick={onReset}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#dce5ef] bg-white px-4 py-2 text-[13px] font-medium text-[#4d6b89] transition hover:bg-[#f6f9fc]"
            >
              <RefreshCw size={15} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}


function ProjectTableSkeleton() {
  return (
    <>
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-5">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100" />

              <div>
                <div className="h-4 w-40 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-5 py-5">
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100" />
              <div>
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="mt-2 h-2.5 w-20 rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-5 py-5">
            <div className="h-7 w-24 rounded-full bg-slate-100" />
          </td>

          <td className="px-5 py-5">
            <div className="h-2 w-32 rounded-full bg-slate-100" />
          </td>

          <td className="px-5 py-5">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-2 h-2.5 w-24 rounded bg-slate-100" />
          </td>

          <td className="px-5 py-5">
            <div className="h-4 w-10 rounded bg-slate-100" />
          </td>

          <td className="px-6 py-5">
            <div className="ml-auto h-9 w-24 rounded-lg bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}



function PaginationButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce5ef] bg-white text-[#7188a1] transition hover:bg-[#f5f8fb] hover:text-[#315d8b] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}



function PageNumbers({ page, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = [];

  if (totalPages <= 5) {
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(0);

    if (page > 2) {
      pages.push("left");
    }

    const start = Math.max(1, page - 1);

    const end = Math.min(totalPages - 2, page + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (page < totalPages - 3) {
      pages.push("right");
    }

    pages.push(totalPages - 1);
  }

  return (
    <div className="flex items-center gap-1">
      {pages.map((item, index) => {
        if (item === "left" || item === "right") {
          return (
            <span
              key={`${item}-${index}`}
              className="flex h-10 w-7 items-center justify-center text-[13px] text-[#91a2b5]"
            >
              ...
            </span>
          );
        }

        return (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-[13px] font-medium transition ${
              item === page
                ? "bg-[#17365d] text-white shadow-sm"
                : "text-[#6c829a] hover:bg-[#f2f6fa]"
            }`}
          >
            {item + 1}
          </button>
        );
      })}
    </div>
  );
}


function ProjectDetailModal({
  project,
  onClose,
  onEdit,
  onCloseProject,
  onDelete,
}) {
  const progress = getProgress(project);

  const managerName = getManagerName(project);

  const managerEmail = getManagerEmail(project);

  const statusStyle = STATUS_STYLE[project.status] || STATUS_STYLE.PLANNING;

  const canEdit = project.status !== "CLOSED" && project.status !== "CANCELLED";

  const canClose =
    project.status !== "CLOSED" && project.status !== "CANCELLED";

  const canDelete =
    project.status === "PLANNING" ||
    project.status === "CLOSED" ||
    project.status === "CANCELLED";

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-3xl">
      {/* HEADER */}

      <div className="border-b border-[#e6edf3] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#4e7195]">
              <FolderKanban size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[19px] font-semibold text-[#17365d]">
                  {project.name}
                </h2>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusStyle.badge}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                  />

                  {STATUS_LABEL[project.status]}
                </span>
              </div>

              <p className="mt-1 text-[13px] text-[#8aa0b8]">
                Chi tiết thông tin dự án
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8ca0b5] hover:bg-[#f4f7fa] hover:text-[#526b86]"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* CONTENT */}

      <div className="max-h-[68vh] overflow-y-auto px-6 py-6">
        {/* DESCRIPTION */}

        <section>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#7188a1]">
            Mô tả dự án
          </p>

          <div className="rounded-xl border border-[#e3eaf1] bg-[#fafcfe] px-4 py-3.5">
            <p className="text-[13px] leading-6 text-[#526b86]">
              {project.description || "Dự án chưa có mô tả."}
            </p>
          </div>
        </section>

        {/* INFORMATION */}

        <section className="mt-6">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-[#7188a1]">
            Thông tin dự án
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DetailInfo
              icon={UserRound}
              label="Quản lý dự án"
              value={managerName}
              secondary={managerEmail}
            />

            <DetailInfo
              icon={CalendarDays}
              label="Ngày bắt đầu"
              value={formatDate(project.startDate)}
            />

            <DetailInfo
              icon={CalendarDays}
              label="Ngày kết thúc"
              value={formatDate(project.endDate)}
            />
          </div>
        </section>

        {/* PROGRESS */}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#7188a1]">
              Tiến độ
            </p>

            <span className="text-[14px] font-bold text-[#405b77]">
              {progress}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2f7]">
            <div
              className="h-full rounded-full bg-[#5d7f9f] transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* MEMBERS */}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#7188a1]">
              Thành viên dự án
            </p>

            <span className="text-[12px] text-[#8ca0b7]">
              {getMemberCount(project)} thành viên
            </span>
          </div>

          <div className="rounded-xl border border-[#e3eaf1]">
            {project.members?.length ? (
              <div className="divide-y divide-[#edf1f5]">
                {project.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4fa] text-[12px] font-semibold text-[#52708f]">
                        {getInitials(member?.userFullName)}
                      </div>

                      <div>
                        <p className="text-[13px] font-semibold text-[#526b86]">
                          {member.userFullName}
                        </p>

                        <p className="text-[11px] text-[#9aabbd]">
                          {member.userEmail}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-lg bg-[#f3f6f9] px-2.5 py-1 text-[11px] font-medium text-[#607995]">
                      {member.role || "MEMBER"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[13px] text-[#8ca0b7]">
                Chưa có thành viên.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* FOOTER */}

      <div className="flex flex-wrap justify-end gap-2 border-t border-[#e6edf3] bg-[#fbfcfe] px-6 py-4">
        <button
          onClick={onClose}
          className="h-10 rounded-xl border border-[#dce5ef] bg-white px-4 text-[13px] font-medium text-[#607995] hover:bg-[#f5f8fb]"
        >
          Đóng
        </button>

        {canDelete && (
          <button
            onClick={onDelete}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={15} />
            Xóa
          </button>
        )}

        {canClose && (
          <button
            onClick={onCloseProject}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-[13px] font-semibold text-amber-700 hover:bg-amber-50"
          >
            <LockKeyhole size={15} />
            Đóng dự án
          </button>
        )}

        {canEdit && (
          <button
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#17365d] px-4 text-[13px] font-semibold text-white hover:bg-[#102b4c]"
          >
            <Pencil size={15} />
            Chỉnh sửa
          </button>
        )}
      </div>
    </ModalShell>
  );
}



function DetailInfo({ icon: Icon, label, value, secondary }) {
  return (
    <div className="rounded-xl border border-[#e3eaf1] bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[#829ab2]" />

        <span className="text-[11px] font-medium text-[#8ca0b7]">{label}</span>
      </div>

      <p className="mt-2 truncate text-[13px] font-semibold text-[#526b86]">
        {value}
      </p>

      {secondary && (
        <p className="mt-0.5 truncate text-[11px] text-[#9aabbd]">
          {secondary}
        </p>
      )}
    </div>
  );
}


function ProjectFormModal({
  title,
  subtitle,
  form,
  setForm,
  loading,
  onClose,
  onSubmit,
}) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-xl">
      <div className="border-b border-[#e6edf3] px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[19px] font-semibold text-[#17365d]">
              {title}
            </h2>

            <p className="mt-1 text-[13px] text-[#8aa0b8]">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8ca0b5] hover:bg-[#f4f7fa]"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        {/* NAME */}

        <FormField label="Tên dự án" required>
          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            required
            placeholder="Nhập tên dự án"
            className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white px-3.5 text-[13px] text-[#526b86] outline-none placeholder:text-[#9aabbd] focus:border-[#91abc8] focus:ring-2 focus:ring-[#e4edf6]"
          />
        </FormField>

        {/* DESCRIPTION */}

        <FormField label="Mô tả">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            required
            placeholder="Nhập mô tả dự án..."
            className="w-full resize-none rounded-xl border border-[#dce5ef] bg-white px-3.5 py-3 text-[13px] leading-5 text-[#526b86] outline-none placeholder:text-[#9aabbd] focus:border-[#91abc8] focus:ring-2 focus:ring-[#e4edf6]"
          />
        </FormField>

        {/* DATES */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Ngày bắt đầu" required>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  startDate: e.target.value,
                })
              }
              min={today}
              required
              className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white px-3.5 text-[13px] text-[#526b86] outline-none focus:border-[#91abc8]"
            />
          </FormField>

          <FormField label="Ngày kết thúc" required>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  endDate: e.target.value,
                })
              }
              min={form.startDate || today}
              required
              className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white px-3.5 text-[13px] text-[#526b86] outline-none focus:border-[#91abc8]"
            />
          </FormField>
        </div>

        {/* STATUS INFO */}

        <div className="flex items-start gap-3 rounded-xl border border-[#dce7f2] bg-[#f5f9fd] px-4 py-3">
          <CircleCheck size={17} className="mt-0.5 shrink-0 text-[#5b7e9f]" />

          <p className="text-[12px] leading-5 text-[#607995]">
            Dự án mới sẽ được tạo với trạng thái <strong>Kế hoạch</strong>.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#e6edf3] bg-[#fbfcfe] px-6 py-4">
        <button
          onClick={onClose}
          className="h-10 rounded-xl border border-[#dce5ef] bg-white px-5 text-[13px] font-medium text-[#607995] hover:bg-[#f5f8fb]"
        >
          Hủy
        </button>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#17365d] px-5 text-[13px] font-semibold text-white hover:bg-[#102b4c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Lưu dự án
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}


function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-[#526b86]">
        {label}

        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      {children}
    </div>
  );
}


function ConfirmModal({
  type,
  title,
  description,
  confirmText,
  loading,
  onClose,
  onConfirm,
}) {
  const isDelete = type === "delete";

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-md" zIndex="z-[70]">
      <div className="p-6">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isDelete ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          {isDelete ? <Trash2 size={22} /> : <LockKeyhole size={22} />}
        </div>

        <h2 className="mt-5 text-[18px] font-semibold text-[#243b53]">
          {title}
        </h2>

        <div className="mt-2 text-[13px] leading-6 text-[#7188a1]">
          {description}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#e6edf3] bg-[#fbfcfe] px-6 py-4">
        <button
          onClick={onClose}
          className="h-10 rounded-xl border border-[#dce5ef] bg-white px-5 text-[13px] font-medium text-[#607995] hover:bg-[#f5f8fb]"
        >
          Hủy
        </button>

        <button
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white disabled:opacity-50 ${
            isDelete
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {loading ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : isDelete ? (
            <Trash2 size={15} />
          ) : (
            <LockKeyhole size={15} />
          )}

          {loading ? "Đang xử lý..." : confirmText}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
  maxWidth = "max-w-xl",
  zIndex = "z-50",
}) {
  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-[#102a43]/40 p-4 backdrop-blur-[2px]`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${maxWidth} overflow-hidden rounded-2xl border border-[#dfe7f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]`}
      >
        {children}
      </div>
    </div>
  );
}
