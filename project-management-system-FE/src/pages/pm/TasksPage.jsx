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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutList,
  KanbanSquare,
  AlertTriangle,
  Circle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../utils/axios.customize";

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

const STATUS_TRANSITIONS = {
  NOT_STARTED: ["NOT_STARTED", "IN_PROGRESS", "CANCELLED"],
  PENDING: ["PENDING", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "PENDING", "DONE", "CANCELLED"],
  DONE: ["DONE"],
  CANCELLED: ["CANCELLED"],
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function createInitialForm() {
  return {
    name: "",
    description: "",
    deadline: "",
    priority: "MEDIUM",
    assigneeIds: [],
  };
}

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}

function getCurrentDateTimeString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getProjectStartDateTime(project) {
  if (!project?.startDate) {
    return null;
  }

  const value = String(project.startDate).substring(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return `${value}T00:00`;
}

function getProjectEndDateTime(project) {
  if (!project?.endDate) {
    return null;
  }

  const value = String(project.endDate).substring(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return `${value}T23:59`;
}

function getMinDeadline(project) {
  const now = getCurrentDateTimeString();
  const projectStart = getProjectStartDateTime(project);

  if (!projectStart) {
    return now;
  }

  return projectStart > now ? projectStart : now;
}

function getMaxDeadline(project) {
  return getProjectEndDateTime(project);
}

function normalizeMember(member) {
  if (!member) {
    return null;
  }

  const nestedUser = member.user || {};

  const rawUserId =
    member.userId ??
    nestedUser.id ??
    member.id;

  const userId = Number(rawUserId);

  if (!Number.isFinite(userId)) {
    return null;
  }

  return {
    ...member,
    id: userId,
    userId,
    fullName:
      member.userFullName ??
      nestedUser.fullName ??
      member.fullName ??
      member.name ??
      "",
    email:
      member.userEmail ??
      nestedUser.email ??
      member.email ??
      "",
    role: member.role ?? "",
    status:
      member.userStatus ??
      nestedUser.status ??
      member.status ??
      "",
  };
}

function normalizeTask(task) {
  if (!task) {
    return null;
  }

  const taskId = Number(task.id);

  if (!Number.isFinite(taskId)) {
    return null;
  }

  const rawProgress = Number(
    task.progressPercent ??
      task.progress ??
      task.progressPercentage ??
      0
  );

  const progressPercent = Math.min(
    Math.max(Number.isFinite(rawProgress) ? rawProgress : 0, 0),
    100
  );

  let assignees = [];

  if (Array.isArray(task.assignees)) {
    assignees = task.assignees
      .map(normalizeMember)
      .filter(Boolean);
  }

  if (
    assignees.length === 0 &&
    Array.isArray(task.assigneeIds)
  ) {
    assignees = task.assigneeIds
      .map((id) =>
        normalizeMember({
          id,
        })
      )
      .filter(Boolean);
  }

  return {
    ...task,
    id: taskId,
    name: task.name ?? task.title ?? "",
    description: task.description ?? "",
    deadline: task.deadline ?? null,
    priority: task.priority ?? "MEDIUM",
    status: task.status ?? "NOT_STARTED",
    progressPercent,
    assignees,
    comments: Array.isArray(task.comments)
      ? task.comments
      : [],
  };
}

function extractPagedData(response) {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      first: true,
      last: true,
      statistics: null,
    };
  }

  return {
    content: Array.isArray(data?.content)
      ? data.content
      : [],
    page: Number(data?.page ?? data?.number ?? 0),
    size: Number(data?.size ?? data?.pageSize ?? 10),
    totalElements: Number(
      data?.totalElements ??
        data?.totalElement ??
        data?.total ??
        0
    ),
    totalPages: Number(
      data?.totalPages ??
        data?.pages ??
        0
    ),
    first:
      data?.first ??
      Number(data?.page ?? 0) === 0,
    last:
      data?.last ??
      true,
    statistics:
      data?.statistics ??
      data?.stats ??
      null,
  };
}

function statusLabel(status) {
  return (
    STATUS_OPTIONS.find(
      (item) => item.value === status
    )?.label ||
    status ||
    "—"
  );
}

