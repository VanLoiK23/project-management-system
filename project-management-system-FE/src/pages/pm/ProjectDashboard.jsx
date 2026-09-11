import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Calendar,
  MoreHorizontal,
  X,
  Briefcase,
  TrendingUp,
  CalendarDays,
  Lock,
  Eye,
  Edit,
  Trash2,
  Search,
  Loader2,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Save,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const apiFetchProjects = () => axios.get("/projects").then((res) => res.data);

const apiCreateProject = (payload) =>
  axios.post("/projects", payload).then((res) => res.data);

const apiUpdateProject = (id, payload) =>
  axios.put(`/projects/${id}`, payload).then((res) => res.data);

const apiCloseProject = (id) =>
  axios.post(`/projects/${id}/close`).then((res) => res.data);

const apiDeleteProject = (id) => axios.delete(`/projects/${id}`);

const apiGetMembers = (projectId) =>
  axios.get(`/projects/${projectId}/members`).then((res) => res.data);

const apiAddMember = (projectId, payload) =>
  axios.post(`/projects/${projectId}/members`, payload).then((res) => res.data);

const apiRemoveMember = (projectId, userId) =>
  axios
    .delete(`/projects/${projectId}/members/${userId}`)
    .then((res) => res.data);

const apiUpdateMemberRole = (projectId, userId, payload) =>
  axios
    .put(`/projects/${projectId}/members/${userId}/role`, payload)
    .then((res) => res.data);

const apiSearchUsers = (q) =>
  axios.get("/users/search", { params: { q } }).then((res) => res.data);

const ROLE_LABEL = {
  MEMBER: "Thành viên",
  DEV: "Developer",
  TESTER: "Tester",
  BA: "Business Analyst",
  DESIGNER: "Designer",
  OTHER: "Khác",
};

