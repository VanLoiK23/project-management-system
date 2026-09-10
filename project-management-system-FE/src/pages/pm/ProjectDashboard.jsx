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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
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

// Endpoint này Backend cần bổ sung để search User theo Tên/Email:
const apiSearchUsers = (q) =>
  axios.get("/users/search", { params: { q } }).then((res) => res.data);

const ROLE_LABEL = {
  PM: "Quản lý dự án",
  DEVELOPER: "Developer",
  TESTER: "Tester",
  BA: "Business Analyst",
  DESIGNER: "Designer",
  OTHER: "Khác",
};

const STATUS_BADGE = {
  PLANNING: "bg-slate-100 text-slate-700 ring-slate-500/20",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
  ON_HOLD: "bg-amber-100 text-amber-700 ring-amber-500/20",
  COMPLETED: "bg-blue-100 text-blue-700 ring-blue-500/20",
  CANCELLED: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const STATUS_LABEL = {
  PLANNING: "Kế hoạch",
  IN_PROGRESS: "Đang thực hiện",
  ON_HOLD: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

function initials(fullName = "") {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
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
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );
  return { toasts, push, dismiss };
}

function ToastStack({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            t.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100"
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
  danger,
  submitting,
  onConfirm,
  onClose,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
            danger ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60 ${
              danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-800 hover:bg-slate-900"
            }`}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{" "}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserAutocomplete({ onSelect, excludeIds = [], placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiSearchUsers(value);
        // Lọc bỏ những người đã có trong dự án
        setResults(data.filter((u) => !excludeIds.includes(u.id)));
      } catch (err) {
        console.error("Lỗi tìm user", err);
      } finally {
        setLoading(false);
      }
    }, 500);
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
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
      {open && query.trim() && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              Đang tìm kiếm...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              Không tìm thấy người dùng
            </div>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelect(u);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${avatarGradient(
                    u.id
                  )}`}
                >
                  {initials(u.fullName || u.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {u.fullName || u.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AddMemberModal({ project, onClose, onAdded, pushToast }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState("DEVELOPER");
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    apiGetMembers(project.id).then(setMembers).catch(console.error);
  }, [project.id]);

  const existingIds = members.map((m) => m.userId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const newMember = await apiAddMember(project.id, {
        userId: selectedUser.id,
        role: role,
      });
      onAdded(newMember);
      pushToast(
        "success",
        `Đã thêm ${selectedUser.fullName || selectedUser.name} vào dự án`
      );
      onClose();
    } catch (err) {
      pushToast(
        "error",
        err?.response?.data?.message || "Thêm thành viên thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Thêm thành viên
            </h2>
            <p className="text-xs text-slate-500">{project.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200"
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
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${avatarGradient(
                        selectedUser.id
                      )}`}
                    >
                      {initials(selectedUser.fullName || selectedUser.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedUser.fullName || selectedUser.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedUser.email}
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
                  placeholder="Gõ tên hoặc email thành viên..."
                />
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">
                Vai trò <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              >
                {Object.entries(ROLE_LABEL)
                  .filter(([key]) => key !== "PM")
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl px-5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedUser || submitting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-5 text-sm font-semibold text-white shadow-md hover:bg-navy-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectDetailModal({ project, onClose, onOpenAddMember, pushToast }) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    apiGetMembers(project.id)
      .then(setMembers)
      .catch(() => pushToast("error", "Lỗi tải thành viên"))
      .finally(() => setLoadingMembers(false));
  }, [project.id, pushToast]);

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {project.name}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                  STATUS_BADGE[project.status]
                }`}
              >
                {STATUS_LABEL[project.status] || project.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {project.description || "Không có mô tả"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-400">Ngày bắt đầu</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatDate(project.startDate)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-400">
                Ngày kết thúc
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatDate(project.endDate)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-400">PM phụ trách</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {project.projectManagerName || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="h-4 w-4 text-slate-400" /> Thành viên (
              {project.memberCount || members.length})
            </h3>
            <button
              type="button"
              onClick={onOpenAddMember}
              disabled={
                project.status === "COMPLETED" || project.status === "CANCELLED"
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-40"
            >
              <UserPlus className="h-3.5 w-3.5" /> Thêm thành viên
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {loadingMembers ? (
              <div className="p-4 text-center text-sm text-slate-400">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                Chưa có thành viên
              </div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${avatarGradient(
                      m.userId
                    )}`}
                  >
                    {initials(m.userFullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {m.userFullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {m.userEmail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {ROLE_LABEL[m.role] || m.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDashboard() {
  const { toasts, push: pushToast, dismiss } = useToasts();
  const [projects, setProjects] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
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
  const [confirmState, setConfirmState] = useState(null); // { type: 'close'|'delete', project }
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoadingList(true);
      try {
        const data = await apiFetchProjects();
        if (mounted) setProjects(data);
      } catch (err) {
        pushToast(
          "error",
          "Không tải được danh sách dự án. " + (err?.message || "")
        );
      } finally {
        if (mounted) setIsLoadingList(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pushToast]);

  // Click ra ngoài đóng menu action (dấu 3 chấm)
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setActiveMenuId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

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
    if (project.status === "COMPLETED" || project.status === "CANCELLED") {
      pushToast("error", "Dự án đã đóng hoặc hủy, không thể chỉnh sửa");
      setActiveMenuId(null);
      return;
    }
    setModalMode("EDIT");
    setForm({
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
    });
    setFormError("");
    setActiveMenuId(null);
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Vui lòng nhập tên dự án.");
    if (!form.startDate || !form.endDate)
      return setFormError("Vui lòng chọn ngày.");
    if (new Date(form.startDate) > new Date(form.endDate))
      return setFormError("Ngày kết thúc phải sau ngày bắt đầu.");

    setSubmitting(true);
    try {
      if (modalMode === "CREATE") {
        const payload = {
          name: form.name.trim(),
          description: form.description?.trim() || "",
          startDate: form.startDate,
          endDate: form.endDate,
          memberIds: [],
        };
        const created = await apiCreateProject(payload);
        setProjects((prev) => [created, ...prev]);
        pushToast("success", "Tạo dự án thành công");
      } else {
        const payload = {
          name: form.name.trim(),
          description: form.description?.trim() || "",
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        };
        const updated = await apiUpdateProject(form.id, payload);
        setProjects((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        pushToast("success", "Cập nhật dự án thành công");
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Có lỗi xảy ra từ Server");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRequestClose(project) {
    setActiveMenuId(null);
    setConfirmState({ type: "close", project });
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  }

  async function confirmCloseProject() {
    const project = confirmState.project;
    setConfirmSubmitting(true);
    try {
      const updated = await apiCloseProject(project.id);
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      pushToast("success", `Đã đóng dự án "${project.name}"`);
      setConfirmState(null);
    } catch (err) {
      pushToast("error", err?.response?.data?.message || "Đóng dự án thất bại");
    } finally {
      setConfirmSubmitting(false);
    }
  }

  function handleRequestDelete(project) {
    setActiveMenuId(null);
    // Logic của Backend: Chỉ cho xoá nếu là ROLE_ADMIN, ở đây UI chặn cơ bản trước.
    setConfirmState({ type: "delete", project });
  }

  async function confirmDeleteProject() {
    const project = confirmState.project;
    setConfirmSubmitting(true);
    try {
      await apiDeleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      pushToast("success", `Đã xóa dự án "${project.name}"`);
      setConfirmState(null);
    } catch (err) {
      pushToast("error", err?.response?.data?.message || "Xóa dự án thất bại");
    } finally {
      setConfirmSubmitting(false);
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
      value: projects.filter((p) => p.status === "IN_PROGRESS").length,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-700",
      iconColor: "text-emerald-200",
    },
    {
      label: "Kế hoạch",
      value: projects.filter((p) => p.status === "PLANNING").length,
      icon: CalendarDays,
      color: "from-amber-500 to-amber-700",
      iconColor: "text-amber-200",
    },
    {
      label: "Đã đóng",
      value: projects.filter(
        (p) => p.status === "COMPLETED" || p.status === "CANCELLED"
      ).length,
      icon: Lock,
      color: "from-rose-500 to-rose-700",
      iconColor: "text-rose-200",
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Danh sách dự án
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý và theo dõi tiến độ các dự án của doanh nghiệp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm dự án..."
              className="h-10 w-48 rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 shadow-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
            />
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Plus className="h-4 w-4" /> Tạo dự án
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
        <div className="min-h-[300px] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-slate-500">
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
              {isLoadingList ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    Không tìm thấy dự án nào.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const membersList = project.members || [];
                  return (
                    <tr
                      key={project.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {project.name}
                        </p>
                        <p className="line-clamp-1 text-xs text-slate-500">
                          {project.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {project.projectManagerName || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>BĐ: {formatDate(project.startDate)}</span>
                          <span>KT: {formatDate(project.endDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                            STATUS_BADGE[project.status]
                          }`}
                        >
                          {STATUS_LABEL[project.status] || project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {/* 
                          NẾU BACKEND CÓ TRẢ VỀ members: [{}, {}], ta hiện Avatar như sau. 
                          NẾU KHÔNG CÓ, ta hiện Tổng số lấy từ `memberCount`
                        */}
                        {membersList.length > 0 ? (
                          <div className="flex -space-x-2">
                            {membersList.slice(0, 4).map((m, i) => (
                              <div
                                key={i}
                                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white shadow-sm ring-2 ring-white ${avatarGradient(
                                  m.userId || i
                                )}`}
                              >
                                {initials(m.userFullName || m.name)}
                              </div>
                            ))}
                            {membersList.length > 4 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm ring-2 ring-white">
                                +{membersList.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-lg w-max">
                            <Users className="h-4 w-4" />{" "}
                            {project.memberCount || 0}
                          </div>
                        )}
                      </td>
                      <td className="relative px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === project.id ? null : project.id
                            )
                          }
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {activeMenuId === project.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-8 top-10 z-40 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200"
                          >
                            <button
                              onClick={() => {
                                setDetailProject(project);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4 text-slate-400" /> Xem chi
                              tiết
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(project)}
                              disabled={
                                project.status === "COMPLETED" ||
                                project.status === "CANCELLED"
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <Edit className="h-4 w-4 text-navy-500" /> Chỉnh
                              sửa
                            </button>
                            <button
                              onClick={() => {
                                setAddMemberProject(project);
                                setActiveMenuId(null);
                              }}
                              disabled={
                                project.status === "COMPLETED" ||
                                project.status === "CANCELLED"
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <UserPlus className="h-4 w-4 text-emerald-500" />{" "}
                              Thêm thành viên
                            </button>
                            <button
                              onClick={() => handleRequestClose(project)}
                              disabled={
                                project.status === "COMPLETED" ||
                                project.status === "CANCELLED"
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <Lock className="h-4 w-4 text-amber-500" /> Đóng
                              dự án
                            </button>
                            <div className="my-1 h-px w-full bg-slate-100" />
                            <button
                              onClick={() => handleRequestDelete(project)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" /> Xóa dự án
                            </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {modalMode === "CREATE" ? "Tạo dự án mới" : "Chỉnh sửa dự án"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-900">
                    Tên dự án <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-900">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-900">
                      Ngày bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        name="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={handleInputChange}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-900">
                      Ngày kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        name="endDate"
                        type="date"
                        value={form.endDate}
                        onChange={handleInputChange}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                      />
                    </div>
                  </div>
                </div>

                {modalMode === "EDIT" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-900">
                      Trạng thái
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                    >
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {formError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">
                    <XCircle className="h-4 w-4 shrink-0" /> {formError}
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="h-10 rounded-xl px-5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-6 text-sm font-semibold text-white shadow-md hover:bg-navy-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                  {modalMode === "CREATE" ? "Tạo dự án" : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onOpenAddMember={() => setAddMemberProject(detailProject)}
          pushToast={pushToast}
        />
      )}
      {addMemberProject && (
        <AddMemberModal
          project={addMemberProject}
          onClose={() => setAddMemberProject(null)}
          onAdded={() => {
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
            ? `Sẽ xóa vĩnh viễn "${confirmState?.project?.name}".`
            : `Sau khi đóng, "${confirmState?.project?.name}" sẽ không thể chỉnh sửa nữa.`
        }
        confirmLabel={confirmState?.type === "delete" ? "Xóa" : "Đóng"}
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
