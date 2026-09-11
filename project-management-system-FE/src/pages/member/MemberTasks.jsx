import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Clock,
  User,
  CalendarDays,
  Flag,
  X,
  Send,
  CheckCircle2,
  Circle,
  Loader2,
  PauseCircle,
  Ban,
} from "lucide-react";
import { toast } from "react-toastify";
import instance from "../../utils/axios.customize";
import { AuthContext } from "../../components/context/auth.context.jsx";

// =========================
// CONSTANTS
// =========================

const STATUS_OPTIONS = [
  {
    value: "TODO",
    label: "Chưa bắt đầu",
    icon: Circle,
  },
  {
    value: "IN_PROGRESS",
    label: "Đang thực hiện",
    icon: Loader2,
  },
  {
    value: "PENDING",
    label: "Chờ xử lý",
    icon: PauseCircle,
  },
  {
    value: "COMPLETED",
    label: "Hoàn thành",
    icon: CheckCircle2,
  },
  {
    value: "CANCELLED",
    label: "Hủy",
    icon: Ban,
  },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

// =========================
// HELPERS
// =========================

const getStatusLabel = (status) => {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
};

const getPriorityLabel = (priority) => {
  return (
    PRIORITY_OPTIONS.find((item) => item.value === priority)?.label || priority
  );
};

const getStatusClass = (status) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-700";

    case "HIGH":
      return "bg-orange-100 text-orange-700";

    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-green-100 text-green-700";
  }
};

const formatDate = (date) => {
  if (!date) return "Chưa có";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Chưa có";
  }

  return value.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const isOverdue = (task) => {
  if (!task.deadline) return false;

  if (task.status === "COMPLETED" || task.status === "CANCELLED") {
    return false;
  }

  return new Date(task.deadline) < new Date();
};

// =========================
// NORMALIZE DATA
// =========================

const normalizeTask = (task) => {
  return {
    id: task.id,

    name: task.name || task.title || "",

    description: task.description || "",

    deadline: task.deadline || null,

    priority: task.priority || "MEDIUM",

    status: task.status || "TODO",

    progress:
      typeof task.progress === "number"
        ? task.progress
        : Number(task.progress || 0),

    projectId: task.projectId || task.project_id,

    projectName:
      task.projectName || task.project_name || task.project?.name || "Dự án",

    assignees: task.assignees || task.assignedUsers || [],

    comments: task.comments || [],
  };
};

// =========================
// COMPONENT
// =========================

