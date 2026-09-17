import React, { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  BarChart3,
  GanttChart,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users,
  CircleDot,
} from "lucide-react";
import { toast } from "react-toastify";
import instance from "../../utils/axios.customize";

const STATUS_LABEL = {
  TODO: "Chưa bắt đầu",
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  PENDING: "Chờ xử lý",
  COMPLETED: "Hoàn thành",
  DONE: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const STATUS_CLASS = {
  TODO: "bg-gray-100 text-gray-700",
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PRIORITY_LABEL = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

const PRIORITY_CLASS = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 8;

const normalizeProject = (project) => ({
  id: project.id,
  name: project.name || project.projectName || "Dự án",
  startDate: project.startDate || null,
  endDate: project.endDate || null,
  status: project.status || "",
});

const normalizeTask = (task) => ({
  id: task.id,
  name: task.name || task.title || "Công việc",
  description: task.description || "",
  status: task.status || "TODO",
  priority: task.priority || "MEDIUM",
  progress: Math.min(
    Math.max(Number(task.progressPercent ?? task.progress ?? 0), 0),
    100,
  ),
  startDate: task.startDate || task.createdAt || null,
  deadline: task.deadline || null,
  assignees: task.assignees || [],
});

const formatDate = (date) => {
  if (!date) return "Chưa có";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Chưa có";
  }

  return value.toLocaleDateString("vi-VN");
};

const formatDateTime = (date) => {
  if (!date) return "Chưa có";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Chưa có";
  }

  return value.toLocaleString("vi-VN");
};

const getDateOnly = (date) => {
  if (!date) return null;

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
};

const getDeadlineState = (deadline, progress, status) => {
  if (!deadline || progress >= 100 || status === "CANCELLED") {
    return "normal";
  }

  const today = getDateOnly(new Date());
  const deadlineDate = getDateOnly(deadline);

  if (!today || !deadlineDate) {
    return "normal";
  }

  const diff = deadlineDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return "overdue";
  }

  if (days <= 3) {
    return "soon";
  }

  return "normal";
};

const getAssigneeNames = (assignees) => {
  if (!assignees || assignees.length === 0) {
    return "Chưa phân công";
  }

  return assignees
    .map(
      (user) =>
        user.fullName ||
        user.name ||
        user.userName ||
        user.email ||
        "Thành viên",
    )
    .join(", ");
};