function priorityLabel(priority) {
  return (
    PRIORITY_OPTIONS.find(
      (item) => item.value === priority
    )?.label ||
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

function priorityBadgeClass(priority) {
  switch (priority) {
    case "LOW":
      return "bg-slate-100 text-slate-600";

    case "MEDIUM":
      return "bg-blue-50 text-blue-700";

    case "HIGH":
      return "bg-orange-50 text-orange-700";

    case "URGENT":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

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

function formatDateTime(date) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(task) {
  if (!task?.deadline) {
    return false;
  }

  if (
    task.status === "DONE" ||
    task.status === "CANCELLED"
  ) {
    return false;
  }

  const deadline = new Date(task.deadline);

  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  return deadline < new Date();
}

function getInitials(name) {
  if (!name) {
    return "U";
  }

  const parts = String(name)
    .trim()
    .split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function isProjectManagerMember(member) {
  const role = String(member?.role || "")
    .trim()
    .toUpperCase();

  return (
    role === "PM" ||
    role === "PROJECT_MANAGER"
  );
}

function getMemberRoleLabel(role) {
  const normalized = String(role || "").toUpperCase();

  const labels = {
    PM: "Project Manager",
    DEV: "Developer",
    TESTER: "Tester",
    BA: "Business Analyst",
    OTHER: "Member",
    MEMBER: "Member",
  };

  return labels[normalized] || role || "Member";
}

function getStatusIcon(status) {
  switch (status) {
    case "NOT_STARTED":
      return <Circle className="h-4 w-4" />;

    case "PENDING":
      return <PauseCircle className="h-4 w-4" />;

    case "IN_PROGRESS":
      return <PlayCircle className="h-4 w-4" />;

    case "DONE":
      return <CheckCircle2 className="h-4 w-4" />;

    case "CANCELLED":
      return <X className="h-4 w-4" />;

    default:
      return <Circle className="h-4 w-4" />;
  }
}

export default function PmTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  const [selectedProjectId, setSelectedProjectId] =
    useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");
  const [priorityFilter, setPriorityFilter] =
    useState("");
  const [assigneeFilter, setAssigneeFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("deadline");
  const [direction, setDirection] =
    useState("asc");

  const [viewMode, setViewMode] =
    useState("list");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] =
    useState(10);

  const [totalElements, setTotalElements] =
    useState(0);
  const [totalPages, setTotalPages] =
    useState(0);

  const [statistics, setStatistics] =
    useState(null);

  const [loading, setLoading] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);
  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);
  const [showDetail, setShowDetail] =
    useState(false);
  const [showAssignModal, setShowAssignModal] =
    useState(false);
  const [showCommentModal, setShowCommentModal] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);
  const [selectedTask, setSelectedTask] =
    useState(null);
  const [taskToDelete, setTaskToDelete] =
    useState(null);

  const [form, setForm] = useState(
    createInitialForm
  );

  const [assignIds, setAssignIds] =
    useState([]);

  const [comment, setComment] =
    useState("");

  const [error, setError] =
    useState("");

  const [memberSearch, setMemberSearch] =
    useState("");

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) =>
          String(project.id) ===
          String(selectedProjectId)
      ) || null,
    [projects, selectedProjectId]
  );

  const availableMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.status !== "LOCKED" &&
          !isProjectManagerMember(member)
      ),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const keyword = memberSearch
      .trim()
      .toLowerCase();

    if (!keyword) {
      return availableMembers;
    }

    return availableMembers.filter((member) => {
      const name = String(
        member.fullName || ""
      ).toLowerCase();

      const email = String(
        member.email || ""
      ).toLowerCase();

      const role = String(
        member.role || ""
      ).toLowerCase();

      return (
        name.includes(keyword) ||
        email.includes(keyword) ||
        role.includes(keyword)
      );
    });
  }, [
    availableMembers,
    memberSearch,
  ]);

  // THAY ĐỔI: pagination + filter + sort được gửi trực tiếp lên backend.
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setMembers([]);
      setTotalElements(0);
      setTotalPages(0);
      setStatistics(null);
      return;
    }

    loadMembers();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    const timer = setTimeout(() => {
      loadTasks();
    }, search.trim() ? 350 : 0);

    return () => clearTimeout(timer);
  }, [
    selectedProjectId,
    page,
    pageSize,
    search,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    sortBy,
    direction,
  ]);

  async function loadProjects() {
    try {
      const response =
        await axios.get("/projects");

      const data = getResponseData(response);

      const projectList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      setProjects(projectList);

      if (projectList.length === 0) {
        setSelectedProjectId("");
        return;
      }

      setSelectedProjectId((currentId) => {
        const exists = projectList.some(
          (project) =>
            String(project.id) ===
            String(currentId)
        );

        return exists
          ? currentId
          : String(projectList[0].id);
      });
    } catch (error) {
      console.error(
        "Load projects error:",
        error
      );

      setProjects([]);
      setSelectedProjectId("");

      toast.error(
        getErrorMessage(
          error,
          "Không thể tải danh sách dự án."
        )
      );
    }
  }

  function handleProjectChange(e) {
    const projectId = e.target.value;

    setSelectedProjectId(projectId);

    setTasks([]);
    setMembers([]);

    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");

    setSortBy("deadline");
    setDirection("asc");

    setPage(0);

    setSelectedTask(null);
    setEditingTask(null);
    setTaskToDelete(null);

    setShowModal(false);
    setShowDetail(false);
    setShowAssignModal(false);
    setShowCommentModal(false);
    setShowDeleteModal(false);

    setAssignIds([]);
    setComment("");
    setError("");
    setMemberSearch("");
  }

  async function loadTasks() {
    if (!selectedProjectId) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `/projects/${selectedProjectId}/tasks`,
        {
          params: {
            page,
            size: pageSize,
            keyword:
              search.trim() || undefined,
            status:
              statusFilter || undefined,
            priority:
              priorityFilter || undefined,
            assigneeId:
              assigneeFilter || undefined,
            sortBy,
            direction,
          },
        }
      );

      const pagedData =
        extractPagedData(response);

      const taskList = pagedData.content
        .map(normalizeTask)
        .filter(Boolean);

      setTasks(taskList);
      setTotalElements(
        pagedData.totalElements
      );
      setTotalPages(
        pagedData.totalPages
      );
      setStatistics(
        pagedData.statistics
      );
    } catch (error) {
      console.error(
        "Load tasks error:",
        error
      );

      setTasks([]);
      setTotalElements(0);
      setTotalPages(0);
      setStatistics(null);

      toast.error(
        getErrorMessage(
          error,
          "Không thể tải danh sách công việc."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    if (!selectedProjectId) {
      return;
    }

    try {
      const response = await axios.get(
        `/projects/${selectedProjectId}/members`,
        {
          params: {
            page: 0,
            size: 100,
          },
        }
      );

      const data = getResponseData(response);

      const memberList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      setMembers(
        memberList
          .map(normalizeMember)
          .filter(Boolean)
      );
    } catch (error) {
      console.error(
        "Load members error:",
        error
      );

      setMembers([]);

      toast.error(
        getErrorMessage(
          error,
          "Không thể tải thành viên dự án."
        )
      );
    }
  }

  async function refreshData() {
    setRefreshing(true);

    try {
      await Promise.all([
        loadProjects(),
        loadTasks(),
        loadMembers(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(0);
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value);
    setPage(0);
  }

  function handlePriorityFilterChange(value) {
    setPriorityFilter(value);
    setPage(0);
  }

  function handleAssigneeFilterChange(value) {
    setAssigneeFilter(value);
    setPage(0);
  }

  function handleSortChange(e) {
    setSortBy(e.target.value);
    setPage(0);
  }

  function handleDirectionChange(e) {
    setDirection(e.target.value);
    setPage(0);
  }

  function handlePageSizeChange(e) {
    setPageSize(Number(e.target.value));
    setPage(0);
  }

  function goToPage(nextPage) {
    if (
      nextPage < 0 ||
      nextPage >= totalPages
    ) {
      return;
    }

    setPage(nextPage);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
    setSortBy("deadline");
    setDirection("asc");
    setPage(0);
  }

  function openCreateModal() {
    if (!selectedProjectId) {
      toast.warning(
        "Vui lòng chọn dự án."
      );
      return;
    }

    if (
      selectedProject?.status ===
        "CLOSED" ||
      selectedProject?.status ===
        "CANCELLED"
    ) {
      toast.warning(
        "Dự án đã đóng hoặc đã hủy, không thể tạo công việc."
      );
      return;
    }

    const minDeadline =
      getMinDeadline(selectedProject);
    const maxDeadline =
      getMaxDeadline(selectedProject);

    if (
      maxDeadline &&
      maxDeadline < minDeadline
    ) {
      toast.warning(
        "Dự án đã hết thời gian để tạo deadline mới."
      );
      return;
    }

    setEditingTask(null);
    setForm(createInitialForm());
    setError("");
    setMemberSearch("");
    setShowModal(true);
  }

  function openEditModal(task) {
    if (!task) {
      return;
    }

    if (
      selectedProject?.status ===
        "CLOSED" ||
      selectedProject?.status ===
        "CANCELLED"
    ) {
      toast.warning(
        "Dự án đã đóng hoặc đã hủy, không thể chỉnh sửa công việc."
      );
      return;
    }

    setEditingTask(task);

    setForm({
      name: task.name || "",
      description: task.description || "",
      deadline: task.deadline
        ? String(task.deadline).substring(
            0,
            16
          )
        : "",
      priority:
        task.priority || "MEDIUM",
      assigneeIds:
        task.assignees
          ?.map((member) =>
            Number(member.id)
          )
          .filter(Number.isFinite) || [],
    });

    setError("");
    setMemberSearch("");
    setShowModal(true);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function toggleAssignee(memberId) {
    const id = Number(memberId);

    if (!Number.isFinite(id)) {
      return;
    }

    setForm((prev) => {
      const exists =
        prev.assigneeIds.includes(id);

      return {
        ...prev,
        assigneeIds: exists
          ? prev.assigneeIds.filter(
              (item) => item !== id
            )
          : [...prev.assigneeIds, id],
      };
    });
  }

  function toggleAssignMember(memberId) {
    const id = Number(memberId);

    if (!Number.isFinite(id)) {
      return;
    }

    setAssignIds((prev) => {
      const exists = prev.includes(id);

      return exists
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id];
    });
  }

  // THAY ĐỔI: validation deadline kiểm tra cả thời điểm hiện tại và thời gian của project.
  function validateTaskForm() {
    const name = form.name.trim();

    if (!name) {
      return "Tên công việc không được để trống.";
    }

    if (name.length < 2) {
      return "Tên công việc phải có ít nhất 2 ký tự.";
    }

    if (name.length > 150) {
      return "Tên công việc không được vượt quá 150 ký tự.";
    }

    if (form.description.trim().length > 2000) {
      return "Mô tả không được vượt quá 2000 ký tự.";
    }

    if (!form.deadline) {
      return "Vui lòng chọn deadline.";
    }

    const deadline = new Date(
      form.deadline
    );

    if (
      Number.isNaN(deadline.getTime())
    ) {
      return "Deadline không hợp lệ.";
    }

    const now = new Date();

    if (deadline <= now) {
      return "Deadline phải sau thời điểm hiện tại.";
    }

    const minDeadline =
      getMinDeadline(selectedProject);

    if (
      minDeadline &&
      form.deadline < minDeadline
    ) {
      return "Deadline không được nằm trước thời điểm cho phép.";
    }

    const maxDeadline =
      getMaxDeadline(selectedProject);

    if (
      maxDeadline &&
      form.deadline > maxDeadline
    ) {
      return "Deadline không được vượt quá ngày kết thúc dự án.";
    }

    if (
      !PRIORITY_OPTIONS.some(
        (item) =>
          item.value === form.priority
      )
    ) {
      return "Độ ưu tiên không hợp lệ.";
    }

    const assigneeIds = form.assigneeIds
      .map(Number)
      .filter(Number.isFinite);

    if (assigneeIds.length === 0) {
      return "Vui lòng chọn ít nhất một Member để giao công việc.";
    }

    const validMemberIds =
      new Set(
        availableMembers.map((member) =>
          Number(member.id)
        )
      );

    const hasInvalidMember =
      assigneeIds.some(
        (id) => !validMemberIds.has(id)
      );

    if (hasInvalidMember) {
      return "Người thực hiện không thuộc danh sách Member hợp lệ của dự án.";
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (
      !selectedProjectId &&
      !editingTask
    ) {
      setError("Vui lòng chọn dự án.");
      return;
    }

    const validationError =
      validateTaskForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description:
        form.description.trim(),
      deadline: form.deadline,
      priority: form.priority,
      assigneeIds: form.assigneeIds
        .map(Number)
        .filter(Number.isFinite),
    };

    setSaving(true);

    try {
      if (editingTask) {
        const response =
          await axios.put(
            `/tasks/${editingTask.id}`,
            payload
          );

        const updatedData =
          getResponseData(response);

        const fallbackAssignees =
          members.filter((member) =>
            payload.assigneeIds.includes(
              Number(member.id)
            )
          );

        const updatedTask =
          normalizeTask({
            ...editingTask,
            ...(updatedData || {}),
            id:
              updatedData?.id ??
              editingTask.id,
            name:
              updatedData?.name ??
              updatedData?.title ??
              payload.name,
            description:
              updatedData?.description ??
              payload.description,
            deadline:
              updatedData?.deadline ??
              payload.deadline,
            priority:
              updatedData?.priority ??
              payload.priority,
            assignees:
              updatedData?.assignees ??
              fallbackAssignees,
            status:
              updatedData?.status ??
              editingTask.status ??
              "NOT_STARTED",
            progressPercent:
              updatedData?.progressPercent ??
              editingTask.progressPercent ??
              0,
            comments:
              updatedData?.comments ??
              editingTask.comments ??
              [],
          });

        setTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id
              ? updatedTask
              : task
          )
        );

        setSelectedTask((prev) =>
          prev?.id === editingTask.id
            ? updatedTask
            : prev
        );

        toast.success(
          "Cập nhật công việc thành công."
        );
      } else {
        const response =
          await axios.post(
            `/projects/${selectedProjectId}/tasks`,
            payload
          );

        const createdData =
          getResponseData(response);

        if (!createdData?.id) {
          await loadTasks();
        } else {
          const fallbackAssignees =
            members.filter((member) =>
              payload.assigneeIds.includes(
                Number(member.id)
              )
            );

          const createdTask =
            normalizeTask({
              ...createdData,
              name:
                createdData.name ??
                createdData.title ??
                payload.name,
              description:
                createdData.description ??
                payload.description,
              deadline:
                createdData.deadline ??
                payload.deadline,
              priority:
                createdData.priority ??
                payload.priority,
              status:
                createdData.status ??
                "NOT_STARTED",
              progressPercent:
                createdData.progressPercent ??
                0,
              assignees:
                createdData.assignees ??
                fallbackAssignees,
              comments:
                createdData.comments ?? [],
            });

          if (createdTask) {
            setTasks((prev) => [
              createdTask,
              ...prev,
            ]);
          } else {
            await loadTasks();
          }
        }

        toast.success(
          "Thêm công việc thành công."
        );
      }

      setShowModal(false);
      setEditingTask(null);
      setForm(createInitialForm());
      setError("");

      await loadTasks();
    } catch (error) {
      console.error(
        "Save task error:",
        error
      );

      const message = getErrorMessage(
        error,
        "Không thể lưu công việc."
      );

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(task) {
    if (!task) {
      return;
    }

    if (
      selectedProject?.status ===
      "CLOSED"
    ) {
      toast.warning(
        "Dự án đã đóng, không thể xóa công việc."
      );
      return;
    }

    setTaskToDelete(task);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!taskToDelete) {
      return;
    }

    try {
      await axios.delete(
        `/tasks/${taskToDelete.id}`
      );

      if (
        selectedTask?.id ===
        taskToDelete.id
      ) {
        setSelectedTask(null);
        setShowDetail(false);
        setShowAssignModal(false);
        setShowCommentModal(false);
      }

      setShowDeleteModal(false);
      setTaskToDelete(null);

      toast.success(
        "Xóa công việc thành công."
      );

      if (
        tasks.length === 1 &&
        page > 0
      ) {
        setPage((prev) => prev - 1);
      } else {
        await loadTasks();
      }
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Không thể xóa công việc."
        )
      );
    }
  }

  async function updateStatus(
    task,
    status
  ) {
    if (!task || !status) {
      return;
    }

    if (
      task.status === status
    ) {
      return;
    }

    const allowedStatuses =
      STATUS_TRANSITIONS[
        task.status
      ] || [task.status];

    if (
      !allowedStatuses.includes(status)
    ) {
      toast.warning(
        `Không thể chuyển từ "${statusLabel(
          task.status
        )}" sang "${statusLabel(
          status
        )}".`
      );
      return;
    }

    if (
      selectedProject?.status ===
        "CLOSED" ||
      selectedProject?.status ===
        "CANCELLED"
    ) {
      toast.warning(
        "Dự án đã đóng hoặc đã hủy."
      );
      return;
    }

    if (status === "DONE") {
      const confirmed =
        window.confirm(
          "Chuyển công việc sang Hoàn thành? Tiến độ sẽ được xem là 100%."
        );

      if (!confirmed) {
        return;
      }
    }

    try {
      const response =
        await axios.put(
          `/tasks/${task.id}/status`,
          { status }
        );

      const responseTask =
        getResponseData(response);

      const updatedTask =
        normalizeTask({
          ...task,
          ...(responseTask || {}),
          status:
            responseTask?.status ??
            status,
          progressPercent:
            responseTask?.progressPercent ??
            (status === "DONE"
              ? 100
              : task.progressPercent ?? 0),
        });

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? updatedTask
            : item
        )
      );

      setSelectedTask((prev) =>
        prev?.id === task.id
          ? updatedTask
          : prev
      );

      toast.success(
        "Đã cập nhật trạng thái."
      );

      await loadTasks();
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Không thể cập nhật trạng thái."
        )
      );
    }
  }

  async function updateProgress(
    task,
    progress
  ) {
    if (!task) {
      return;
    }

    const value = Number(progress);

    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 100
    ) {
      toast.error(
        "Tiến độ phải là số nguyên từ 0 đến 100%."
      );
      return;
    }

    if (
      selectedProject?.status ===
        "CLOSED" ||
      selectedProject?.status ===
        "CANCELLED"
    ) {
      toast.warning(
        "Dự án đã đóng hoặc đã hủy."
      );
      return;
    }

    try {
      const response =
        await axios.put(
          `/tasks/${task.id}/progress`,
          {
            progressPercent: value,
          }
        );

      const responseTask =
        getResponseData(response);

      const newStatus =
        value === 100
          ? "DONE"
          : value > 0
          ? "IN_PROGRESS"
          : "NOT_STARTED";

      const updatedTask =
        normalizeTask({
          ...task,
          ...(responseTask || {}),
          progressPercent:
            responseTask?.progressPercent ??
            value,
          status:
            responseTask?.status ??
            newStatus,
        });

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? updatedTask
            : item
        )
      );

      setSelectedTask((prev) =>
        prev?.id === task.id
          ? updatedTask
          : prev
      );
    } catch (error) {
      console.error(
        "Update progress error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Không thể cập nhật tiến độ."
        )
      );
    }
  }

  function openAssign(task) {
    if (!task) {
      return;
    }

    if (
      selectedProject?.status ===
        "CLOSED" ||
      selectedProject?.status ===
        "CANCELLED"
    ) {
      toast.warning(
        "Dự án đã đóng hoặc đã hủy."
      );
      return;
    }

    setSelectedTask(task);

    setAssignIds(
      task.assignees
        ?.map((member) =>
          Number(member.id)
        )
        .filter(Number.isFinite) || []
    );

    setMemberSearch("");
    setShowAssignModal(true);
  }

  async function handleAssign() {
    if (!selectedTask) {
      return;
    }

    const assigneeIds = assignIds
      .map(Number)
      .filter(Number.isFinite);

    if (assigneeIds.length === 0) {
      toast.warning(
        "Vui lòng chọn ít nhất một Member."
      );
      return;
    }

    const validMemberIds =
      new Set(
        availableMembers.map((member) =>
          Number(member.id)
        )
      );

    if (
      assigneeIds.some(
        (id) => !validMemberIds.has(id)
      )
    ) {
      toast.error(
        "Có người thực hiện không hợp lệ."
      );
      return;
    }

    try {
      const response =
        await axios.put(
          `/tasks/${selectedTask.id}/assignees`,
          {
            assigneeIds,
          }
        );

      const responseTask =
        getResponseData(response);

      const selectedMembers =
        members.filter((member) =>
          assigneeIds.includes(
            Number(member.id)
          )
        );

      const updatedTask =
        normalizeTask({
          ...selectedTask,
          ...(responseTask || {}),
          assignees:
            responseTask?.assignees ??
            selectedMembers,
        });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? updatedTask
            : task
        )
      );

      setSelectedTask(updatedTask);
      setAssignIds(assigneeIds);
      setShowAssignModal(false);

      toast.success(
        "Đã cập nhật người thực hiện."
      );

      await loadTasks();
    } catch (error) {
      console.error(
        "Assign task error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Không thể phân công công việc."
        )
      );
    }
  }

  async function loadComments(task) {
    if (!task) {
      return;
    }

    try {
      const response =
        await axios.get(
          `/tasks/${task.id}/comments`
        );

      const data =
        getResponseData(response);

      const comments = Array.isArray(
        data
      )
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      setSelectedTask((prev) =>
        prev?.id === task.id
          ? {
              ...prev,
              comments,
            }
          : prev
      );

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? {
                ...item,
                comments,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Load comments error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Không thể tải trao đổi."
        )
      );
    }
  }

  async function handleAddComment() {
    if (!selectedTask) {
      return false;
    }

    const content = comment.trim();

    if (!content) {
      toast.warning(
        "Vui lòng nhập nội dung trao đổi."
      );
      return false;
    }

    if (content.length > 2000) {
      toast.warning(
        "Nội dung trao đổi không được vượt quá 2000 ký tự."
      );
      return false;
    }

    try {
      const response =
        await axios.post(
          `/tasks/${selectedTask.id}/comments`,
          {
            content,
          }
        );

      const newComment =
        getResponseData(response);

      if (newComment) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id ===
            selectedTask.id
              ? {
                  ...task,
                  comments: [
                    ...(task.comments ||
                      []),
                    newComment,
                  ],
                }
              : task
          )
        );

        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                comments: [
                  ...(prev.comments ||
                    []),
                  newComment,
                ],
              }
            : prev
        );
      } else {
        await loadComments(
          selectedTask
        );
      }

      setComment("");

      toast.success(
        "Đã gửi trao đổi."
      );

      return true;
    } catch (error) {
      console.error(
        "Add comment error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Không thể gửi trao đổi."
        )
      );

      return false;
    }
  }

  async function openDetail(task) {
    if (!task) {
      return;
    }

    setSelectedTask(task);
    setShowDetail(true);

    await loadComments(task);
  }

  function getStatistic(
    key,
    fallback
  ) {
    if (
      statistics &&
      statistics[key] !== undefined &&
      statistics[key] !== null
    ) {
      return statistics[key];
    }

    return fallback;
  }

  const fallbackTotal =
    tasks.length;

  const fallbackCompleted =
    tasks.filter(
      (task) => task.status === "DONE"
    ).length;

  const fallbackInProgress =
    tasks.filter(
      (task) =>
        task.status === "IN_PROGRESS"
    ).length;

  const fallbackOverdue =
    tasks.filter(isOverdue).length;

  const totalTaskCount = getStatistic(
    "total",
    totalElements || fallbackTotal
  );

  const completedTaskCount =
    getStatistic(
      "completed",
      getStatistic(
        "done",
        fallbackCompleted
      )
    );

  const inProgressTaskCount =
    getStatistic(
      "inProgress",
      fallbackInProgress
    );

  const overdueTaskCount =
    getStatistic(
      "overdue",
      fallbackOverdue
    );

  const planningTaskCount =
    getStatistic(
      "notStarted",
      getStatistic(
        "pending",
        tasks.filter(
          (task) =>
            task.status ===
              "NOT_STARTED" ||
            task.status === "PENDING"
        ).length
      )
    );

  const kanbanColumns = [
    {
      status: "NOT_STARTED",
      title: "Chưa bắt đầu",
      className:
        "border-slate-200 bg-slate-50",
    },
    {
      status: "PENDING",
      title: "Chờ xử lý",
      className:
        "border-amber-200 bg-amber-50/40",
    },
    {
      status: "IN_PROGRESS",
      title: "Đang thực hiện",
      className:
        "border-blue-200 bg-blue-50/40",
    },
    {
      status: "DONE",
      title: "Hoàn thành",
      className:
        "border-emerald-200 bg-emerald-50/40",
    },
    {
      status: "CANCELLED",
      title: "Đã hủy",
      className:
        "border-rose-200 bg-rose-50/40",
    },
  ];

  const paginationPages = useMemo(() => {
    if (totalPages <= 0) {
      return [];
    }

    const pages = [];

    let start = Math.max(
      0,
      page - 2
    );

    let end = Math.min(
      totalPages - 1,
      start + 4
    );

    if (end - start < 4) {
      start = Math.max(
        0,
        end - 4
      );
    }

    for (
      let index = start;
      index <= end;
      index += 1
    ) {
      pages.push(index);
    }

    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Quản lý công việc
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Tạo, phân công, theo dõi deadline
                và tiến độ công việc của dự án.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Làm mới
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={
              !selectedProjectId
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 px-5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Thêm công việc
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Dự án
            </label>

            <div className="relative max-w-xl">
              <select
                value={
                  selectedProjectId
                }
                onChange={
                  handleProjectChange
                }
                disabled={
                  projects.length === 0
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 disabled:bg-slate-50"
              >
                <option value="">
                  -- Chọn dự án --
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  )
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {selectedProject && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${statusClass(
                  selectedProject.status
                )}`}
              >
                {getStatusIcon(
                  selectedProject.status
                )}
                {statusLabel(
                  selectedProject.status
                )}
              </span>

              {selectedProject.startDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(
                    selectedProject.startDate
                  )}
                  {" → "}
                  {formatDate(
                    selectedProject.endDate
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng công việc"
          value={totalTaskCount}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          description="Tất cả công việc"
        />

        <StatCard
          title="Đang thực hiện"
          value={inProgressTaskCount}
          icon={
            <Clock3 className="h-5 w-5" />
          }
          description="Đang được xử lý"
        />

        <StatCard
          title="Hoàn thành"
          value={completedTaskCount}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          description="Đã hoàn thành"
        />

        <StatCard
          title="Quá hạn"
          value={overdueTaskCount}
          icon={
            <AlertTriangle className="h-5 w-5" />
          }
          description="Chưa hoàn thành"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,2fr)_repeat(3,minmax(150px,1fr))_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={
                handleSearchChange
              }
              placeholder="Tìm tên hoặc mô tả công việc..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-navy-500 focus:bg-white focus:ring-2 focus:ring-navy-500/20"
            />
          </div>

          <SelectFilter
            icon={
              <Filter className="h-4 w-4" />
            }
            value={statusFilter}
            onChange={
              handleStatusFilterChange
            }
            placeholder="Trạng thái"
            options={STATUS_OPTIONS}
          />

          <SelectFilter
            icon={
              <Flag className="h-4 w-4" />
            }
            value={priorityFilter}
            onChange={
              handlePriorityFilterChange
            }
            placeholder="Độ ưu tiên"
            options={PRIORITY_OPTIONS}
          />

          <SelectFilter
            icon={
              <UserRound className="h-4 w-4" />
            }
            value={assigneeFilter}
            onChange={
              handleAssigneeFilterChange
            }
            placeholder="Người thực hiện"
            options={availableMembers.map(
              (member) => ({
                value: String(member.id),
                label:
                  member.fullName ||
                  member.email ||
                  `User ${member.id}`,
              })
            )}
          />

          <button
            type="button"
            onClick={clearFilters}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Xóa lọc
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Sắp xếp:
            </span>

            <select
              value={sortBy}
              onChange={handleSortChange}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-navy-500"
            >
              <option value="deadline">
                Deadline
              </option>
              <option value="createdAt">
                Ngày tạo
              </option>
              <option value="name">
                Tên công việc
              </option>
              <option value="priority">
                Độ ưu tiên
              </option>
              <option value="progressPercent">
                Tiến độ
              </option>
            </select>

            <select
              value={direction}
              onChange={
                handleDirectionChange
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-navy-500"
            >
              <option value="asc">
                Tăng dần
              </option>
              <option value="desc">
                Giảm dần
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() =>
                  setViewMode("list")
                }
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "bg-white text-navy-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                List
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode("kanban")
                }
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
                  viewMode === "kanban"
                    ? "bg-white text-navy-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <KanbanSquare className="h-4 w-4" />
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Danh sách công việc
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {totalElements} công việc
                {totalPages > 0
                  ? ` · Trang ${
                      page + 1
                    }/${totalPages}`
                  : ""}
              </p>
            </div>

            {selectedProject && (
              <div className="text-xs text-slate-400">
                Dự án:{" "}
                <span className="font-semibold text-slate-600">
                  {selectedProject.name}
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Công việc
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Người thực hiện
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Deadline
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Ưu tiên
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Trạng thái
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Tiến độ
                  </th>

                  <th className="px-6 py-4 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <TaskTableSkeleton
                      key={index}
                    />
                  ))
                ) : tasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <EmptyState
                        search={search}
                        hasFilter={
                          Boolean(
                            statusFilter ||
                              priorityFilter ||
                              assigneeFilter
                          )
                        }
                        onClear={
                          clearFilters
                        }
                        onCreate={
                          openCreateModal
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            openDetail(task)
                          }
                          className="block max-w-[330px] text-left"
                        >
                          <p className="truncate font-semibold text-slate-900 hover:text-navy-600">
                            {task.name ||
                              "Không có tên"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {task.description ||
                              "Không có mô tả"}
                          </p>
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        {task.assignees
                          ?.length ? (
                          <div className="flex items-center">
                            <div className="flex -space-x-2">
                              {task.assignees
                                .slice(
                                  0,
                                  4
                                )
                                .map(
                                  (
                                    member
                                  ) => (
                                    <div
                                      key={
                                        member.id
                                      }
                                      title={`${member.fullName ||
                                        member.email} · ${getMemberRoleLabel(
                                        member.role
                                      )}`}
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-[10px] font-bold text-white ring-2 ring-white"
                                    >
                                      {getInitials(
                                        member.fullName ||
                                          member.email
                                      )}
                                    </div>
                                  )
                                )}
                            </div>

                            {task.assignees
                              .length >
                              4 && (
                              <span className="ml-2 text-xs font-semibold text-slate-400">
                                +
                                {task
                                  .assignees
                                  .length -
                                  4}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Chưa phân công
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className={
                            isOverdue(
                              task
                            )
                              ? "text-rose-600"
                              : "text-slate-600"
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />

                            <span className="text-xs font-medium">
                              {formatDate(
                                task.deadline
                              )}
                            </span>
                          </div>

                          <span className="mt-1 block text-[11px]">
                            {formatDateTime(
                              task.deadline
                            )}
                          </span>

                          {isOverdue(
                            task
                          ) && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold">
                              <AlertTriangle className="h-3 w-3" />
                              Quá hạn
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${priorityBadgeClass(
                            task.priority
                          )}`}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          {priorityLabel(
                            task.priority
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(
                            task.status
                          )}`}
                        >
                          {getStatusIcon(
                            task.status
                          )}
                          {statusLabel(
                            task.status
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Tiến độ
                            </span>

                            <span className="text-xs font-bold text-navy-700">
                              {
                                task.progressPercent
                              }
                              %
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-navy-600 transition-all"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    Number(
                                      task.progressPercent ||
                                        0
                                    ),
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Sửa"
                            onClick={() =>
                              openEditModal(
                                task
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Phân công"
                            onClick={() =>
                              openAssign(
                                task
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <Users className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Xóa"
                            onClick={() =>
                              requestDelete(
                                task
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Chi tiết"
                            onClick={() =>
                              openDetail(
                                task
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
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

          {!loading &&
            totalPages > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={
                  totalElements
                }
                pageSize={pageSize}
                pageSizeOptions={
                  PAGE_SIZE_OPTIONS
                }
                pages={paginationPages}
                onPageChange={
                  goToPage
                }
                onPageSizeChange={
                  handlePageSizeChange
                }
              />
            )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Kanban công việc
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Đang hiển thị {tasks.length} công
                việc của trang hiện tại.
              </p>
            </div>

            <div className="text-xs text-slate-400">
              Tổng:{" "}
              <span className="font-semibold text-slate-600">
                {totalElements}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[1350px] grid-cols-5 gap-4">
              {kanbanColumns.map(
                (column) => {
                  const columnTasks =
                    tasks.filter(
                      (task) =>
                        task.status ===
                        column.status
                    );

                  return (
                    <div
                      key={
                        column.status
                      }
                      className={`min-h-[520px] rounded-2xl border p-3 ${column.className}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusClass(
                              column.status
                            )}`}
                          >
                            {getStatusIcon(
                              column.status
                            )}
                          </span>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {
                                column.title
                              }
                            </p>

                            <p className="text-[11px] text-slate-400">
                              {
                                columnTasks.length
                              }{" "}
                              task
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {columnTasks.length ===
                        0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center">
                            <p className="text-xs font-medium text-slate-400">
                              Không có công
                              việc
                            </p>
                          </div>
                        ) : (
                          columnTasks.map(
                            (task) => (
                              <KanbanTaskCard
                                key={
                                  task.id
                                }
                                task={
                                  task
                                }
                                onOpen={
                                  openDetail
                                }
                                onEdit={
                                  openEditModal
                                }
                                onAssign={
                                  openAssign
                                }
                                onDelete={
                                  requestDelete
                                }
                              />
                            )
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {!loading &&
            totalPages > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={
                  totalElements
                }
                pageSize={pageSize}
                pageSizeOptions={
                  PAGE_SIZE_OPTIONS
                }
                pages={paginationPages}
                onPageChange={
                  goToPage
                }
                onPageSizeChange={
                  handlePageSizeChange
                }
              />
            )}
        </div>
      )}

      {showModal && (
        <Modal
          title={
            editingTask
              ? "Sửa công việc"
              : "Tạo công việc mới"
          }
          onClose={() => {
            if (!saving) {
              setShowModal(false);
            }
          }}
          maxWidth="max-w-2xl"
        >
          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Tên công việc{" "}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleFormChange
                  }
                  maxLength={150}
                  placeholder="Ví dụ: Xây dựng API đăng nhập"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                />

                <div className="mt-1 flex justify-end text-[11px] text-slate-400">
                  {form.name.length}/150
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Mô tả
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleFormChange
                  }
                  maxLength={2000}
                  rows={4}
                  placeholder="Mô tả nội dung, yêu cầu hoặc kết quả cần đạt..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                />

                <div className="mt-1 flex justify-end text-[11px] text-slate-400">
                  {
                    form.description
                      .length
                  }
                  /2000
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Deadline{" "}
                    <span className="text-rose-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      name="deadline"
                      type="datetime-local"
                      value={
                        form.deadline
                      }
                      min={getMinDeadline(
                        selectedProject
                      )}
                      max={getMaxDeadline(
                        selectedProject
                      )}
                      onChange={
                        handleFormChange
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                    Không thể chọn thời gian
                    trong quá khứ và không
                    thể vượt quá ngày kết thúc
                    dự án.
                  </p>

                  {selectedProject && (
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Cho phép từ{" "}
                      {formatDateTime(
                        getMinDeadline(
                          selectedProject
                        )
                      )}{" "}
                      đến{" "}
                      {formatDateTime(
                        getMaxDeadline(
                          selectedProject
                        )
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Độ ưu tiên{" "}
                    <span className="text-rose-500">
                      *
                    </span>
                  </label>

                  <select
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      handleFormChange
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  >
                    {PRIORITY_OPTIONS.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">
                    Người thực hiện{" "}
                    <span className="text-rose-500">
                      *
                    </span>
                  </label>

                  <span className="text-xs font-medium text-slate-400">
                    {
                      form.assigneeIds
                        .length
                    }{" "}
                    người được chọn
                  </span>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={
                      memberSearch
                    }
                    onChange={(e) =>
                      setMemberSearch(
                        e.target.value
                      )
                    }
                    placeholder="Tìm Member..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-navy-500 focus:bg-white"
                  />
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {filteredMembers.length ===
                  0 ? (
                    <div className="px-4 py-8 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                      <p className="text-sm font-medium text-slate-500">
                        Chưa có Member phù
                        hợp
                      </p>
                    </div>
                  ) : (
                    filteredMembers.map(
                      (member) => {
                        const memberId =
                          Number(
                            member.id
                          );

                        const checked =
                          form.assigneeIds.includes(
                            memberId
                          );

                        return (
                          <label
                            key={
                              memberId
                            }
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                              checked
                                ? "border-navy-200 bg-navy-50"
                                : "border-transparent hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleAssignee(
                                  memberId
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300"
                            />

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                              {getInitials(
                                member.fullName ||
                                  member.email
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {member.fullName ||
                                    "Không có tên"}
                                </p>

                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                  {getMemberRoleLabel(
                                    member.role
                                  )}
                                </span>
                              </div>

                              <p className="truncate text-xs text-slate-400">
                                {member.email ||
                                  "Không có email"}
                              </p>
                            </div>
                          </label>
                        );
                      }
                    )
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-500/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>
                    {error}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setShowModal(false)
                }
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy-700 px-5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}

                {editingTask
                  ? "Lưu thay đổi"
                  : "Tạo công việc"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showDetail &&
        selectedTask && (
          <Modal
            title="Chi tiết công việc"
            onClose={() =>
              setShowDetail(false)
            }
            maxWidth="max-w-3xl"
          >
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-slate-900">
                      {
                        selectedTask.name
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {selectedTask.description ||
                        "Không có mô tả."}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${statusClass(
                      selectedTask.status
                    )}`}
                  >
                    {getStatusIcon(
                      selectedTask.status
                    )}
                    {statusLabel(
                      selectedTask.status
                    )}
                  </span>
                </div>

                {isOverdue(
                  selectedTask
                ) && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-500/20">
                    <AlertTriangle className="h-4 w-4" />
                    Công việc đang quá
                    hạn deadline.
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={
                    <Calendar className="h-4 w-4" />
                  }
                  label="Deadline"
                  value={formatDateTime(
                    selectedTask.deadline
                  )}
                />

                <InfoItem
                  icon={
                    <Flag className="h-4 w-4" />
                  }
                  label="Độ ưu tiên"
                  value={priorityLabel(
                    selectedTask.priority
                  )}
                />

                <InfoItem
                  icon={
                    <Clock3 className="h-4 w-4" />
                  }
                  label="Trạng thái"
                  value={statusLabel(
                    selectedTask.status
                  )}
                />

                <InfoItem
                  icon={
                    <Users className="h-4 w-4" />
                  }
                  label="Người thực hiện"
                  value={
                    selectedTask
                      .assignees
                      ?.length
                      ? selectedTask.assignees
                          .map(
                            (
                              member
                            ) =>
                              member.fullName ||
                              member.email
                          )
                          .join(
                            ", "
                          )
                      : "Chưa phân công"
                  }
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Tiến độ
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Cập nhật trực tiếp theo
                      phần trăm hoàn thành.
                    </p>
                  </div>

                  <span className="text-2xl font-bold text-navy-700">
                    {
                      selectedTask.progressPercent
                    }
                    %
                  </span>
                </div>

                {/* <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={
                    selectedTask.progressPercent ||
                    0
                  }
                  onChange={(e) =>
                    updateProgress(
                      selectedTask,
                      e.target.value
                    )
                  }
                  className="w-full accent-navy-600"
                /> */}

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-navy-600 transition-all"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selectedTask.progressPercent ||
                              0
                          ),
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>
                    0%
                  </span>
                  <span>
                    50%
                  </span>
                  <span>
                    100%
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Cập nhật trạng thái
                </label>

                <select
                  value={
                    selectedTask.status ||
                    "NOT_STARTED"
                  }
                  onChange={(e) =>
                    updateStatus(
                      selectedTask,
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                >
                  {(
                    STATUS_TRANSITIONS[
                      selectedTask
                        .status
                    ] || [
                      selectedTask.status,
                    ]
                  ).map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {statusLabel(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-400">
                  Trạng thái chỉ được chuyển
                  theo luồng hợp lệ của công
                  việc.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-navy-600" />

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Trao đổi
                      </h3>

                      <p className="text-xs text-slate-400">
                        {selectedTask
                          .comments
                          ?.length ||
                          0}{" "}
                        trao đổi
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setComment("");
                      setShowCommentModal(
                        true
                      );
                    }}
                    className="rounded-lg bg-navy-50 px-3 py-2 text-xs font-semibold text-navy-700 transition hover:bg-navy-100"
                  >
                    Thêm trao đổi
                  </button>
                </div>

                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {selectedTask
                    .comments?.length ? (
                    selectedTask.comments.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.id ||
                            index
                          }
                          className="rounded-xl bg-slate-50 p-3"
                        >
                          <p className="text-sm leading-6 text-slate-700">
                            {
                              item.content
                            }
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="text-[11px] text-slate-400">
                              {item.createdAt
                                ? formatDateTime(
                                    item.createdAt
                                  )
                                : ""}
                            </span>

                            {item.userName && (
                              <span className="text-[11px] font-semibold text-slate-500">
                                {
                                  item.userName
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                      <p className="text-sm font-medium text-slate-500">
                        Chưa có trao đổi
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetail(
                      false
                    );
                    openEditModal(
                      selectedTask
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Sửa
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openAssign(
                      selectedTask
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
                >
                  <Users className="h-4 w-4" />
                  Phân công
                </button>

                <button
                  type="button"
                  onClick={() =>
                    requestDelete(
                      selectedTask
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              </div>
            </div>
          </Modal>
        )}

      {showAssignModal &&
        selectedTask && (
          <Modal
            title="Phân công người thực hiện"
            onClose={() =>
              setShowAssignModal(
                false
              )
            }
          >
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 ring-1 ring-blue-500/20">
                Có thể giao một công việc
                cho một hoặc nhiều Member
                thuộc dự án.
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={
                    memberSearch
                  }
                  onChange={(e) =>
                    setMemberSearch(
                      e.target.value
                    )
                  }
                  placeholder="Tìm Member..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-navy-500 focus:bg-white"
                />
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {filteredMembers.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                    <p className="text-sm text-slate-500">
                      Không có Member phù
                      hợp.
                    </p>
                  </div>
                ) : (
                  filteredMembers.map(
                    (member) => {
                      const memberId =
                        Number(
                          member.id
                        );

                      const checked =
                        assignIds.includes(
                          memberId
                        );

                      return (
                        <label
                          key={
                            memberId
                          }
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                            checked
                              ? "border-navy-200 bg-navy-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() =>
                              toggleAssignMember(
                                memberId
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                            {getInitials(
                              member.fullName ||
                                member.email
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {member.fullName ||
                                "Không có tên"}
                            </p>

                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <p className="truncate text-xs text-slate-400">
                                {member.email ||
                                  "Không có email"}
                              </p>

                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                {getMemberRoleLabel(
                                  member.role
                                )}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    }
                  )
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">
                  Đã chọn
                </span>

                <span className="text-sm font-bold text-navy-700">
                  {
                    assignIds.length
                  }{" "}
                  Member
                </span>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowAssignModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={
                    handleAssign
                  }
                  disabled={
                    assignIds.length ===
                    0
                  }
                  className="rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lưu phân công
                </button>
              </div>
            </div>
          </Modal>
        )}

      {showCommentModal && (
        <Modal
          title="Thêm trao đổi"
          onClose={() =>
            setShowCommentModal(
              false
            )
          }
        >
          <div>
            <textarea
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              maxLength={2000}
              rows={6}
              placeholder="Nhập nội dung trao đổi..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
            />

            <div className="mt-1 flex justify-end text-[11px] text-slate-400">
              {comment.length}/2000
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowCommentModal(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={async () => {
                  const success =
                    await handleAddComment();

                  if (success) {
                    setShowCommentModal(
                      false
                    );
                  }
                }}
                disabled={
                  !comment.trim()
                }
                className="rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Gửi
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal &&
        taskToDelete && (
          <Modal
            title="Xác nhận xóa công việc"
            onClose={() =>
              setShowDeleteModal(
                false
              )
            }
          >
            <div className="space-y-5">
              <div className="flex items-start gap-4 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-500/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-rose-800">
                    Bạn có chắc muốn xóa
                    công việc này?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-rose-700">
                    Công việc{" "}
                    <span className="font-bold">
                      "
                      {
                        taskToDelete.name
                      }
                      "
                    </span>{" "}
                    sẽ bị xóa khỏi dự án.
                    Hành động này không nên
                    thực hiện nếu dữ liệu còn
                    cần sử dụng.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    icon={
                      <Flag className="h-4 w-4" />
                    }
                    label="Ưu tiên"
                    value={priorityLabel(
                      taskToDelete.priority
                    )}
                  />

                  <InfoItem
                    icon={
                      <Clock3 className="h-4 w-4" />
                    }
                    label="Trạng thái"
                    value={statusLabel(
                      taskToDelete.status
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(
                      false
                    );
                    setTaskToDelete(
                      null
                    );
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={
                    handleDelete
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </Modal>
        )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="absolute right-0 top-0 h-full w-1 bg-navy-600" />

      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
          {icon}
        </div>
      </div>

      <p className="text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SelectFilter({
  icon,
  value,
  onChange,
  placeholder,
  options,
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-8 text-sm outline-none transition focus:border-navy-500 focus:bg-white focus:ring-2 focus:ring-navy-500/20"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((item) => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function KanbanTaskCard({
  task,
  onOpen,
  onEdit,
  onAssign,
  onDelete,
}) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            onOpen(task)
          }
          className="min-w-0 flex-1 text-left"
        >
          <p className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-navy-700">
            {task.name ||
              "Không có tên"}
          </p>
        </button>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${priorityBadgeClass(
            task.priority
          )}`}
        >
          {priorityLabel(
            task.priority
          )}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-xs leading-5 text-slate-500">
        {task.description ||
          "Không có mô tả."}
      </p>

      <div
        className={`mb-3 flex items-center gap-2 text-xs font-medium ${
          isOverdue(task)
            ? "text-rose-600"
            : "text-slate-500"
        }`}
      >
        <Calendar className="h-3.5 w-3.5" />

        <span>
          {formatDate(
            task.deadline
          )}
        </span>

        {isOverdue(task) && (
          <AlertTriangle className="ml-auto h-3.5 w-3.5" />
        )}
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-400">
            Tiến độ
          </span>

          <span className="text-[10px] font-bold text-navy-700">
            {
              task.progressPercent
            }
            %
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-navy-600 transition-all"
            style={{
              width: `${Math.min(
                Math.max(
                  Number(
                    task.progressPercent ||
                      0
                  ),
                  0
                ),
                100
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex -space-x-2">
          {task.assignees
            ?.slice(0, 3)
            .map((member) => (
              <div
                key={member.id}
                title={
                  member.fullName ||
                  member.email
                }
                className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-[9px] font-bold text-navy-700 ring-2 ring-white"
              >
                {getInitials(
                  member.fullName ||
                    member.email
                )}
              </div>
            ))}

          {!task.assignees
            ?.length && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserRound className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
          <button
            type="button"
            title="Sửa"
            onClick={() =>
              onEdit(task)
            }
            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Phân công"
            onClick={() =>
              onAssign(task)
            }
            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <Users className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Xóa"
            onClick={() =>
              onDelete(task)
            }
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskTableSkeleton() {
  return (
    <tr>
      <td className="px-6 py-5">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-52 rounded bg-slate-200" />
          <div className="h-3 w-36 rounded bg-slate-100" />
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="flex animate-pulse -space-x-2">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <div className="h-8 w-8 rounded-full bg-slate-100" />
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
      </td>

      <td className="px-6 py-5">
        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
      </td>

      <td className="px-6 py-5">
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
      </td>

      <td className="px-6 py-5">
        <div className="h-2 w-28 animate-pulse rounded-full bg-slate-200" />
      </td>

      <td className="px-6 py-5">
        <div className="ml-auto h-8 w-28 animate-pulse rounded-lg bg-slate-200" />
      </td>
    </tr>
  );
}

function EmptyState({
  search,
  hasFilter,
  onClear,
  onCreate,
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <CheckCircle2 className="h-8 w-8 text-slate-300" />
      </div>

      <p className="font-semibold text-slate-700">
        Không có công việc
      </p>

      <p className="mt-1 max-w-md text-center text-sm leading-6 text-slate-400">
        {search || hasFilter
          ? "Không tìm thấy công việc phù hợp với điều kiện lọc hiện tại."
          : "Dự án chưa có công việc nào."}
      </p>

      <div className="mt-4 flex gap-2">
        {(search || hasFilter) && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Xóa bộ lọc
          </button>
        )}

        {!search &&
          !hasFilter && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo công việc đầu tiên
            </button>
          )}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  pageSizeOptions,
  pages,
  onPageChange,
  onPageSizeChange,
}) {
  const start =
    totalElements === 0
      ? 0
      : page * pageSize + 1;

  const end = Math.min(
    (page + 1) * pageSize,
    totalElements
  );

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-slate-500">
          Hiển thị{" "}
          <span className="font-semibold text-slate-700">
            {start}
          </span>
          {" - "}
          <span className="font-semibold text-slate-700">
            {end}
          </span>
          {" / "}
          <span className="font-semibold text-slate-700">
            {totalElements}
          </span>{" "}
          công việc
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Hiển thị
          </span>

          <select
            value={pageSize}
            onChange={
              onPageSizeChange
            }
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none focus:border-navy-500"
          >
            {pageSizeOptions.map(
              (size) => (
                <option
                  key={size}
                  value={size}
                >
                  {size}
                </option>
              )
            )}
          </select>

          <span className="text-xs text-slate-400">
            / trang
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          disabled={page === 0}
          onClick={() =>
            onPageChange(
              page - 1
            )
          }
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>

        <div className="flex items-center gap-1">
          {pages.map(
            (pageNumber) => (
              <button
                key={
                  pageNumber
                }
                type="button"
                onClick={() =>
                  onPageChange(
                    pageNumber
                  )
                }
                className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold transition ${
                  pageNumber === page
                    ? "bg-navy-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {pageNumber + 1}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={
            page >= totalPages - 1
          }
          onClick={() =>
            onPageChange(
              page + 1
            )
          }
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  maxWidth = "max-w-xl",
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="break-words text-sm font-semibold leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}