const MEMBER_ROLES = ["MEMBER", "DEV", "TESTER", "BA", "DESIGNER", "OTHER"];

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
  CANCELLED: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const STATUS_TRANSITIONS = {
  PLANNING: ["PLANNING", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["ON_HOLD", "IN_PROGRESS", "CANCELLED"],
  COMPLETED: ["COMPLETED", "CLOSED"],
  CLOSED: ["CLOSED"],
  CANCELLED: ["CANCELLED"],
};

function initials(fullName = "") {
  const value = fullName.trim();

  if (!value) return "U";

  return (
    value
      .split(/\s+/)
      .slice(-2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U"
  );
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
];

function avatarGradient(id = 0) {
  const numericId =
    typeof id === "number"
      ? id
      : String(id)
          .split("")
          .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return AVATAR_GRADIENTS[Math.abs(numericId) % AVATAR_GRADIENTS.length];
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getErrorMessage(error, fallback = "Có lỗi xảy ra") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function isClosedProject(project) {
  return project?.status === "COMPLETED" || project?.status === "CANCELLED";
}

function useToasts() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();

    setToasts((current) => [
      ...current,
      {
        id,
        type,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    push,
    dismiss,
  };
}

function ToastStack({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <p className="flex-1 text-sm font-medium">{toast.message}</p>

          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="shrink-0 opacity-60 transition hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  submitting = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
            danger ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>

        <h3 className="text-base font-bold text-slate-900">{title}</h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition disabled:opacity-60 ${
              danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-800 hover:bg-slate-900"
            }`}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}

            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserAutocomplete({
  onSelect,
  excludeIds = [],
  placeholder = "Tìm người dùng...",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleChange(event) {
    const value = event.target.value;

    setQuery(value);
    setOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);

      try {
        const data = await apiSearchUsers(value.trim());

        const safeData = Array.isArray(data) ? data : [];

        setResults(safeData.filter((user) => !excludeIds.includes(user.id)));
      } catch (error) {
        console.error("Search users error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
        />

        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute z-[120] mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              Đang tìm kiếm...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              Không tìm thấy người dùng
            </div>
          ) : (
            results.map((user) => {
              const name = user.fullName || user.name || "Người dùng";

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onSelect(user);
                    setQuery("");
                    setResults([]);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${avatarGradient(
                      user.id
                    )}`}
                  >
                    {initials(name)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {name}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user.email || "—"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function AddMemberModal({ project, onClose, onAdded, pushToast }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState("DEV");
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    let mounted = true;

    setLoadingMembers(true);

    apiGetMembers(project.id)
      .then((data) => {
        if (mounted) {
          setMembers(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        console.error(error);

        if (mounted) {
          pushToast(
            "error",
            getErrorMessage(error, "Không tải được danh sách thành viên")
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingMembers(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [project.id, pushToast]);

  const existingIds = members.map((member) => member.userId);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedUser) {
      pushToast("error", "Vui lòng chọn người dùng");
      return;
    }

    setSubmitting(true);

    try {
      const newMember = await apiAddMember(project.id, {
        userId: selectedUser.id,
        role,
      });

      onAdded(newMember);

      pushToast(
        "success",
        `Đã thêm ${
          selectedUser.fullName || selectedUser.name || "thành viên"
        } vào dự án`
      );

      onClose();
    } catch (error) {
      pushToast("error", getErrorMessage(error, "Thêm thành viên thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Thêm thành viên
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">{project.name}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">
                Người dùng <span className="text-rose-500">*</span>
              </label>

              {selectedUser ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${avatarGradient(
                        selectedUser.id
                      )}`}
                    >
                      {initials(selectedUser.fullName || selectedUser.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {selectedUser.fullName || selectedUser.name}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {selectedUser.email || "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <UserAutocomplete
                  onSelect={setSelectedUser}
                  excludeIds={existingIds}
                  placeholder="Gõ tên hoặc email..."
                />
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">
                Vai trò <span className="text-rose-500">*</span>
              </label>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              >
                {MEMBER_ROLES.map((key) => (
                  <option key={key} value={key}>
                    {ROLE_LABEL[key]}
                  </option>
                ))}
              </select>
            </div>

            {!loadingMembers && members.length > 0 && (
              <p className="text-xs text-slate-400">
                Người dùng đã thuộc dự án sẽ không xuất hiện trong kết quả tìm
                kiếm.
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 rounded-xl px-5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={!selectedUser || submitting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Thêm thành viên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectDetailModal({
  project,
  onClose,
  onOpenAddMember,
  pushToast,
  onProjectChanged,
}) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [memberAction, setMemberAction] = useState(null);

  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRole, setEditingRole] = useState("");

  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);

  const [removeSubmitting, setRemoveSubmitting] = useState(false);

  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);

    try {
      const data = await apiGetMembers(project.id);

      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      pushToast(
        "error",
        getErrorMessage(error, "Không tải được danh sách thành viên")
      );
    } finally {
      setLoadingMembers(false);
    }
  }, [project.id, pushToast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers, project]);

  async function handleSaveRole(member) {
    if (!editingRole) return;

    if (editingRole === member.role) {
      setEditingRoleId(null);
      return;
    }

    setRoleSubmitting(true);

    try {
      const updated = await apiUpdateMemberRole(project.id, member.userId, {
        role: editingRole,
      });

      setMembers((current) =>
        current.map((item) =>
          item.id === member.userId
            ? {
                ...item,
                ...(updated || {}),
                role: updated?.role || editingRole,
              }
            : item
        )
      );

      pushToast("success", "Cập nhật vai trò thành công");

      setEditingRoleId(null);
      setEditingRole("");
    } catch (error) {
      pushToast("error", getErrorMessage(error, "Cập nhật vai trò thất bại"));
    } finally {
      setRoleSubmitting(false);
    }
  }

  async function handleRemoveMember() {
    if (!confirmRemoveMember) return;

    setRemoveSubmitting(true);

    try {
      await apiRemoveMember(project.id, confirmRemoveMember.userId);

      setMembers((current) =>
        current.filter((member) => member.userId !== confirmRemoveMember.userId)
      );

      pushToast(
        "success",
        `Đã xóa ${confirmRemoveMember.userFullName || "thành viên"} khỏi dự án`
      );

      setConfirmRemoveMember(null);

      onProjectChanged?.();
    } catch (error) {
      pushToast("error", getErrorMessage(error, "Xóa thành viên thất bại"));
    } finally {
      setRemoveSubmitting(false);
    }
  }

  const projectClosed = isClosedProject(project);

  return (
    <>
      <div
        className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !memberAction) {
            onClose();
          }
        }}
      >
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* HEADER */}
          <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="min-w-0 pr-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-slate-900">
                  {project.name}
                </h2>

                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                    STATUS_BADGE[project.status] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {STATUS_LABEL[project.status] || project.status}
                </span>
              </div>

              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {project.description || "Không có mô tả"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* CONTENT */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {/* PROJECT INFO */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-400">
                  Ngày bắt đầu
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(project.startDate)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-400">
                  Ngày kết thúc
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(project.endDate)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-400">
                  PM phụ trách
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {project.projectManagerName || "—"}
                </p>
              </div>
            </div>

            {/* MEMBERS HEADER */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Users className="h-4 w-4 text-slate-400" />
                  Thành viên ({members.length})
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Quản lý thành viên và vai trò trong dự án
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenAddMember}
                disabled={projectClosed}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Thêm thành viên
              </button>
            </div>

            {/* MEMBERS */}
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
              {loadingMembers ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-sm text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang tải thành viên...
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Users className="h-8 w-8 text-slate-300" />

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Chưa có thành viên
                  </p>

                  {!projectClosed && (
                    <p className="mt-1 text-xs text-slate-400">
                      Hãy thêm thành viên để bắt đầu làm việc trên dự án.
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {members.map((member) => {
                    const name =
                      member.userFullName ||
                      member.fullName ||
                      member.name ||
                      "Người dùng";

                    const isEditing = editingRoleId === member.id;

                    const isPM = member.role === "PM";

                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                      >
                        {/* USER */}
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${avatarGradient(
                              member.userId || member.id
                            )}`}
                          >
                            {initials(name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {name}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {member.userEmail || member.email || "—"}
                            </p>
                          </div>
                        </div>

                        {/* ROLE */}
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <select
                                value={editingRole}
                                onChange={(event) =>
                                  setEditingRole(event.target.value)
                                }
                                disabled={roleSubmitting}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                              >
                                {MEMBER_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {ROLE_LABEL[role]}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleSaveRole(member)}
                                disabled={roleSubmitting}
                                title="Lưu vai trò"
                                className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {roleSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(null);
                                  setEditingRole("");
                                }}
                                disabled={roleSubmitting}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                  isPM
                                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {ROLE_LABEL[member.role] || member.role}
                              </span>

                              {!projectClosed && !isPM && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRoleId(member.id);
                                      setEditingRole(member.role);
                                    }}
                                    title="Đổi vai trò"
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmRemoveMember(member)
                                    }
                                    title="Xóa thành viên"
                                    className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REMOVE MEMBER CONFIRM */}
      <ConfirmDialog
        open={!!confirmRemoveMember}
        title="Xóa thành viên?"
        message={`Bạn có chắc muốn xóa "${
          confirmRemoveMember?.userFullName || "thành viên"
        }" khỏi dự án "${project.name}"?`}
        confirmLabel="Xóa thành viên"
        danger
        submitting={removeSubmitting}
        onClose={() => !removeSubmitting && setConfirmRemoveMember(null)}
        onConfirm={handleRemoveMember}
      />
    </>
  );
}

function ProjectFormModal({
  open,
  mode,
  form,
  formError,
  submitting,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  const isEdit = mode === "EDIT";

  const allowedStatuses = STATUS_TRANSITIONS[form.status] || [form.status];
  const today = new Date().toISOString().split("T")[0];
  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {isEdit
                ? "Cập nhật thông tin dự án"
                : "Nhập thông tin để tạo dự án mới"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-5">
            {/* NAME */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">
                Tên dự án <span className="text-rose-500">*</span>
              </label>

              <input
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                maxLength={100}
                placeholder="Nhập tên dự án..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />

              <p className="mt-1 text-right text-[11px] text-slate-400">
                {form.name.length}/100
              </p>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">
                Mô tả
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                maxLength={2000}
                rows={4}
                placeholder="Mô tả ngắn về dự án..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />

              <p className="mt-1 text-right text-[11px] text-slate-400">
                {form.description.length}/2000
              </p>
            </div>

            {/* DATES */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">
                  Ngày bắt đầu <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    min={today}
                    onChange={onChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">
                  Ngày kết thúc <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    min={form.startDate || today}
                    onChange={onChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>
              </div>
            </div>

            {/* STATUS */}
            {isEdit && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">
                  Trạng thái
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  disabled={
                    form.status === "COMPLETED" || form.status === "CANCELLED"
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-xs text-slate-400">
                  Chỉ cho phép chuyển sang trạng thái phù hợp với quy trình dự
                  án.
                </p>
              </div>
            )}

            {/* ERROR */}
            {formError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-medium text-rose-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{formError}</span>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 rounded-xl px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {isEdit ? "Lưu thay đổi" : "Tạo dự án"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDashboard() {
  const { toasts, push: pushToast, dismiss } = useToasts();

  const [projects, setProjects] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [listError, setListError] = useState("");

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalMode, setModalMode] = useState("CREATE");

  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "PLANNING",
  });

  const [formError, setFormError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [detailProject, setDetailProject] = useState(null);

  const [addMemberProject, setAddMemberProject] = useState(null);

  const [confirmState, setConfirmState] = useState(null);

  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState(null);

  const menuRef = useRef(null);

  const loadProjects = useCallback(async () => {
    setIsLoadingList(true);
    setListError("");

    try {
      const data = await apiFetchProjects();

      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = getErrorMessage(error, "Không tải được danh sách dự án");

      setListError(message);

      pushToast("error", message);
    } finally {
      setIsLoadingList(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProjects = projects.filter((project) => {
    if (!normalizedSearch) return true;

    return (
      project.name?.toLowerCase().includes(normalizedSearch) ||
      project.description?.toLowerCase().includes(normalizedSearch) ||
      project.projectManagerName?.toLowerCase().includes(normalizedSearch)
    );
  });

  function handleOpenCreateModal() {
    setModalMode("CREATE");

    setForm({
      id: null,
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "PLANNING",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function handleOpenEditModal(project) {
    setActiveMenuId(null);

    if (isClosedProject(project)) {
      pushToast(
        "error",
        "Dự án đã hoàn thành hoặc bị hủy, không thể chỉnh sửa"
      );

      return;
    }

    setModalMode("EDIT");

    setForm({
      id: project.id,
      name: project.name || "",
      description: project.description || "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      status: project.status || "PLANNING",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  }

  function validateForm() {
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      return "Vui lòng nhập tên dự án.";
    }

    if (name.length < 3) {
      return "Tên dự án phải có ít nhất 3 ký tự.";
    }

    if (name.length > 100) {
      return "Tên dự án không được vượt quá 100 ký tự.";
    }

    if (description.length > 2000) {
      return "Mô tả không được vượt quá 2000 ký tự.";
    }

    if (!form.startDate) {
      return "Vui lòng chọn ngày bắt đầu.";
    }

    if (!form.endDate) {
      return "Vui lòng chọn ngày kết thúc.";
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    }

    return "";
  }

  async function handleSave(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (modalMode === "CREATE") {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          memberIds: [],
        };

        const created = await apiCreateProject(payload);

        setProjects((current) => [created, ...current]);

        pushToast("success", "Tạo dự án thành công");
      } else {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        };

        const updated = await apiUpdateProject(form.id, payload);

        setProjects((current) =>
          current.map((project) =>
            project.id === updated.id ? updated : project
          )
        );

        if (detailProject?.id === updated.id) {
          setDetailProject(updated);
        }

        pushToast("success", "Cập nhật dự án thành công");
      }

      setIsModalOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể lưu dự án"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenDetail(project) {
    setActiveMenuId(null);
    setDetailProject(project);
  }

  function handleRequestClose(project) {
    setActiveMenuId(null);

    if (isClosedProject(project)) {
      pushToast("error", "Dự án đã ở trạng thái đóng");

      return;
    }

    setConfirmState({
      type: "close",
      project,
    });
  }

  async function confirmCloseProject() {
    if (!confirmState?.project) return;

    const project = confirmState.project;

    setConfirmSubmitting(true);

    try {
      const updated = await apiCloseProject(project.id);

      setProjects((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );

      if (detailProject?.id === updated.id) {
        setDetailProject(updated);
      }

      pushToast("success", `Đã đóng dự án "${project.name}"`);

      setConfirmState(null);
    } catch (error) {
      pushToast("error", getErrorMessage(error, "Đóng dự án thất bại"));
    } finally {
      setConfirmSubmitting(false);
    }
  }

  function handleRequestDelete(project) {
    setActiveMenuId(null);

    setConfirmState({
      type: "delete",
      project,
    });
  }

  async function confirmDeleteProject() {
    if (!confirmState?.project) return;

    const project = confirmState.project;

    setConfirmSubmitting(true);

    try {
      await apiDeleteProject(project.id);

      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );

      if (detailProject?.id === project.id) {
        setDetailProject(null);
      }

      pushToast("success", `Đã xóa dự án "${project.name}"`);

      setConfirmState(null);
    } catch (error) {
      pushToast("error", getErrorMessage(error, "Xóa dự án thất bại"));
    } finally {
      setConfirmSubmitting(false);
    }
  }

  function handleOpenAddMember(project) {
    setActiveMenuId(null);

    if (isClosedProject(project)) {
      pushToast("error", "Không thể thêm thành viên vào dự án đã đóng");

      return;
    }

    setAddMemberProject(project);
  }

  async function refreshCurrentProject(projectId) {
    try {
      const data = await apiFetchProjects();

      if (Array.isArray(data)) {
        setProjects(data);

        const current = data.find((project) => project.id === projectId);

        if (current) {
          setDetailProject(current);
        }
      }
    } catch (error) {
      console.error("Refresh projects error:", error);
    }
  }

  const stats = [
    {
      label: "Tổng dự án",
      value: projects.length,
      icon: Briefcase,
      color: "from-slate-700 to-slate-900",
      iconColor: "text-slate-300",
    },
    {
      label: "Đang thực hiện",
      value: projects.filter((project) => project.status === "IN_PROGRESS")
        .length,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-700",
      iconColor: "text-emerald-200",
    },
    {
      label: "Kế hoạch",
      value: projects.filter((project) => project.status === "PLANNING").length,
      icon: CalendarDays,
      color: "from-amber-500 to-amber-700",
      iconColor: "text-amber-200",
    },
    {
      label: "Đã đóng",
      value: projects.filter(
        (project) =>
          project.status === "COMPLETED" || project.status === "CANCELLED"
      ).length,
      icon: Lock,
      color: "from-blue-500 to-blue-700",
      iconColor: "text-blue-200",
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý dự án
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin, thành viên và trạng thái các dự án của doanh
            nghiệp.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* SEARCH */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm dự án..."
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 sm:w-64"
            />
          </div>

          {/* CREATE */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 px-5 text-sm font-semibold text-white shadow-lg shadow-navy-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Tạo dự án
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div
                className={`absolute right-0 top-0 h-full w-1 bg-gradient-to-b ${stat.color}`}
              />

              <Icon
                className={`absolute right-4 top-4 h-10 w-10 opacity-20 ${stat.iconColor}`}
              />

              <p className="text-sm font-medium text-slate-500">{stat.label}</p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ERROR */}
        {listError && !isLoadingList && (
          <div className="border-b border-rose-100 bg-rose-50 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />

                {listError}
              </div>

              <button
                type="button"
                onClick={loadProjects}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên dự án</th>

                <th className="px-6 py-4 font-semibold">PM phụ trách</th>

                <th className="px-6 py-4 font-semibold">Thời gian</th>

                <th className="px-6 py-4 font-semibold">Trạng thái</th>

                <th className="min-w-[140px] px-6 py-4 font-semibold">
                  Thành viên
                </th>

                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* LOADING */}
              {isLoadingList ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />

                      <p className="mt-3 text-sm text-slate-400">
                        Đang tải danh sách dự án...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                /* EMPTY */
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      {search.trim() ? (
                        <Search className="h-9 w-9 text-slate-300" />
                      ) : (
                        <Briefcase className="h-9 w-9 text-slate-300" />
                      )}

                      <p className="mt-3 text-sm font-semibold text-slate-600">
                        {search.trim()
                          ? "Không tìm thấy dự án"
                          : "Chưa có dự án nào"}
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-slate-400">
                        {search.trim()
                          ? `Không có dự án phù hợp với "${search}".`
                          : "Hãy tạo dự án đầu tiên để bắt đầu quản lý công việc."}
                      </p>

                      {search.trim() ? (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                        >
                          Xóa tìm kiếm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-600 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Tạo dự án
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const membersList = Array.isArray(project.members)
                    ? project.members
                    : [];

                  const closed = isClosedProject(project);

                  return (
                    <tr
                      key={project.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      {/* NAME */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(project)}
                          className="max-w-[280px] text-left"
                        >
                          <p className="truncate font-medium text-slate-900 hover:text-navy-700">
                            {project.name}
                          </p>

                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                            {project.description || "Không có mô tả"}
                          </p>
                        </button>
                      </td>

                      {/* PM */}
                      <td className="px-6 py-4 text-slate-600">
                        {project.projectManagerName || "—"}
                      </td>

                      {/* DATE */}
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>BĐ: {formatDate(project.startDate)}</span>

                          <span>KT: {formatDate(project.endDate)}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                            STATUS_BADGE[project.status] ||
                            "bg-slate-100 text-slate-700 ring-slate-500/20"
                          }`}
                        >
                          {STATUS_LABEL[project.status] || project.status}
                        </span>
                      </td>

                      {/* MEMBERS */}
                      <td className="px-6 py-4">
                        {membersList.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(project)}
                            className="flex items-center"
                          >
                            <div className="flex -space-x-2">
                              {membersList.slice(0, 4).map((member, index) => (
                                <div
                                  key={member.id || index}
                                  title={member.userFullName || member.name}
                                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white shadow-sm ring-2 ring-white ${avatarGradient(
                                    member.userId || index
                                  )}`}
                                >
                                  {initials(member.userFullName || member.name)}
                                </div>
                              ))}

                              {membersList.length > 4 && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm ring-2 ring-white">
                                  +{membersList.length - 4}
                                </div>
                              )}
                            </div>

                            <span className="ml-3 text-xs font-medium text-slate-500">
                              {project.memberCount ?? membersList.length}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(project)}
                            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-600 transition hover:bg-slate-200"
                          >
                            <Users className="h-4 w-4" />

                            <span className="text-xs font-medium">
                              {project.memberCount || 0}
                            </span>
                          </button>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="relative px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === project.id ? null : project.id
                            )
                          }
                          aria-label="Mở menu thao tác"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>

                        {activeMenuId === project.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-8 top-10 z-40 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                          >
                            {/* DETAIL */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(project)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4 text-slate-400" />
                              Xem chi tiết
                            </button>

                            {/* EDIT */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(project)}
                              disabled={closed}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Edit className="h-4 w-4 text-navy-500" />
                              Chỉnh sửa
                            </button>

                            {/* MEMBER */}
                            <button
                              type="button"
                              onClick={() => handleOpenAddMember(project)}
                              disabled={closed}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <UserPlus className="h-4 w-4 text-emerald-500" />
                              Thêm thành viên
                            </button>

                            {/* CLOSE */}
                            <button
                              type="button"
                              onClick={() => handleRequestClose(project)}
                              disabled={closed}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Lock className="h-4 w-4 text-amber-500" />
                              Đóng dự án
                            </button>

                            <div className="my-1 h-px bg-slate-100" />

                            {/* DELETE */}
                            {/* for amdin */}
                            {/* <button
                              type="button"
                              onClick={() => handleRequestDelete(project)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa dự án
                            </button> */}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProjectFormModal
        open={isModalOpen}
        mode={modalMode}
        form={form}
        formError={formError}
        submitting={submitting}
        onChange={handleInputChange}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
          }
        }}
        onSubmit={handleSave}
      />

      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onOpenAddMember={() => handleOpenAddMember(detailProject)}
          pushToast={pushToast}
          onProjectChanged={() => refreshCurrentProject(detailProject.id)}
        />
      )}

      {addMemberProject && (
        <AddMemberModal
          project={addMemberProject}
          onClose={() => setAddMemberProject(null)}
          onAdded={async () => {
            await refreshCurrentProject(addMemberProject.id);

            setAddMemberProject(null);
          }}
          pushToast={pushToast}
        />
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.type === "delete" ? "Xóa dự án?" : "Đóng dự án?"}
        message={
          confirmState?.type === "delete"
            ? `Bạn sắp xóa vĩnh viễn dự án "${confirmState?.project?.name}". Dữ liệu liên quan có thể bị mất và thao tác này không thể hoàn tác.`
            : `Sau khi đóng, dự án "${confirmState?.project?.name}" sẽ không thể chỉnh sửa hoặc thêm thành viên. Hãy chắc chắn rằng bạn muốn tiếp tục.`
        }
        confirmLabel={
          confirmState?.type === "delete" ? "Xóa dự án" : "Đóng dự án"
        }
        danger={confirmState?.type === "delete"}
        submitting={confirmSubmitting}
        onClose={() => !confirmSubmitting && setConfirmState(null)}
        onConfirm={
          confirmState?.type === "delete"
            ? confirmDeleteProject
            : confirmCloseProject
        }
      />

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