const ProgressManagement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [tasks, setTasks] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    todo: 0,
    cancelled: 0,
    unfinished: 0,
    totalProgress: 0,
  });

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [direction, setDirection] = useState("asc");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [viewMode, setViewMode] = useState("list");

  const [exporting, setExporting] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId],
  );

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);

      const response = await instance.get("/projects");

      const data = response.data?.data || response.data || [];

      const normalized = Array.isArray(data)
        ? data.map(normalizeProject)
        : [];

      setProjects(normalized);

      if (normalized.length > 0) {
        setSelectedProjectId(String(normalized[0].id));
      } else {
        setSelectedProjectId("");
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Không thể tải danh sách dự án",
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadTasks = async () => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    try {
      setLoadingTasks(true);

      const response = await instance.get(
        `/projects/${selectedProjectId}/tasks`,
        {
          params: {
            page,
            size: PAGE_SIZE,
            keyword: search.trim(),
            status: status || null,
            priority: priority || null,
            sortBy,
            direction,
          },
        },
      );

      const body = response.data;

      const content =
        body?.content ||
        body?.data?.content ||
        body?.data ||
        [];

      const normalizedTasks = Array.isArray(content)
        ? content.map(normalizeTask)
        : [];

      setTasks(normalizedTasks);

      const stats =
        body?.statistics ||
        body?.data?.statistics ||
        null;

      if (stats) {
        setStatistics({
          total: Number(stats.total || 0),
          completed: Number(
            stats.completed ?? stats.done ?? 0,
          ),
          inProgress: Number(stats.inProgress || 0),
          pending: Number(stats.pending || 0),
          todo: Number(
            stats.todo ?? stats.notStarted ?? 0,
          ),
          cancelled: Number(stats.cancelled || 0),
          unfinished: Number(stats.unfinished || 0),
          totalProgress: Number(
            stats.totalProgress ?? stats.progress ?? 0,
          ),
        });
      } else {
        calculateFallbackStatistics(normalizedTasks);
      }

      setTotalPages(Number(body?.totalPages || body?.data?.totalPages || 0));
      setTotalElements(
        Number(body?.totalElements || body?.data?.totalElements || 0),
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Không thể tải tiến độ công việc",
      );

      setTasks([]);
      setTotalPages(0);
      setTotalElements(0);
      setStatistics({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        todo: 0,
        cancelled: 0,
        unfinished: 0,
        totalProgress: 0,
      });
    } finally {
      setLoadingTasks(false);
    }
  };

  const calculateFallbackStatistics = (taskList) => {
    const total = taskList.length;

    const completed = taskList.filter(
      (task) =>
        task.status === "COMPLETED" ||
        task.status === "DONE",
    ).length;

    const inProgress = taskList.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length;

    const pending = taskList.filter(
      (task) => task.status === "PENDING",
    ).length;

    const todo = taskList.filter(
      (task) =>
        task.status === "TODO" ||
        task.status === "NOT_STARTED",
    ).length;

    const cancelled = taskList.filter(
      (task) => task.status === "CANCELLED",
    ).length;

    const unfinished = taskList.filter(
      (task) =>
        task.status !== "COMPLETED" &&
        task.status !== "DONE" &&
        task.status !== "CANCELLED",
    ).length;

    const totalProgress =
      total === 0
        ? 0
        : Math.round(
            taskList.reduce(
              (sum, task) => sum + task.progress,
              0,
            ) / total,
          );

    setStatistics({
      total,
      completed,
      inProgress,
      pending,
      todo,
      cancelled,
      unfinished,
      totalProgress,
    });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, status, priority, sortBy, direction, selectedProjectId]);

  useEffect(() => {
    loadTasks();
  }, [
    selectedProjectId,
    page,
    search,
    status,
    priority,
    sortBy,
    direction,
  ]);

  const totalProgress = Math.min(
    Math.max(Math.round(Number(statistics.totalProgress || 0)), 0),
    100,
  );

  const deadlineSummary = useMemo(() => {
    const overdue = tasks.filter(
      (task) =>
        getDeadlineState(
          task.deadline,
          task.progress,
          task.status,
        ) === "overdue",
    ).length;

    const soon = tasks.filter(
      (task) =>
        getDeadlineState(
          task.deadline,
          task.progress,
          task.status,
        ) === "soon",
    ).length;

    return {
      overdue,
      soon,
    };
  }, [tasks]);

  const handleRefresh = () => {
    loadProjects();
    loadTasks();
  };

  const handleProjectChange = (event) => {
    setSelectedProjectId(event.target.value);
    setPage(0);
  };

  const handleExport = async (format) => {
    if (!selectedProjectId) {
      toast.error("Vui lòng chọn dự án");
      return;
    }

    try {
      setExporting(true);

      const response = await instance.get(
        `/projects/${selectedProjectId}/progress-report`,
        {
          params: {
            format,
          },
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data]);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `bao-cao-tien-do-${selectedProjectId}.${
        format === "pdf" ? "pdf" : "xlsx"
      }`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        `Đã xuất báo cáo ${format.toUpperCase()}`,
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Không thể xuất báo cáo",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* CHANGED: Header thêm refresh */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý tiến độ
          </h1>

          <p className="text-gray-500 mt-1">
            Theo dõi tiến độ tổng thể và tiến độ từng công việc
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loadingProjects || loadingTasks}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={
              loadingProjects || loadingTasks
                ? "animate-spin"
                : ""
            }
          />
          Làm mới
        </button>
      </div>

      {/* PROJECT SELECT */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FolderKanban
            size={20}
            className="text-blue-600"
          />

          <h2 className="font-semibold text-gray-800">
            Chọn dự án
          </h2>
        </div>

        {loadingProjects ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            className="w-full md:w-[500px] border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.length === 0 ? (
              <option value="">Không có dự án</option>
            ) : (
              projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))
            )}
          </select>
        )}

        {selectedProject && (
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            {selectedProject.startDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} />
                Bắt đầu: {formatDate(selectedProject.startDate)}
              </span>
            )}

            {selectedProject.endDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} />
                Kết thúc: {formatDate(selectedProject.endDate)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* OVERALL PROGRESS */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <BarChart3
                size={21}
                className="text-blue-600"
              />

              <h2 className="text-lg font-bold text-gray-800">
                Tiến độ tổng thể dự án
              </h2>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Tự động tính bằng trung bình % hoàn thành
              của tất cả công việc trong dự án.
            </p>

            <div className="mt-5 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{
                  width: `${totalProgress}%`,
                }}
              />
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex items-center justify-center w-32 h-32 rounded-full border-8 border-blue-100 shrink-0">
            <span className="text-3xl font-bold text-blue-600">
              {totalProgress}%
            </span>
          </div>
        </div>

        {/* CHANGED: cảnh báo deadline */}
        {(deadlineSummary.overdue > 0 ||
          deadlineSummary.soon > 0) && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {deadlineSummary.overdue > 0 && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle
                  size={20}
                  className="text-red-600"
                />

                <div>
                  <p className="font-semibold text-red-700">
                    {deadlineSummary.overdue} công việc quá hạn
                  </p>

                  <p className="text-xs text-red-600">
                    Cần được kiểm tra và xử lý
                  </p>
                </div>
              </div>
            )}

            {deadlineSummary.soon > 0 && (
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3">
                <Clock
                  size={20}
                  className="text-yellow-600"
                />

                <div>
                  <p className="font-semibold text-yellow-700">
                    {deadlineSummary.soon} công việc sắp đến hạn
                  </p>

                  <p className="text-xs text-yellow-600">
                    Deadline trong vòng 3 ngày
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatisticCard
          icon={FolderKanban}
          title="Tổng việc"
          value={statistics.total}
        />

        <StatisticCard
          icon={CheckCircle2}
          title="Hoàn thành"
          value={statistics.completed}
        />

        <StatisticCard
          icon={Clock}
          title="Đang thực hiện"
          value={statistics.inProgress}
        />

        <StatisticCard
          icon={AlertCircle}
          title="Chờ xử lý"
          value={statistics.pending}
        />

        <StatisticCard
          icon={CircleDot}
          title="Chưa bắt đầu"
          value={statistics.todo}
        />

        <StatisticCard
          icon={XCircle}
          title="Đã hủy"
          value={statistics.cancelled}
        />
      </div>

      {/* VIEW + FILTER */}
      <div className="bg-white border border-gray-200 rounded-xl mb-6">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Theo dõi công việc
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {totalElements} công việc trong dự án
              </p>
            </div>

            {/* CHANGED: chuyển đổi List / Gantt */}
            <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BarChart3 size={17} />
                Danh sách
              </button>

              <button
                onClick={() => setViewMode("gantt")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "gantt"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <GanttChart size={17} />
                Gantt
              </button>
            </div>
          </div>

          {/* FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm công việc..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="NOT_STARTED">Chưa bắt đầu</option>
              <option value="IN_PROGRESS">
                Đang thực hiện
              </option>
              <option value="PENDING">
                Chờ xử lý
              </option>
              <option value="DONE">
                Hoàn thành
              </option>
              <option value="CANCELLED">Đã hủy</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả độ ưu tiên</option>
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="deadline">
                  Deadline
                </option>

                <option value="progressPercent">
                  Tiến độ
                </option>

                <option value="title">
                  Tên
                </option>

                <option value="createdAt">
                  Ngày tạo
                </option>
              </select>

              <button
                onClick={() =>
                  setDirection((current) =>
                    current === "asc" ? "desc" : "asc",
                  )
                }
                className="px-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={
                  direction === "asc"
                    ? "Tăng dần"
                    : "Giảm dần"
                }
              >
                {direction === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loadingTasks ? (
          <LoadingState />
        ) : tasks.length === 0 ? (
          <EmptyState />
        ) : viewMode === "list" ? (
          <TaskTable tasks={tasks} />
        ) : (
          <GanttView
            tasks={tasks}
            project={selectedProject}
          />
        )}

        {/* PAGINATION */}
        {!loadingTasks && totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* EXPORT */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              Báo cáo tiến độ
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Xuất báo cáo tiến độ của dự án hiện tại.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <FileText size={18} />
              Xuất PDF
            </button>

            <button
              onClick={() => handleExport("excel")}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <FileSpreadsheet size={18} />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatisticCard = ({
  icon: Icon,
  title,
  value,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon size={18} />

        <span className="text-sm">{title}</span>
      </div>

      <div className="text-2xl font-bold text-gray-800 mt-2">
        {value}
      </div>
    </div>
  );
};

const LoadingState = () => {
  return (
    <div className="p-5 space-y-4">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="h-16 bg-gray-100 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="py-16 text-center">
      <FolderKanban
        size={42}
        className="mx-auto text-gray-300"
      />

      <h3 className="mt-3 font-semibold text-gray-700">
        Không có công việc
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        Không tìm thấy công việc phù hợp với bộ lọc hiện tại.
      </p>
    </div>
  );
};

const TaskTable = ({ tasks }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
              Công việc
            </th>

            <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
              Người thực hiện
            </th>

            <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
              Ưu tiên
            </th>

            <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
              Deadline
            </th>

            <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
              Trạng thái
            </th>

            <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700 min-w-[220px]">
              Tiến độ
            </th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => {
            const deadlineState = getDeadlineState(
              task.deadline,
              task.progress,
              task.status,
            );

            return (
              <tr
                key={task.id}
                className="border-b last:border-b-0 hover:bg-gray-50"
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-800">
                    {task.name}
                  </div>

                  {task.description && (
                    <div className="text-xs text-gray-400 mt-1 max-w-[280px] truncate">
                      {task.description}
                    </div>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 max-w-[220px]">
                    <Users
                      size={16}
                      className="text-gray-400 shrink-0"
                    />

                    <span
                      className="text-sm text-gray-600 truncate"
                      title={getAssigneeNames(
                        task.assignees,
                      )}
                    >
                      {getAssigneeNames(task.assignees)}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      PRIORITY_CLASS[task.priority] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {PRIORITY_LABEL[task.priority] ||
                      task.priority}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div
                    className={`flex items-center gap-1.5 text-sm ${
                      deadlineState === "overdue"
                        ? "text-red-600 font-semibold"
                        : deadlineState === "soon"
                          ? "text-yellow-600 font-semibold"
                          : "text-gray-600"
                    }`}
                  >
                    <CalendarDays size={15} />

                    {formatDate(task.deadline)}
                  </div>

                  {deadlineState === "overdue" && (
                    <span className="text-xs text-red-500">
                      Quá hạn
                    </span>
                  )}

                  {deadlineState === "soon" && (
                    <span className="text-xs text-yellow-600">
                      Sắp đến hạn
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_CLASS[task.status] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABEL[task.status] ||
                      task.status}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${task.progress}%`,
                        }}
                      />
                    </div>

                    <span className="w-12 text-right text-sm font-semibold text-gray-700">
                      {task.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const GanttView = ({ tasks, project }) => {
  const ganttTasks = useMemo(() => {
    return tasks.filter((task) => task.deadline);
  }, [tasks]);

  const timeline = useMemo(() => {
    const dates = [];

    ganttTasks.forEach((task) => {
      const start = getDateOnly(
        task.createdAt || project?.startDate,
      );

      const end = getDateOnly(task.deadline);

      if (start) dates.push(start);
      if (end) dates.push(end);
    });

    if (project?.startDate) {
      dates.push(getDateOnly(project.startDate));
    }

    if (project?.endDate) {
      dates.push(getDateOnly(project.endDate));
    }

    const validDates = dates.filter(Boolean);

    if (validDates.length === 0) {
      return [];
    }

    const minDate = new Date(
      Math.min(...validDates.map((date) => date.getTime())),
    );

    const maxDate = new Date(
      Math.max(...validDates.map((date) => date.getTime())),
    );

    const result = [];

    const current = new Date(minDate);

    while (current <= maxDate) {
      result.push(new Date(current));

      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [ganttTasks, project]);

  const getPosition = (date) => {
    if (!date || timeline.length === 0) {
      return 0;
    }

    const first = timeline[0].getTime();
    const last =
      timeline[timeline.length - 1].getTime();

    if (last === first) {
      return 0;
    }

    return (
      ((date.getTime() - first) /
        (last - first)) *
      100
    );
  };

  const getWidth = (start, end) => {
    if (!start || !end || timeline.length === 0) {
      return 2;
    }

    const total =
      timeline[timeline.length - 1].getTime() -
      timeline[0].getTime();

    if (total <= 0) {
      return 5;
    }

    const width =
      ((end.getTime() - start.getTime()) /
        total) *
      100;

    return Math.max(width, 2);
  };

  if (ganttTasks.length === 0) {
    return (
      <div className="py-16 text-center">
        <GanttChart
          size={42}
          className="mx-auto text-gray-300"
        />

        <h3 className="mt-3 font-semibold text-gray-700">
          Chưa đủ dữ liệu để hiển thị Gantt
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Công việc cần có deadline để hiển thị trên biểu đồ.
        </p>
      </div>
    );
  }

  const timelineWidth = Math.max(
    timeline.length * 42,
    900,
  );

  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-[1100px]"
        style={{
          width: `${timelineWidth}px`,
        }}
      >
        <div className="grid grid-cols-[280px_1fr] border-b bg-gray-50">
          <div className="px-5 py-3 text-sm font-semibold text-gray-700 border-r">
            Công việc
          </div>

          <div className="relative h-12">
            {timeline.map((date, index) => (
              <div
                key={date.toISOString()}
                className="absolute top-0 bottom-0 border-l border-gray-200"
                style={{
                  left: `${
                    (index /
                      Math.max(timeline.length - 1, 1)) *
                    100
                  }%`,
                }}
              >
                <div className="absolute top-2 left-1 text-[10px] text-gray-500 whitespace-nowrap">
                  {date.getDate()}/
                  {date.getMonth() + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {ganttTasks.map((task) => {
          const start = getDateOnly(
            task.createdAt || project?.startDate,
          );

          const end = getDateOnly(task.deadline);

          const left = getPosition(start);
          const width = getWidth(start, end);

          return (
            <div
              key={task.id}
              className="grid grid-cols-[280px_1fr] border-b min-h-[64px]"
            >
              <div className="px-5 py-3 border-r">
                <div className="font-medium text-sm text-gray-800 truncate">
                  {task.name}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      STATUS_CLASS[task.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABEL[task.status] ||
                      task.status}
                  </span>

                  <span className="text-xs text-gray-500">
                    {task.progress}%
                  </span>
                </div>
              </div>

              <div className="relative bg-white">
                {timeline.map((date, index) => (
                  <div
                    key={date.toISOString()}
                    className="absolute top-0 bottom-0 border-l border-gray-100"
                    style={{
                      left: `${
                        (index /
                          Math.max(
                            timeline.length - 1,
                            1,
                          )) *
                        100
                      }%`,
                    }}
                  />
                ))}

                <div
                  className="absolute top-5 h-7 bg-blue-100 rounded-md overflow-hidden border border-blue-200"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    minWidth: "40px",
                  }}
                  title={`${task.name} - ${task.progress}%`}
                >
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{
                      width: `${task.progress}%`,
                    }}
                  />

                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-blue-800">
                    {task.progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Pagination = ({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}) => {
  const start =
    totalElements === 0
      ? 0
      : page * pageSize + 1;

  const end = Math.min(
    (page + 1) * pageSize,
    totalElements,
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Hiển thị {start}-{end} trên tổng{" "}
        {totalElements} công việc
      </p>

      <div className="flex items-center gap-2">
        <button
          disabled={page <= 0}
          onClick={() =>
            onPageChange(Math.max(page - 1, 0))
          }
          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Trước
        </button>

        <span className="px-3 py-2 text-sm text-gray-600">
          Trang {page + 1} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages - 1}
          onClick={() =>
            onPageChange(
              Math.min(page + 1, totalPages - 1),
            )
          }
          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sau
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProgressManagement;