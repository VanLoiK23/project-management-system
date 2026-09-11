import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Calendar,
  UserRound,
  Flag,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Users,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../utils/axios.customize";

// =========================================================
// OPTIONS
// =========================================================

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Chưa bắt đầu" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "DONE", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Hủy" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

// =========================================================
// INITIAL FORM
// =========================================================

function createInitialForm() {
  return {
    name: "",
    description: "",
    deadline: "",
    priority: "MEDIUM",
    assigneeIds: [],
  };
}

// =========================================================
// RESPONSE
// =========================================================

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

// =========================================================
// NORMALIZE MEMBER
// =========================================================
//
// Backend project member có thể trả:
//
// {
//   id: 120,
//   projectId: 1,
//   userId: 30002,
//   userFullName: "haqtv",
//   userEmail: "haqtv@gmail.com",
//   role: "PM",
//   userStatus: "ACTIVE"
// }
//
// QUAN TRỌNG:
// - id của normalized member = USER ID
// - không dùng id của project_members
// =========================================================

function normalizeMember(member) {
  if (!member) return null;

  const rawUserId = member.userId ?? member.id;
  const userId = Number(rawUserId);

  if (!Number.isFinite(userId)) {
    return null;
  }

  return {
    ...member,

    // User ID thật
    id: userId,
    userId,

    // Backend project member
    fullName: member.userFullName ?? member.fullName ?? member.name ?? "",

    email: member.userEmail ?? member.email ?? "",

    role: member.role ?? "",
    status: member.userStatus ?? member.status ?? "",
  };
}

// =========================================================
// NORMALIZE TASK
// =========================================================

function normalizeTask(task) {
  if (!task) return null;

  const taskId = Number(task.id);

  if (!Number.isFinite(taskId)) {
    return null;
  }

  return {
    ...task,

    id: taskId,

    name: task.name ?? task.title ?? "",

    description: task.description ?? "",

    deadline: task.deadline ?? null,

    priority: task.priority ?? "MEDIUM",

    status: task.status ?? "NOT_STARTED",

    progressPercent: Math.min(
      Math.max(Number(task.progressPercent ?? 0), 0),
      100,
    ),

    assignees: Array.isArray(task.assignees)
      ? task.assignees.map(normalizeMember).filter(Boolean)
      : [],

    comments: Array.isArray(task.comments) ? task.comments : [],
  };
}

// =========================================================
// HELPERS
// =========================================================

function statusLabel(status) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label || status || "—"
  );
}

function priorityLabel(priority) {
  return (
    PRIORITY_OPTIONS.find((item) => item.value === priority)?.label ||
    priority ||
    "—"
  );
}

