import React, { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import instance from "../../utils/axios.customize";

const STATUS_LABEL = {
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  PENDING: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const STATUS_ICON = {
  NOT_STARTED: Clock,
  IN_PROGRESS: TrendingUp,
  PENDING: AlertCircle,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

const STATUS_CLASS = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function MemberProgress() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [search, setSearch] = useState("");

  // =========================
  // Lấy danh sách dự án Member tham gia
  // =========================
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);

        const res = await instance.get("/member/projects");

        const data = res?.data?.data || res?.data || [];

        setProjects(data);

        if (data.length > 0) {
          setSelectedProject(data[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách dự án");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // =========================
  // Lấy task của dự án
  // =========================
  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);

        const res = await instance.get(`/projects/${selectedProject}/tasks`);

        const data = res?.data?.data || res?.data || [];

        setTasks(data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải tiến độ công việc");
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  // =========================
  // Tìm kiếm task
  // =========================
  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return tasks;

    return tasks.filter((task) => task.name?.toLowerCase().includes(keyword));
  }, [tasks, search]);

  // =========================
  // Tiến độ tổng thể dự án
  // Trung bình % của tất cả task
  // =========================
  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0;

    const total = tasks.reduce(
      (sum, task) => sum + Number(task.progress || 0),
      0,
    );

    return Math.round(total / tasks.length);
  }, [tasks]);

  // =========================
  // Thống kê
  // =========================
  const statistics = useMemo(() => {
    return {
      total: tasks.length,

      completed: tasks.filter((task) => task.status === "COMPLETED").length,

      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,

      pending: tasks.filter((task) => task.status === "PENDING").length,
    };
  }, [tasks]);

  // =========================
  // Format deadline
  // =========================
  const formatDate = (date) => {
    if (!date) return "Chưa đặt";

    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // =========================
  // Kiểm tra quá hạn
  // =========================
  const isOverdue = (task) => {
    if (!task.deadline) return false;
    if (task.status === "COMPLETED") return false;
    if (task.status === "CANCELLED") return false;

    return new Date(task.deadline) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <TrendingUp size={28} />
            Tiến độ dự án
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Theo dõi tiến độ các công việc và tiến độ tổng thể của dự án
          </p>
        </div>

        {/* Chọn dự án */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Dự án
          </label>

          <div className="relative">
            <FolderKanban
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={loadingProjects}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
            >
              {projects.length === 0 && (
                <option value="">
                  {loadingProjects ? "Đang tải dự án..." : "Không có dự án"}
                </option>
              )}

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tổng quan */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Overall */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Tiến độ tổng thể</span>

              <TrendingUp className="text-blue-500" size={22} />
            </div>

            <div className="text-3xl font-bold text-blue-600">
              {overallProgress}%
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Total */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Tổng công việc</span>

              <FolderKanban className="text-gray-500" size={22} />
            </div>

            <div className="text-3xl font-bold text-gray-800">
              {statistics.total}
            </div>

            <p className="mt-1 text-sm text-gray-500">công việc</p>
          </div>

          {/* In progress */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Đang thực hiện</span>

              <TrendingUp className="text-blue-500" size={22} />
            </div>

            <div className="text-3xl font-bold text-blue-600">
              {statistics.inProgress}
            </div>

            <p className="mt-1 text-sm text-gray-500">công việc</p>
          </div>

          {/* Completed */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Hoàn thành</span>

              <CheckCircle2 className="text-green-500" size={22} />
            </div>

            <div className="text-3xl font-bold text-green-600">
              {statistics.completed}
            </div>

            <p className="mt-1 text-sm text-gray-500">công việc</p>
          </div>
        </div>

        {/* Danh sách công việc */}
        <div className="rounded-xl bg-white shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Tiến độ theo công việc
              </h2>

              <p className="text-sm text-gray-500">
                Theo dõi tiến độ từng công việc trong dự án
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Tìm kiếm công việc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Loading */}
          {loadingTasks && (
            <div className="p-10 text-center text-gray-500">
              Đang tải tiến độ...
            </div>
          )}

          {/* Empty */}
          {!loadingTasks && filteredTasks.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              Không có công việc nào.
            </div>
          )}

          {/* Table */}
          {!loadingTasks && filteredTasks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">
                    <th className="px-5 py-3">Công việc</th>

                    <th className="px-5 py-3">Deadline</th>

                    <th className="px-5 py-3">Trạng thái</th>

                    <th className="px-5 py-3">Tiến độ</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((task) => {
                    const progress = Number(task.progress || 0);

                    const StatusIcon = STATUS_ICON[task.status] || Clock;

                    const statusLabel =
                      STATUS_LABEL[task.status] ||
                      task.status ||
                      "Chưa xác định";

                    const statusClass =
                      STATUS_CLASS[task.status] || "bg-gray-100 text-gray-700";

                    return (
                      <tr
                        key={task.id}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >
                        {/* Task */}
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-800">
                            {task.name}
                          </div>

                          {task.description && (
                            <div className="mt-1 max-w-md truncate text-sm text-gray-500">
                              {task.description}
                            </div>
                          )}
                        </td>

                        {/* Deadline */}
                        <td className="px-5 py-4">
                          <div
                            className={
                              isOverdue(task)
                                ? "font-medium text-red-600"
                                : "text-gray-600"
                            }
                          >
                            {formatDate(task.deadline)}
                          </div>

                          {isOverdue(task) && (
                            <div className="mt-1 text-xs text-red-500">
                              Đã quá hạn
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                          >
                            <StatusIcon size={14} />
                            {statusLabel}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{
                                  width: `${Math.min(
                                    Math.max(progress, 0),
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>

                            <span className="min-w-[45px] text-sm font-semibold text-gray-700">
                              {progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemberProgress;
