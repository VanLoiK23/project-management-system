import React, { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import instance from "../../utils/axios.customize";

const STATUS_LABEL = {
  TODO: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  PENDING: "Chờ xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};

const STATUS_CLASS = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const normalizeProject = (project) => ({
  id: project.id,
  name: project.name || project.projectName || "Dự án",
});

const normalizeTask = (task) => ({
  id: task.id,
  name: task.name || task.title || "Công việc",
  status: task.status || "TODO",
  progress: Number(task.progress || 0),
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

const ProgressManagement = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [search, setSearch] = useState("");

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);

      const response = await instance.get("/projects");

      const data = response.data?.data || response.data || [];

      const normalized = data.map(normalizeProject);

      setProjects(normalized);

      if (normalized.length > 0) {
        setSelectedProjectId(normalized[0].id);
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

  useEffect(() => {
    loadProjects();
  }, []);

  // =====================================================
  // LOAD TASKS
  // =====================================================

  const loadTasks = async () => {
    if (!selectedProjectId) return;

    try {
      setLoadingTasks(true);

      /*
       * Backend dự kiến:
       *
       * GET /projects/{projectId}/tasks
       */

      const response = await instance.get(
        `/projects/${selectedProjectId}/tasks`,
      );

      const data = response.data?.data || response.data || [];

      setTasks(data.map(normalizeTask));
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Không thể tải tiến độ công việc",
      );

      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedProjectId]);

  // =====================================================
  // CALCULATE TOTAL PROGRESS
  // =====================================================

  const totalProgress = useMemo(() => {
    if (tasks.length === 0) return 0;

    const total = tasks.reduce((sum, task) => sum + task.progress, 0);

    return Math.round(total / tasks.length);
  }, [tasks]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    return {
      total: tasks.length,

      completed: tasks.filter((task) => task.status === "COMPLETED").length,

      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,

      pending: tasks.filter((task) => task.status === "PENDING").length,

      todo: tasks.filter((task) => task.status === "TODO").length,

      cancelled: tasks.filter((task) => task.status === "CANCELLED").length,
    };
  }, [tasks]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredTasks = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return tasks;
    }

    return tasks.filter((task) => task.name.toLowerCase().includes(keyword));
  }, [tasks, search]);

  // =====================================================
  // EXPORT REPORT
  // =====================================================

  const handleExport = async (format) => {
    if (!selectedProjectId) {
      toast.error("Vui lòng chọn dự án");
      return;
    }

    try {
      /*
       * Backend dự kiến:
       *
       * GET /projects/{projectId}/progress-report?format=pdf
       * GET /projects/{projectId}/progress-report?format=excel
       */

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

      const extension = format === "pdf" ? "pdf" : "xlsx";

      link.download = `bao-cao-tien-do-${selectedProjectId}.${extension}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(`Đã xuất báo cáo ${format.toUpperCase()}`);
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Không thể xuất báo cáo");
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tiến độ</h1>

        <p className="text-gray-500 mt-1">
          Theo dõi tiến độ công việc và tổng thể dự án
        </p>
      </div>

      {/* PROJECT SELECT */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FolderKanban size={20} className="text-blue-600" />

          <h2 className="font-semibold text-gray-800">Chọn dự án</h2>
        </div>

        {loadingProjects ? (
          <p className="text-gray-500">Đang tải dự án...</p>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full md:w-96 border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.length === 0 ? (
              <option value="">Không có dự án</option>
            ) : (
              projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))
            )}
          </select>
        )}
      </div>

      {/* OVERALL PROGRESS */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Tiến độ tổng thể dự án
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Tiến độ được tính bằng trung bình % hoàn thành của tất cả công
              việc
            </p>
          </div>

          <div className="text-4xl font-bold text-blue-600">
            {totalProgress}%
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-5">
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{
                width: `${totalProgress}%`,
              }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Công thức: Tổng % hoàn thành của các công việc / Số lượng công việc
        </p>
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
          icon={Clock}
          title="Chưa bắt đầu"
          value={statistics.todo}
        />

        <StatisticCard
          icon={XCircle}
          title="Đã hủy"
          value={statistics.cancelled}
        />
      </div>

      {/* TASK PROGRESS */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* TABLE HEADER */}
        <div className="p-5 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Tiến độ theo công việc
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Theo dõi trạng thái và % hoàn thành từng công việc
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full md:w-80">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm công việc..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        {loadingTasks ? (
          <div className="py-16 text-center text-gray-500">
            Đang tải tiến độ...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            Không có công việc
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-4 text-sm font-semibold">
                    Công việc
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold">
                    Deadline
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold">
                    Trạng thái
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold min-w-[220px]">
                    Tiến độ
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {/* NAME */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">
                        {task.name}
                      </div>
                    </td>

                    {/* DEADLINE */}
                    <td className="px-5 py-4">
                      <span className="text-gray-600">
                        {formatDate(task.deadline)}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_CLASS[task.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABEL[task.status] || task.status}
                      </span>
                    </td>

                    {/* PROGRESS */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                Math.max(task.progress, 0),
                                100,
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="w-12 text-right text-sm font-semibold">
                          {task.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EXPORT */}
      <div className="bg-white border rounded-xl p-5 mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              Xuất báo cáo tiến độ
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Chỉ PM có quyền xuất báo cáo.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FileText size={18} />
              Xuất PDF
            </button>

            <button
              onClick={() => handleExport("excel")}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
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

// =====================================================
// STATISTIC CARD
// =====================================================

const StatisticCard = ({ icon: Icon, title, value }) => {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon size={18} />

        <span className="text-sm">{title}</span>
      </div>

      <div className="text-2xl font-bold text-gray-800 mt-2">{value}</div>
    </div>
  );
};

export default ProgressManagement;