function statusClass(status) {
  switch (status) {
    case "NOT_STARTED":
      return "bg-slate-100 text-slate-700 ring-slate-500/20";

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700 ring-blue-500/20";

    case "PENDING":
      return "bg-amber-100 text-amber-700 ring-amber-500/20";

    case "DONE":
      return "bg-emerald-100 text-emerald-700 ring-emerald-500/20";

    case "CANCELLED":
      return "bg-rose-100 text-rose-700 ring-rose-500/20";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

function priorityClass(priority) {
  switch (priority) {
    case "LOW":
      return "text-slate-500";

    case "MEDIUM":
      return "text-blue-600";

    case "HIGH":
      return "text-orange-600";

    case "URGENT":
      return "text-rose-600";

    default:
      return "text-slate-500";
  }
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isOverdue(task) {
  if (!task?.deadline) return false;

  if (task.status === "DONE" || task.status === "CANCELLED") {
    return false;
  }

  const deadline = new Date(task.deadline);

  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  return deadline < new Date();
}

function getInitials(name) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// =========================================================
// MAIN
// =========================================================

export default function PmTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [form, setForm] = useState(createInitialForm);

  const [assignIds, setAssignIds] = useState([]);

  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const response = await axios.get("/projects");

      const data = getResponseData(response);

      const projectList = Array.isArray(data) ? data : [];

      setProjects(projectList);

      if (projectList.length === 0) {
        setSelectedProjectId("");
        return;
      }

      setSelectedProjectId((currentId) => {
        const exists = projectList.some(
          (project) => String(project.id) === String(currentId),
        );

        return exists ? currentId : String(projectList[0].id);
      });
    } catch (error) {
      console.error("Load projects error:", error);

      setProjects([]);
      setSelectedProjectId("");

      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách dự án.",
      );
    }
  }

  // =========================================================
  // PROJECT CHANGE
  // =========================================================

  function handleProjectChange(e) {
    const projectId = e.target.value;

    setSelectedProjectId(projectId);

    setTasks([]);
    setMembers([]);

    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");

    setSelectedTask(null);
    setEditingTask(null);

    setShowModal(false);
    setShowDetail(false);
    setShowAssignModal(false);
    setShowCommentModal(false);

    setAssignIds([]);
    setComment("");
    setError("");
  }

  // =========================================================
  // LOAD TASKS + MEMBERS
  // =========================================================

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setMembers([]);
      return;
    }

    loadTasks();
    loadMembers();
  }, [selectedProjectId]);

  // =========================================================
  // LOAD TASKS
  // =========================================================

  async function loadTasks() {
    setLoading(true);

    try {
      const response = await axios.get(`/projects/${selectedProjectId}/tasks`);

      const data = getResponseData(response);

      const taskList = Array.isArray(data)
        ? data.map(normalizeTask).filter(Boolean)
        : [];

      setTasks(taskList);
    } catch (error) {
      console.error("Load tasks error:", error);

      setTasks([]);

      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách công việc.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOAD MEMBERS
  // =========================================================

  async function loadMembers() {
    try {
      const response = await axios.get(
        `/projects/${selectedProjectId}/members`,
      );

      const data = getResponseData(response);

      const memberList = Array.isArray(data)
        ? data.map(normalizeMember).filter(Boolean)
        : [];

      setMembers(memberList);

      console.log("========== PROJECT MEMBERS ==========");

      console.log("Project ID:", selectedProjectId);

      console.log("Raw response:", response?.data);

      console.log("Normalized members:", memberList);

      memberList.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          id: member.id,
          userId: member.userId,
          fullName: member.fullName,
          email: member.email,
          role: member.role,
          status: member.status,
        });
      });

      console.log("=====================================");
    } catch (error) {
      console.error("Load members error:", error);

      setMembers([]);

      toast.error(
        error?.response?.data?.message || "Không thể tải thành viên dự án.",
      );
    }
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredTasks = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return tasks.filter((task) => {
      const taskName = String(task.name || "").toLowerCase();

      const description = String(task.description || "").toLowerCase();

      const matchKeyword =
        !keyword || taskName.includes(keyword) || description.includes(keyword);

      const matchStatus = !statusFilter || task.status === statusFilter;

      const matchPriority = !priorityFilter || task.priority === priorityFilter;

      const matchAssignee =
        !assigneeFilter ||
        task.assignees?.some(
          (member) => String(member.id) === String(assigneeFilter),
        );

      return matchKeyword && matchStatus && matchPriority && matchAssignee;
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter]);

  // =========================================================
  // CREATE
  // =========================================================

  function openCreateModal() {
    if (!selectedProjectId) {
      toast.warning("Vui lòng chọn dự án.");
      return;
    }

    setEditingTask(null);
    setForm(createInitialForm());
    setError("");
    setShowModal(true);
  }

  // =========================================================
  // EDIT
  // =========================================================

  function openEditModal(task) {
    if (!task) return;

    setEditingTask(task);

    setForm({
      name: task.name || "",

      description: task.description || "",

      deadline: task.deadline ? String(task.deadline).substring(0, 16) : "",

      priority: task.priority || "MEDIUM",

      assigneeIds: task.assignees?.map((member) => Number(member.id)) || [],
    });

    setError("");
    setShowModal(true);
  }

  // =========================================================
  // FORM CHANGE
  // =========================================================

  function handleFormChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  }

  // =========================================================
  // TOGGLE ASSIGNEE
  // =========================================================

  function toggleAssignee(memberId) {
    const id = Number(memberId);

    if (!Number.isFinite(id)) return;

    setForm((prev) => {
      const exists = prev.assigneeIds.includes(id);

      return {
        ...prev,

        assigneeIds: exists
          ? prev.assigneeIds.filter((item) => item !== id)
          : [...prev.assigneeIds, id],
      };
    });
  }

  function toggleAssignMember(memberId) {
    const id = Number(memberId);

    if (!Number.isFinite(id)) return;

    setAssignIds((prev) => {
      const exists = prev.includes(id);

      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  }

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!selectedProjectId && !editingTask) {
      setError("Vui lòng chọn dự án.");
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Tên công việc không được để trống.");
      return;
    }

    if (!form.deadline) {
      setError("Vui lòng chọn deadline.");
      return;
    }

    const deadline = new Date(form.deadline);

    if (Number.isNaN(deadline.getTime())) {
      setError("Deadline không hợp lệ.");
      return;
    }

    if (deadline <= new Date()) {
      setError("Deadline phải sau thời điểm hiện tại.");
      return;
    }

    const payload = {
      name,

      description: form.description.trim(),

      deadline: form.deadline,

      priority: form.priority,

      assigneeIds: form.assigneeIds
        .map(Number)
        .filter((id) => Number.isFinite(id)),
    };

    try {
      // =====================================================
      // UPDATE
      // =====================================================

      if (editingTask) {
        const response = await axios.put(`/tasks/${editingTask.id}`, payload);

        const updatedData = getResponseData(response);

        const fallbackAssignees = members.filter((member) =>
          payload.assigneeIds.includes(Number(member.id)),
        );

        const updatedTask = normalizeTask({
          ...editingTask,

          ...(updatedData || {}),

          id: updatedData?.id ?? editingTask.id,

          name: updatedData?.name ?? updatedData?.title ?? payload.name,

          description: updatedData?.description ?? payload.description,

          deadline: updatedData?.deadline ?? payload.deadline,

          priority: updatedData?.priority ?? payload.priority,

          assignees: updatedData?.assignees ?? fallbackAssignees,

          status: updatedData?.status ?? editingTask.status ?? "NOT_STARTED",

          progressPercent:
            updatedData?.progressPercent ?? editingTask.progressPercent ?? 0,

          comments: updatedData?.comments ?? editingTask.comments ?? [],
        });

        setTasks((prev) =>
          prev.map((task) => (task.id === editingTask.id ? updatedTask : task)),
        );

        setSelectedTask((prev) =>
          prev?.id === editingTask.id ? updatedTask : prev,
        );

        toast.success("Cập nhật công việc thành công.");
      }

      // =====================================================
      // CREATE
      // =====================================================
      else {
        const response = await axios.post(
          `/projects/${selectedProjectId}/tasks`,
          payload,
        );

        const createdData = getResponseData(response);

        if (!createdData?.id) {
          await loadTasks();
        } else {
          const fallbackAssignees = members.filter((member) =>
            payload.assigneeIds.includes(Number(member.id)),
          );

          const createdTask = normalizeTask({
            ...createdData,

            name: createdData.name ?? createdData.title ?? payload.name,

            description: createdData.description ?? payload.description,

            deadline: createdData.deadline ?? payload.deadline,

            priority: createdData.priority ?? payload.priority,

            status: createdData.status ?? "NOT_STARTED",

            progressPercent: createdData.progressPercent ?? 0,

            assignees: createdData.assignees ?? fallbackAssignees,

            comments: createdData.comments ?? [],
          });

          if (createdTask) {
            setTasks((prev) => [createdTask, ...prev]);
          } else {
            await loadTasks();
          }
        }

        toast.success("Thêm công việc thành công.");
      }

      setShowModal(false);
      setEditingTask(null);
      setForm(createInitialForm());
      setError("");
    } catch (error) {
      console.error("Save task error:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể lưu công việc.";

      setError(message);
      toast.error(message);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async function handleDelete(task) {
    if (!task) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa công việc "${task.name}" không?`,
    );

    if (!confirmed) return;

    try {
      await axios.delete(`/tasks/${task.id}`);

      setTasks((prev) => prev.filter((item) => item.id !== task.id));

      if (selectedTask?.id === task.id) {
        setSelectedTask(null);
        setShowDetail(false);
        setShowAssignModal(false);
        setShowCommentModal(false);
      }

      toast.success("Xóa công việc thành công.");
    } catch (error) {
      console.error("Delete task error:", error);

      toast.error(error?.response?.data?.message || "Không thể xóa công việc.");
    }
  }

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  async function updateStatus(task, status) {
    if (!task || !status) return;

    try {
      const response = await axios.put(`/tasks/${task.id}/status`, { status });

      const responseTask = getResponseData(response);

      const updatedTask = normalizeTask({
        ...task,

        ...(responseTask || {}),

        status: responseTask?.status ?? status,

        progressPercent:
          responseTask?.progressPercent ??
          (status === "DONE" ? 100 : (task.progressPercent ?? 0)),
      });

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? updatedTask : item)),
      );

      setSelectedTask((prev) => (prev?.id === task.id ? updatedTask : prev));

      toast.success("Đã cập nhật trạng thái.");
    } catch (error) {
      console.error("Update status error:", error);

      toast.error(
        error?.response?.data?.message || "Không thể cập nhật trạng thái.",
      );
    }
  }

  // =========================================================
  // UPDATE PROGRESS
  // =========================================================

  async function updateProgress(task, progress) {
    if (!task) return;

    const value = Number(progress);

    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast.error("Tiến độ phải từ 0 đến 100%.");
      return;
    }

    try {
      const response = await axios.put(`/tasks/${task.id}/progress`, {
        progressPercent: value,
      });

      const responseTask = getResponseData(response);

      const newStatus =
        value === 100 ? "DONE" : value > 0 ? "IN_PROGRESS" : "NOT_STARTED";

      const updatedTask = normalizeTask({
        ...task,

        ...(responseTask || {}),

        progressPercent: responseTask?.progressPercent ?? value,

        status: responseTask?.status ?? newStatus,
      });

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? updatedTask : item)),
      );

      setSelectedTask((prev) => (prev?.id === task.id ? updatedTask : prev));
    } catch (error) {
      console.error("Update progress error:", error);

      toast.error(
        error?.response?.data?.message || "Không thể cập nhật tiến độ.",
      );
    }
  }

  // =========================================================
  // OPEN ASSIGN
  // =========================================================

  function openAssign(task) {
    if (!task) return;

    setSelectedTask(task);

    setAssignIds(task.assignees?.map((member) => Number(member.id)) || []);

    setShowAssignModal(true);
  }

  // =========================================================
  // ASSIGN
  // =========================================================

  async function handleAssign() {
    if (!selectedTask) return;

    try {
      const assigneeIds = assignIds
        .map(Number)
        .filter((id) => Number.isFinite(id));

      const response = await axios.put(`/tasks/${selectedTask.id}/assignees`, {
        assigneeIds,
      });

      const responseTask = getResponseData(response);

      const selectedMembers = members.filter((member) =>
        assigneeIds.includes(Number(member.id)),
      );

      const updatedTask = normalizeTask({
        ...selectedTask,

        ...(responseTask || {}),

        assignees: responseTask?.assignees ?? selectedMembers,
      });

      setTasks((prev) =>
        prev.map((task) => (task.id === selectedTask.id ? updatedTask : task)),
      );

      setSelectedTask(updatedTask);

      setAssignIds(assigneeIds);

      setShowAssignModal(false);

      toast.success("Đã cập nhật người thực hiện.");
    } catch (error) {
      console.error("Assign task error:", error);

      toast.error(
        error?.response?.data?.message || "Không thể phân công công việc.",
      );
    }
  }

  // =========================================================
  // LOAD COMMENTS
  // =========================================================

  async function loadComments(task) {
    if (!task) return;

    try {
      const response = await axios.get(`/tasks/${task.id}/comments`);

      const data = getResponseData(response);

      const comments = Array.isArray(data) ? data : [];

      setSelectedTask((prev) =>
        prev?.id === task.id
          ? {
              ...prev,
              comments,
            }
          : prev,
      );

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? {
                ...item,
                comments,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Load comments error:", error);

      toast.error(error?.response?.data?.message || "Không thể tải ghi chú.");
    }
  }

  // =========================================================
  // ADD COMMENT
  // =========================================================

  async function handleAddComment() {
    if (!selectedTask) {
      return false;
    }

    const content = comment.trim();

    if (!content) {
      toast.warning("Vui lòng nhập nội dung trao đổi.");

      return false;
    }

    try {
      const response = await axios.post(`/tasks/${selectedTask.id}/comments`, {
        content,
      });

      const newComment = getResponseData(response);

      if (newComment) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === selectedTask.id
              ? {
                  ...task,
                  comments: [...(task.comments || []), newComment],
                }
              : task,
          ),
        );

        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                comments: [...(prev.comments || []), newComment],
              }
            : prev,
        );
      } else {
        await loadComments(selectedTask);
      }

      setComment("");

      toast.success("Đã gửi trao đổi.");

      return true;
    } catch (error) {
      console.error("Add comment error:", error);

      toast.error(error?.response?.data?.message || "Không thể gửi trao đổi.");

      return false;
    }
  }

  // =========================================================
  // OPEN DETAIL
  // =========================================================

  async function openDetail(task) {
    if (!task) return;

    setSelectedTask(task);
    setShowDetail(true);

    await loadComments(task);
  }

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter((task) => task.status === "DONE").length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const overdueTasks = tasks.filter(isOverdue).length;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý công việc
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý, phân công và theo dõi tiến độ công việc trong dự án.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={!selectedProjectId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Thêm công việc
        </button>
      </div>

      {/* PROJECT */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="max-w-md">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Dự án
          </label>

          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              disabled={projects.length === 0}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 disabled:bg-slate-50"
            >
              <option value="">-- Chọn dự án --</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng công việc"
          value={totalTasks}
          icon={<CheckCircle2 />}
        />

        <StatCard
          title="Đang thực hiện"
          value={inProgressTasks}
          icon={<Clock3 />}
        />

        <StatCard
          title="Hoàn thành"
          value={completedTasks}
          icon={<CheckCircle2 />}
        />

        <StatCard title="Quá hạn" value={overdueTasks} icon={<Calendar />} />
      </div>

      {/* FILTER */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-navy-500 focus:bg-white focus:ring-2 focus:ring-navy-500/20"
            />
          </div>

          <SelectFilter
            icon={<Filter />}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            options={STATUS_OPTIONS}
          />

          <SelectFilter
            icon={<Flag />}
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="Độ ưu tiên"
            options={PRIORITY_OPTIONS}
          />

          <SelectFilter
            icon={<UserRound />}
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            placeholder="Người thực hiện"
            options={members.map((member) => ({
              value: String(member.id),
              label: member.fullName || member.email || `User ${member.id}`,
            }))}
          />
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Danh sách công việc
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredTasks.length} công việc
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Công việc</th>

                <th className="px-6 py-4 font-semibold">Người thực hiện</th>

                <th className="px-6 py-4 font-semibold">Deadline</th>

                <th className="px-6 py-4 font-semibold">Ưu tiên</th>

                <th className="px-6 py-4 font-semibold">Trạng thái</th>

                <th className="px-6 py-4 font-semibold">Tiến độ</th>

                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Đang tải danh sách công việc...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="mb-3 h-10 w-10 text-slate-300" />

                      <p className="font-medium text-slate-600">
                        Không có công việc
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Hãy thêm công việc mới hoặc thay đổi bộ lọc.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="transition hover:bg-slate-50">
                    {/* TASK */}

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openDetail(task)}
                        className="text-left"
                      >
                        <p className="font-semibold text-slate-900 hover:text-navy-600">
                          {task.name || "Không có tên"}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {task.description || "Không có mô tả"}
                        </p>
                      </button>
                    </td>

                    {/* ASSIGNEES */}

                    <td className="px-6 py-4">
                      {task.assignees?.length ? (
                        <div className="flex -space-x-2">
                          {task.assignees.map((member) => (
                            <div
                              key={member.id}
                              title={member.fullName || member.email}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-[10px] font-bold text-white ring-2 ring-white"
                            >
                              {getInitials(member.fullName || member.email)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Chưa phân công
                        </span>
                      )}
                    </td>

                    {/* DEADLINE */}

                    <td className="px-6 py-4">
                      <div
                        className={
                          isOverdue(task) ? "text-rose-600" : "text-slate-600"
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />

                          <span className="text-xs font-medium">
                            {formatDate(task.deadline)}
                          </span>
                        </div>

                        {isOverdue(task) && (
                          <span className="mt-1 block text-[11px] font-semibold">
                            Quá hạn
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PRIORITY */}

                    <td className="px-6 py-4">
                      <div
                        className={`flex items-center gap-2 text-xs font-semibold ${priorityClass(
                          task.priority,
                        )}`}
                      >
                        <Flag className="h-4 w-4" />

                        {priorityLabel(task.priority)}
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(
                          task.status,
                        )}`}
                      >
                        {statusLabel(task.status)}
                      </span>
                    </td>

                    {/* PROGRESS */}

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-navy-600 transition-all"
                            style={{
                              width: `${Math.min(
                                Math.max(Number(task.progressPercent ?? 0), 0),
                                100,
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs font-semibold text-slate-600">
                          {task.progressPercent ?? 0}%
                        </span>
                      </div>
                    </td>

                    {/* ACTION */}

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Sửa"
                          onClick={() => openEditModal(task)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Phân công"
                          onClick={() => openAssign(task)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <Users className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Xóa"
                          onClick={() => handleDelete(task)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Chi tiết"
                          onClick={() => openDetail(task)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CREATE / EDIT MODAL */}
      {/* ========================================================= */}

      {showModal && (
        <Modal
          title={editingTask ? "Sửa công việc" : "Thêm công việc"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* NAME */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                  Tên công việc <span className="text-rose-500">*</span>
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Nhập tên công việc"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                  Mô tả
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Nhập mô tả công việc"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                />
              </div>

              {/* DEADLINE + PRIORITY */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    Deadline <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      name="deadline"
                      type="datetime-local"
                      value={form.deadline}
                      onChange={handleFormChange}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    Độ ưu tiên
                  </label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  >
                    {PRIORITY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MEMBERS */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Người thực hiện
                </label>

                <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {members.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Chưa có thành viên.
                    </p>
                  ) : (
                    members.map((member) => {
                      const memberId = Number(member.id);

                      return (
                        <label
                          key={memberId}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={form.assigneeIds.includes(memberId)}
                            onChange={() => toggleAssignee(memberId)}
                            className="h-4 w-4 rounded border-slate-300"
                          />

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                            {getInitials(member.fullName || member.email)}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {member.fullName || "Không có tên"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {member.email || "Không có email"}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-500/20">
                  {error}
                </div>
              )}
            </div>

            {/* BUTTONS */}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="h-11 rounded-xl bg-navy-700 px-5 text-sm font-semibold text-white hover:bg-navy-800"
              >
                {editingTask ? "Lưu thay đổi" : "Tạo công việc"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* DETAIL MODAL */}
      {/* ========================================================= */}

      {showDetail && selectedTask && (
        <Modal
          title="Chi tiết công việc"
          onClose={() => setShowDetail(false)}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {selectedTask.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {selectedTask.description || "Không có mô tả."}
              </p>
            </div>

            {/* INFO */}

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={<Calendar />}
                label="Deadline"
                value={formatDate(selectedTask.deadline)}
              />

              <InfoItem
                icon={<Flag />}
                label="Độ ưu tiên"
                value={priorityLabel(selectedTask.priority)}
              />

              <InfoItem
                icon={<Clock3 />}
                label="Trạng thái"
                value={statusLabel(selectedTask.status)}
              />

              <InfoItem
                icon={<Users />}
                label="Người thực hiện"
                value={
                  selectedTask.assignees?.length
                    ? selectedTask.assignees
                        .map((member) => member.fullName || member.email)
                        .join(", ")
                    : "Chưa phân công"
                }
              />
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Cập nhật trạng thái
              </label>

              <select
                value={selectedTask.status || "NOT_STARTED"}
                onChange={(e) => updateStatus(selectedTask, e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-navy-500"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* PROGRESS */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">
                  Tiến độ
                </label>

                <span className="text-sm font-bold text-navy-700">
                  {selectedTask.progressPercent ?? 0}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={selectedTask.progressPercent ?? 0}
                onChange={(e) => updateProgress(selectedTask, e.target.value)}
                className="w-full accent-navy-600"
              />

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-navy-600 transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(Number(selectedTask.progressPercent ?? 0), 0),
                      100,
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Khi đạt 100%, hệ thống tự chuyển sang trạng thái Hoàn thành.
              </p>
            </div>

            {/* COMMENTS */}

            <div className="border-t border-slate-100 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-navy-600" />

                  <h3 className="font-semibold text-slate-900">
                    Ghi chú / trao đổi
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setComment("");
                    setShowCommentModal(true);
                  }}
                  className="rounded-lg bg-navy-50 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-100"
                >
                  Thêm ghi chú
                </button>
              </div>

              <div className="space-y-3">
                {selectedTask.comments?.length ? (
                  selectedTask.comments.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <p className="text-sm text-slate-700">{item.content}</p>

                      {item.createdAt && (
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(item.createdAt)}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Chưa có trao đổi nào.
                  </p>
                )}
              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setShowDetail(false);
                  openEditModal(selectedTask);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Sửa
              </button>

              <button
                type="button"
                onClick={() => openAssign(selectedTask)}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
              >
                <Users className="h-4 w-4" />
                Phân công
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* ASSIGN MODAL */}
      {/* ========================================================= */}

      {showAssignModal && selectedTask && (
        <Modal
          title="Phân công người thực hiện"
          onClose={() => setShowAssignModal(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Chọn một hoặc nhiều thành viên trong dự án.
            </p>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-sm text-slate-400">Chưa có thành viên.</p>
              ) : (
                members.map((member) => {
                  const memberId = Number(member.id);

                  return (
                    <label
                      key={memberId}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={assignIds.includes(memberId)}
                        onChange={() => toggleAssignMember(memberId)}
                        className="h-4 w-4"
                      />

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                        {getInitials(member.fullName || member.email)}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {member.fullName || "Không có tên"}
                        </p>

                        <p className="text-xs text-slate-400">
                          {member.email || "Không có email"}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleAssign}
                className="rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Lưu phân công
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* COMMENT MODAL */}
      {/* ========================================================= */}

      {showCommentModal && (
        <Modal
          title="Thêm ghi chú / trao đổi"
          onClose={() => setShowCommentModal(false)}
        >
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Nhập nội dung trao đổi..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCommentModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={async () => {
                  const success = await handleAddComment();

                  if (success) {
                    setShowCommentModal(false);
                  }
                }}
                className="rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Gửi
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({ title, value, icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="absolute right-0 top-0 h-full w-1 bg-navy-600" />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className="text-navy-600">{icon}</div>
      </div>

      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// =========================================================
// SELECT FILTER
// =========================================================

function SelectFilter({ icon, value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-8 text-sm outline-none focus:border-navy-500 focus:bg-white"
      >
        <option value="">{placeholder}</option>

        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// =========================================================
// MODAL
// =========================================================

function Modal({ title, children, onClose, maxWidth = "max-w-xl" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// =========================================================
// INFO ITEM
// =========================================================

function InfoItem({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-xs font-medium">{label}</span>
      </div>

      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