const MemberTasks = () => {
  const { auth } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [selectedTask, setSelectedTask] = useState(null);

  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // =========================
  // LOAD TASKS
  // =========================

  const loadTasks = async () => {
    try {
      setLoading(true);

      /*
       * Backend dự kiến:
       * GET /member/tasks
       *
       * API trả về:
       * {
       *   data: [...]
       * }
       */

      const response = await instance.get("/member/tasks");

      const data = response.data?.data || response.data || [];

      setTasks(data.map(normalizeTask));
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Không thể tải danh sách công việc",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // =========================
  // FILTER
  // =========================

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const keyword = search.toLowerCase().trim();

      const matchSearch =
        !keyword ||
        task.name.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword);

      const matchStatus = !statusFilter || task.status === statusFilter;

      const matchPriority = !priorityFilter || task.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  // =========================
  // OPEN DETAIL
  // =========================

  const handleOpenTask = async (task) => {
    setSelectedTask(task);

    setStatus(task.status);
    setProgress(task.progress);

    try {
      const response = await instance.get(`/tasks/${task.id}/comments`);

      const data = response.data?.data || response.data || [];

      setComments(data);
    } catch (error) {
      console.error(error);

      // Nếu API comments chưa có thì dùng comments trong task
      setComments(task.comments || []);
    }
  };

  const handleCloseTask = () => {
    setSelectedTask(null);
    setComments([]);
    setCommentText("");
  };

  // =========================
  // UPDATE STATUS
  // =========================

  const handleUpdateStatus = async () => {
    if (!selectedTask) return;

    try {
      setUpdatingStatus(true);

      await instance.put(`/tasks/${selectedTask.id}`, {
        status,
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                status,
                progress: status === "COMPLETED" ? 100 : task.progress,
              }
            : task,
        ),
      );

      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status,
              progress: status === "COMPLETED" ? 100 : prev.progress,
            }
          : prev,
      );

      if (status === "COMPLETED") {
        setProgress(100);
      }

      toast.success("Đã cập nhật trạng thái");
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // =========================
  // UPDATE PROGRESS
  // =========================

  const handleUpdateProgress = async () => {
    if (!selectedTask) return;

    const value = Number(progress);

    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Tiến độ phải nằm trong khoảng 0 - 100%");
      return;
    }

    try {
      setUpdatingProgress(true);

      const newStatus = value === 100 ? "COMPLETED" : status;

      await instance.put(`/tasks/${selectedTask.id}/progress`, {
        progress: value,
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                progress: value,
                status: newStatus,
              }
            : task,
        ),
      );

      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              progress: value,
              status: newStatus,
            }
          : prev,
      );

      setStatus(newStatus);

      toast.success("Đã cập nhật tiến độ");
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Không thể cập nhật tiến độ",
      );
    } finally {
      setUpdatingProgress(false);
    }
  };

  // =========================
  // ADD COMMENT
  // =========================

  const handleAddComment = async () => {
    if (!selectedTask) return;

    const content = commentText.trim();

    if (!content) {
      toast.error("Vui lòng nhập nội dung trao đổi");
      return;
    }

    try {
      setSendingComment(true);

      const response = await instance.post(
        `/tasks/${selectedTask.id}/comments`,
        {
          content,
        },
      );

      const newComment = response.data?.data || response.data;

      setComments((prev) => [...prev, newComment]);

      setCommentText("");

      toast.success("Đã gửi trao đổi");
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Không thể gửi trao đổi");
    } finally {
      setSendingComment(false);
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Công việc của tôi</h1>

        <p className="text-gray-500 mt-1">
          Xem và cập nhật các công việc được giao
        </p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* STATUS */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2.5 outline-none"
            >
              <option value="">Tất cả trạng thái</option>

              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* PRIORITY */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border rounded-lg px-3 py-2.5 outline-none"
          >
            <option value="">Tất cả ưu tiên</option>

            {PRIORITY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TASK LIST */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            Đang tải công việc...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-3" />

            <p className="text-gray-500">Không có công việc phù hợp</p>
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
                    Ưu tiên
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold">
                    Trạng thái
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold">
                    Tiến độ
                  </th>

                  <th className="text-center px-5 py-4 text-sm font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {/* TASK */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">
                        {task.name}
                      </div>

                      <div className="text-sm text-gray-500 mt-1">
                        {task.projectName}
                      </div>
                    </td>

                    {/* DEADLINE */}
                    <td className="px-5 py-4">
                      <div
                        className={`flex items-center gap-2 ${
                          isOverdue(task) ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        <CalendarDays size={16} />

                        <span>{formatDate(task.deadline)}</span>
                      </div>

                      {isOverdue(task) && (
                        <span className="text-xs text-red-600 font-medium">
                          Đã quá hạn
                        </span>
                      )}
                    </td>

                    {/* PRIORITY */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityClass(
                          task.priority,
                        )}`}
                      >
                        <Flag size={13} />

                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(
                          task.status,
                        )}`}
                      >
                        {getStatusLabel(task.status)}
                      </span>
                    </td>

                    {/* PROGRESS */}
                    <td className="px-5 py-4 min-w-[160px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Tiến độ</span>

                        <span className="font-semibold">{task.progress}%</span>
                      </div>

                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${task.progress}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleOpenTask(task)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        <Eye size={16} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================
          DETAIL MODAL
      ========================= */}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedTask.name}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedTask.projectName}
                </p>
              </div>

              <button
                onClick={handleCloseTask}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* DESCRIPTION */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Mô tả</h3>

                <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                  {selectedTask.description || "Không có mô tả"}
                </div>
              </div>

              {/* INFORMATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <CalendarDays size={16} />
                    Deadline
                  </div>

                  <div
                    className={
                      isOverdue(selectedTask)
                        ? "text-red-600 font-semibold"
                        : "font-medium"
                    }
                  >
                    {formatDate(selectedTask.deadline)}
                  </div>

                  {isOverdue(selectedTask) && (
                    <div className="text-xs text-red-500 mt-1">
                      Công việc đã quá hạn
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Flag size={16} />
                    Độ ưu tiên
                  </div>

                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityClass(
                      selectedTask.priority,
                    )}`}
                  >
                    {getPriorityLabel(selectedTask.priority)}
                  </span>
                </div>
              </div>

              {/* STATUS */}
              <div className="border rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Cập nhật trạng thái
                </h3>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2.5"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingStatus ? "Đang lưu..." : "Lưu trạng thái"}
                  </button>
                </div>
              </div>

              {/* PROGRESS */}
              <div className="border rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    Cập nhật tiến độ
                  </h3>

                  <span className="font-bold text-blue-600">{progress}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full"
                />

                <div className="flex gap-3 mt-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-32 border rounded-lg px-3 py-2"
                  />

                  <button
                    onClick={handleUpdateProgress}
                    disabled={updatingProgress}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {updatingProgress ? "Đang lưu..." : "Lưu tiến độ"}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Khi đạt 100%, hệ thống tự chuyển trạng thái thành "Hoàn
                  thành".
                </p>
              </div>

              {/* COMMENTS */}
              <div className="border rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Ghi chú / Trao đổi
                </h3>

                {/* COMMENT LIST */}
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Chưa có trao đổi nào.
                    </p>
                  ) : (
                    comments.map((comment, index) => (
                      <div
                        key={comment.id || index}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User size={15} className="text-gray-500" />

                          <span className="font-medium text-sm">
                            {comment.user?.name ||
                              comment.userName ||
                              comment.user?.fullName ||
                              "Thành viên"}
                          </span>

                          <span className="text-xs text-gray-400">
                            {formatDate(
                              comment.createdAt || comment.created_at,
                            )}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* COMMENT INPUT */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment();
                      }
                    }}
                    placeholder="Nhập ghi chú hoặc trao đổi..."
                    className="flex-1 border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    onClick={handleAddComment}
                    disabled={sendingComment}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberTasks;
