import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../utils/axios.customize";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  User,
  Mail,
  CalendarDays,
  Shield,
  Check,
  AlertTriangle,
  KeyRound,
  Users,
} from "lucide-react";

const apiGetUsers = (params) =>
  axios.get("/users", { params }).then((res) => res.data);

const apiGetUser = (id) => axios.get(`/users/${id}`).then((res) => res.data);

const apiCreateUser = (payload) =>
  axios.post("/users", payload).then((res) => res.data);

const apiUpdateUser = (id, payload) =>
  axios.put(`/users/${id}`, payload).then((res) => res.data);

const apiDeleteUser = (id) =>
  axios.delete(`/users/${id}`).then((res) => res.data);

const apiLockUser = (id) =>
  axios.post(`/users/${id}/lock`).then((res) => res.data);

const apiUnlockUser = (id) =>
  axios.post(`/users/${id}/unlock`).then((res) => res.data);

const apiUpdateUserRole = (id, payload) =>
  axios.put(`/users/${id}/role`, payload).then((res) => res.data);

const apiGetUserPermissions = (id) =>
  axios.get(`/users/${id}/permissions`).then((res) => res.data);

const apiUpdateUserPermissions = (id, payload) =>
  axios.put(`/users/${id}/permissions`, payload).then((res) => res.data);

const ROLE_LABEL = {
  PM: "Quản lý dự án",
  MEMBER: "Thành viên",
};

const ROLE_BADGE = {
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-600/20",
  PM: "bg-blue-50 text-blue-700 ring-blue-600/20",
  DEV: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  TESTER: "bg-amber-50 text-amber-700 ring-amber-600/20",
  BA: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  DESIGNER: "bg-pink-50 text-pink-700 ring-pink-600/20",
  MEMBER: "bg-slate-100 text-slate-700 ring-slate-500/20",
  OTHER: "bg-gray-100 text-gray-700 ring-gray-500/20",
};

const ROLE_OPTIONS = [
  { value: "PM", label: "Quản lý dự án" },
  { value: "MEMBER", label: "Thành viên" },
];

const STATUS_LABEL = {
  ACTIVE: "Đang hoạt động",
  LOCKED: "Đã khóa",
};

const STATUS_BADGE = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  LOCKED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const PERMISSION_GROUPS = [
  {
    title: "Quản lý dự án",
    permissions: [
      {
        key: "PROJECT_VIEW",
        label: "Xem dự án",
      },
      {
        key: "PROJECT_CREATE",
        label: "Tạo dự án",
      },
      {
        key: "PROJECT_UPDATE",
        label: "Cập nhật dự án",
      },
      {
        key: "PROJECT_DELETE",
        label: "Xóa dự án",
      },
      {
        key: "PROJECT_MEMBER_MANAGE",
        label: "Quản lý thành viên",
      },
    ],
  },
  {
    title: "Quản lý công việc",
    permissions: [
      {
        key: "TASK_VIEW",
        label: "Xem công việc",
      },
      {
        key: "TASK_CREATE",
        label: "Tạo công việc",
      },
      {
        key: "TASK_UPDATE",
        label: "Cập nhật công việc",
      },
      {
        key: "TASK_DELETE",
        label: "Xóa công việc",
      },
    ],
  },
  {
    title: "Quản lý tài khoản",
    permissions: [
      {
        key: "USER_VIEW",
        label: "Xem tài khoản",
      },
      {
        key: "USER_CREATE",
        label: "Tạo tài khoản",
      },
      {
        key: "USER_UPDATE",
        label: "Cập nhật tài khoản",
      },
      {
        key: "USER_DELETE",
        label: "Xóa tài khoản",
      },
      {
        key: "USER_LOCK",
        label: "Khóa / mở khóa tài khoản",
      },
      {
        key: "USER_ROLE_UPDATE",
        label: "Phân quyền tài khoản",
      },
    ],
  },
  {
    title: "Báo cáo",
    permissions: [
      {
        key: "REPORT_VIEW",
        label: "Xem báo cáo",
      },
      {
        key: "REPORT_EXPORT",
        label: "Xuất báo cáo",
      },
    ],
  },
];

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    return parts[0].substring(0, 1).toUpperCase();
  }

  return (
    parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)
  ).toUpperCase();
};

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message || error?.response?.data?.error || fallback
  );
};

export default function AccountManagement() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [actionMenuId, setActionMenuId] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);

  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((type, message) => {
    setNotification({
      type,
      message,
    });

    setTimeout(() => {
      setNotification(null);
    }, 3500);
  }, []);

  const fetchUsers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await apiGetUsers({
          page,
          size,
          keyword: search.trim() || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        });

        setUsers(response?.content || []);
        setTotalElements(response?.totalElements || 0);
        setTotalPages(response?.totalPages || 0);
      } catch (error) {
        showNotification(
          "error",
          getApiErrorMessage(error, "Không thể tải danh sách tài khoản")
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, size, search, roleFilter, statusFilter, showNotification]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    setPage(0);
  }, [search, roleFilter, statusFilter, size]);

  useEffect(() => {
    const handleClick = () => {
      setActionMenuId(null);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const stats = useMemo(() => {
    const activeCount = users.filter((user) => user.status === "ACTIVE").length;

    const lockedCount = users.filter((user) => user.status === "LOCKED").length;

    const adminCount = users.filter((user) => user.role === "ADMIN").length;

    return {
      total: totalElements,
      active: activeCount,
      locked: lockedCount,
      admin: adminCount,
    };
  }, [users, totalElements]);

  const handleCreate = async (form) => {
    try {
      await apiCreateUser(form);

      setShowCreateModal(false);

      showNotification("success", "Tạo tài khoản thành công");

      fetchUsers(true);
    } catch (error) {
      showNotification(
        "error",
        getApiErrorMessage(error, "Không thể tạo tài khoản")
      );
    }
  };

  const handleUpdate = async (form) => {
    if (!selectedUser) return;

    try {
      await apiUpdateUser(selectedUser.id, form);

      setShowEditModal(false);
      setSelectedUser(null);

      showNotification("success", "Cập nhật tài khoản thành công");

      fetchUsers(true);
    } catch (error) {
      showNotification(
        "error",
        getApiErrorMessage(error, "Không thể cập nhật tài khoản")
      );
    }
  };

  const handleDelete = async () => {
    if (!confirmAction?.user) return;

    try {
      await apiDeleteUser(confirmAction.user.id);

      setConfirmAction(null);

      showNotification("success", "Xóa tài khoản thành công");

      if (users.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        fetchUsers(true);
      }
    } catch (error) {
      setConfirmAction(null);

      showNotification(
        "error",
        getApiErrorMessage(
          error,
          "Không thể xóa tài khoản. Tài khoản có thể còn dữ liệu liên quan."
        )
      );
    }
  };

  const handleLockUnlock = async () => {
    if (!confirmAction?.user) return;

    const user = confirmAction.user;

    try {
      if (user.status === "ACTIVE") {
        await apiLockUser(user.id);
      } else {
        await apiUnlockUser(user.id);
      }

      setConfirmAction(null);

      showNotification(
        "success",
        user.status === "ACTIVE"
          ? "Khóa tài khoản thành công"
          : "Mở khóa tài khoản thành công"
      );

      fetchUsers(true);
    } catch (error) {
      setConfirmAction(null);

      showNotification(
        "error",
        getApiErrorMessage(error, "Không thể cập nhật trạng thái tài khoản")
      );
    }
  };

  const handleUpdateRole = async (role) => {
    if (!selectedUser) return;

    try {
      await apiUpdateUserRole(selectedUser.id, {
        role,
      });

      showNotification("success", "Cập nhật vai trò thành công");

      fetchUsers(true);
    } catch (error) {
      showNotification(
        "error",
        getApiErrorMessage(error, "Không thể cập nhật vai trò")
      );
    }
  };

  const handleUpdatePermissions = async (permissions) => {
    if (!selectedUser) return;

    try {
      await apiUpdateUserPermissions(selectedUser.id, {
        permissions,
      });

      showNotification("success", "Cập nhật quyền thành công");

      setShowPermissionModal(false);

      fetchUsers(true);
    } catch (error) {
      showNotification(
        "error",
        getApiErrorMessage(error, "Không thể cập nhật quyền")
      );
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setActionMenuId(null);
  };

  const openDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
    setActionMenuId(null);
  };

  const openPermission = (user) => {
    setSelectedUser(user);
    setShowPermissionModal(true);
    setActionMenuId(null);
  };

  const openLockUnlock = (user) => {
    setConfirmAction({
      type: user.status === "ACTIVE" ? "lock" : "unlock",
      user,
    });

    setActionMenuId(null);
  };

  const openDelete = (user) => {
    setConfirmAction({
      type: "delete",
      user,
    });

    setActionMenuId(null);
  };

  const firstItem = totalElements === 0 ? 0 : page * size + 1;

  const lastItem = Math.min((page + 1) * size, totalElements);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    const pages = [];

    pages.push(0);

    if (page > 3) {
      pages.push("left-ellipsis");
    }

    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages - 2, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 4) {
      pages.push("right-ellipsis");
    }

    pages.push(totalPages - 1);

    return pages;
  }, [page, totalPages]);

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {notification && (
        <div className="fixed right-5 top-5 z-[100]">
          <div
            className={`flex min-w-[320px] items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${
              notification.type === "success"
                ? "border-emerald-200"
                : "border-rose-200"
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                notification.type === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {notification.type === "success" ? (
                <Check size={17} />
              ) : (
                <AlertTriangle size={17} />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {notification.type === "success"
                  ? "Thành công"
                  : "Có lỗi xảy ra"}
              </p>

              <p className="mt-0.5 text-sm text-slate-600">
                {notification.message}
              </p>
            </div>

            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Users size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Quản lý tài khoản
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Quản lý người dùng, vai trò và quyền truy cập hệ thống
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <Plus size={18} />
            Thêm tài khoản
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={<Users size={20} />}
            label="Tổng tài khoản"
            value={stats.total}
            description="Tổng số tài khoản"
            iconClass="bg-slate-100 text-slate-700"
          />

          <StatCard
            icon={<Check size={20} />}
            label="Đang hoạt động"
            value={stats.active}
            description="Tài khoản có thể đăng nhập"
            iconClass="bg-emerald-100 text-emerald-700"
          />

          <StatCard
            icon={<Lock size={20} />}
            label="Đã khóa"
            value={stats.locked}
            description="Tài khoản đang bị khóa"
            iconClass="bg-rose-100 text-rose-700"
          />
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo họ tên hoặc email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            {/* ROLE */}

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              <option value="">Tất cả vai trò</option>

              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              <option value="">Tất cả trạng thái</option>

              <option value="ACTIVE">Đang hoạt động</option>

              <option value="LOCKED">Đã khóa</option>
            </select>

            {/* REFRESH */}

            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Làm mới
            </button>
          </div>

          {/* FILTER SUMMARY */}

          {(search || roleFilter || statusFilter) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
              <span className="text-xs font-medium text-slate-500">
                Bộ lọc:
              </span>

              {search && (
                <FilterChip
                  label={`"${search}"`}
                  onRemove={() => setSearch("")}
                />
              )}

              {roleFilter && (
                <FilterChip
                  label={ROLE_LABEL[roleFilter]}
                  onRemove={() => setRoleFilter("")}
                />
              )}

              {statusFilter && (
                <FilterChip
                  label={STATUS_LABEL[statusFilter]}
                  onRemove={() => setStatusFilter("")}
                />
              )}

              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setStatusFilter("");
                }}
                className="ml-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Người dùng
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Vai trò
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Ngày tạo
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cập nhật
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableSkeleton />
                ) : users.length === 0 ? (
                  <EmptyState />
                ) : (
                  users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      actionMenuId={actionMenuId}
                      setActionMenuId={setActionMenuId}
                      onView={openDetail}
                      onEdit={openEdit}
                      onPermission={openPermission}
                      onLockUnlock={openLockUnlock}
                      onDelete={openDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>
                Hiển thị{" "}
                <span className="font-semibold text-slate-700">
                  {firstItem}
                </span>
                –
                <span className="font-semibold text-slate-700">{lastItem}</span>{" "}
                trong{" "}
                <span className="font-semibold text-slate-700">
                  {totalElements}
                </span>{" "}
                tài khoản
              </span>

              <select
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-slate-400"
              >
                {PAGE_SIZE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} / trang
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <PaginationButton
                disabled={page === 0}
                onClick={() => setPage(0)}
              >
                <ChevronsLeft size={16} />
              </PaginationButton>

              <PaginationButton
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft size={16} />
              </PaginationButton>

              {pageNumbers.map((pageNumber) => {
                if (
                  pageNumber === "left-ellipsis" ||
                  pageNumber === "right-ellipsis"
                ) {
                  return (
                    <span
                      key={pageNumber}
                      className="px-2 text-sm text-slate-400"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition ${
                      page === pageNumber
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                );
              })}

              <PaginationButton
                disabled={totalPages === 0 || page >= totalPages - 1}
                onClick={() =>
                  setPage((current) => Math.min(totalPages - 1, current + 1))
                }
              >
                <ChevronRight size={16} />
              </PaginationButton>

              <PaginationButton
                disabled={totalPages === 0 || page >= totalPages - 1}
                onClick={() => setPage(Math.max(0, totalPages - 1))}
              >
                <ChevronsRight size={16} />
              </PaginationButton>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <UserFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {showEditModal && selectedUser && (
        <UserFormModal
          mode="edit"
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdate}
        />
      )}

      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showPermissionModal && selectedUser && (
        <PermissionModal
          user={selectedUser}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedUser(null);
          }}
          onRoleUpdate={handleUpdateRole}
          onPermissionUpdate={handleUpdatePermissions}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={
            confirmAction.type === "delete" ? handleDelete : handleLockUnlock
          }
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, description, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
      {label}

      <button
        onClick={onRemove}
        className="text-slate-400 transition hover:text-slate-700"
      >
        <X size={13} />
      </button>
    </span>
  );
}

function UserRow({
  user,
  actionMenuId,
  setActionMenuId,
  onView,
  onEdit,
  onPermission,
  onLockUnlock,
  onDelete,
}) {
  const isOpen = actionMenuId === user.id;

  return (
    <tr className="group transition hover:bg-slate-50/70">
      {/* USER */}

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
            {getInitials(user.fullName)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.fullName || "Chưa có tên"}
            </p>

            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Mail size={12} />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>
      </td>

      {/* ROLE */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
            ROLE_BADGE[user.role] || ROLE_BADGE.OTHER
          }`}
        >
          {ROLE_LABEL[user.role] || user.role || "Khác"}
        </span>
      </td>

      {/* STATUS */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
            STATUS_BADGE[user.status] || STATUS_BADGE.LOCKED
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              user.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />

          {STATUS_LABEL[user.status] || user.status}
        </span>
      </td>

      {/* CREATED */}

      <td className="px-5 py-4 text-sm text-slate-600">
        {formatDate(user.createdAt)}
      </td>

      {/* UPDATED */}

      <td className="px-5 py-4 text-sm text-slate-600">
        {formatDate(user.updatedAt)}
      </td>

      {/* ACTIONS */}

      <td className="relative px-5 py-4 text-right">
        <button
          onClick={(event) => {
            event.stopPropagation();

            setActionMenuId(isOpen ? null : user.id);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <MoreHorizontal size={19} />
        </button>

        {isOpen && (
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute right-5 top-12 z-30 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl"
          >
            <ActionMenuItem
              icon={<Eye size={16} />}
              label="Xem chi tiết"
              onClick={() => onView(user)}
            />

            <ActionMenuItem
              icon={<Pencil size={16} />}
              label="Chỉnh sửa"
              onClick={() => onEdit(user)}
            />

            <ActionMenuItem
              icon={<ShieldCheck size={16} />}
              label="Phân quyền"
              onClick={() => onPermission(user)}
            />

            <ActionMenuItem
              icon={
                user.status === "ACTIVE" ? (
                  <Lock size={16} />
                ) : (
                  <Unlock size={16} />
                )
              }
              label={
                user.status === "ACTIVE"
                  ? "Khóa tài khoản"
                  : "Mở khóa tài khoản"
              }
              onClick={() => onLockUnlock(user)}
            />

            <div className="my-1 border-t border-slate-100" />

            <ActionMenuItem
              danger
              icon={<Trash2 size={16} />}
              label="Xóa tài khoản"
              onClick={() => onDelete(user)}
            />
          </div>
        )}
      </td>
    </tr>
  );
}

function ActionMenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PaginationButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />

              <div className="space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-44 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-5 py-5">
            <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
          </td>

          <td className="px-5 py-5">
            <div className="h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
          </td>

          <td className="px-5 py-5">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-5">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-5">
            <div className="ml-auto h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={6} className="px-5 py-20 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users size={26} />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            Không tìm thấy tài khoản
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
          </p>
        </div>
      </td>
    </tr>
  );
}

function Modal({ children, onClose, maxWidth = "max-w-lg" }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className={`relative max-h-[90vh] w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon, title, description, onClose }) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function UserFormModal({ mode, user, onClose, onSubmit }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    role: user?.role || "MEMBER",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Họ tên không được để trống";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (!isEdit) {
      if (!form.password) {
        nextErrors.password = "Mật khẩu không được để trống";
      } else if (form.password.length < 6) {
        nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }

      if (!form.confirmPassword) {
        nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      }
    }

    if (!form.role) {
      nextErrors.role = "Vui lòng chọn vai trò";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      if (!isEdit) {
        payload.password = form.password;
      }

      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <ModalHeader
        icon={isEdit ? <Pencil size={19} /> : <Plus size={19} />}
        title={isEdit ? "Cập nhật tài khoản" : "Thêm tài khoản"}
        description={
          isEdit
            ? "Cập nhật thông tin tài khoản người dùng."
            : "Tạo tài khoản người dùng mới cho hệ thống."
        }
        onClose={onClose}
      />

      <form
        onSubmit={submit}
        className="max-h-[calc(90vh-90px)] overflow-y-auto"
      >
        <div className="space-y-5 px-6 py-6">
          {/* FULL NAME */}

          <FormField label="Họ và tên" required error={errors.fullName}>
            <Input
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Nguyễn Văn A"
              icon={<User size={17} />}
              error={errors.fullName}
            />
          </FormField>

          {/* EMAIL */}

          <FormField label="Email" required error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="example@gmail.com"
              icon={<Mail size={17} />}
              error={errors.email}
            />
          </FormField>

          {/* PASSWORD */}

          {!isEdit && (
            <>
              <FormField label="Mật khẩu" required error={errors.password}>
                <PasswordInput
                  value={form.password}
                  onChange={(value) => updateField("password", value)}
                  visible={showPassword}
                  setVisible={setShowPassword}
                  error={errors.password}
                />
              </FormField>

              <FormField
                label="Xác nhận mật khẩu"
                required
                error={errors.confirmPassword}
              >
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(value) => updateField("confirmPassword", value)}
                  visible={showConfirmPassword}
                  setVisible={setShowConfirmPassword}
                  error={errors.confirmPassword}
                />
              </FormField>
            </>
          )}

          {/* ROLE */}

          <FormField label="Vai trò" required error={errors.role}>
            <select
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
              className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                errors.role
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-50"
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
              }`}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <RefreshCw size={15} className="animate-spin" />}

            {isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}

function Input({ icon, error, ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      )}

      <input
        {...props}
        className={`h-11 w-full rounded-xl border bg-white pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          icon ? "pl-10" : "pl-4"
        } ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-50"
            : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
        }`}
      />
    </div>
  );
}

function PasswordInput({ value, onChange, visible, setVisible, error }) {
  return (
    <div className="relative">
      <KeyRound
        size={17}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nhập mật khẩu"
        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-50"
            : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
        }`}
      />

      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-700"
      >
        {visible ? "Ẩn" : "Hiện"}
      </button>
    </div>
  );
}

function UserDetailModal({ user, onClose }) {
  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <ModalHeader
        icon={<Eye size={19} />}
        title="Chi tiết tài khoản"
        description="Thông tin tài khoản người dùng."
        onClose={onClose}
      />

      <div className="max-h-[calc(90vh-90px)] overflow-y-auto px-6 py-6">
        {/* PROFILE */}

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
            {getInitials(user.fullName)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">
              {user.fullName}
            </h3>

            <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
          </div>

          <span
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
              STATUS_BADGE[user.status] || STATUS_BADGE.LOCKED
            }`}
          >
            {STATUS_LABEL[user.status]}
          </span>
        </div>

        {/* INFO */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoBox
            icon={<Shield size={17} />}
            label="Vai trò"
            value={ROLE_LABEL[user.role] || user.role}
          />

          <InfoBox
            icon={<CalendarDays size={17} />}
            label="Ngày tạo"
            value={formatDate(user.createdAt)}
          />

          <InfoBox
            icon={<CalendarDays size={17} />}
            label="Cập nhật lần cuối"
            value={formatDate(user.updatedAt)}
          />

          <InfoBox icon={<Mail size={17} />} label="Email" value={user.email} />
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <button
          onClick={onClose}
          className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Đóng
        </button>
      </div>
    </Modal>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-xs font-medium">{label}</span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function PermissionModal({ user, onClose, onRoleUpdate, onPermissionUpdate }) {
  const [role, setRole] = useState(user.role || "MEMBER");

  const [permissions, setPermissions] = useState(user.permissions || []);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await apiGetUserPermissions(user.id);

        if (Array.isArray(response)) {
          setPermissions(response);
        } else if (Array.isArray(response?.permissions)) {
          setPermissions(response.permissions);
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadPermissions();
  }, [user.id]);

  const togglePermission = (key) => {
    setPermissions((current) =>
      current.includes(key)
        ? current.filter((permission) => permission !== key)
        : [...current, key]
    );
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      if (role !== user.role) {
        await onRoleUpdate(role);
      }

      await onPermissionUpdate(permissions);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <ModalHeader
        icon={<ShieldCheck size={19} />}
        title="Phân quyền tài khoản"
        description={`${user.fullName} · ${user.email}`}
        onClose={onClose}
      />

      <div className="max-h-[calc(90vh-150px)] overflow-y-auto">
        {/* ROLE */}

        <div className="border-b border-slate-100 px-6 py-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Vai trò
          </label>

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* PERMISSIONS */}

        <div className="space-y-5 px-6 py-5">
          {PERMISSION_GROUPS.map((group) => (
            <div
              key={group.title}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {group.title}
                </h3>
              </div>

              <div className="grid gap-1 p-2 sm:grid-cols-2">
                {group.permissions.map((permission) => {
                  const checked = permissions.includes(permission.key);

                  return (
                    <label
                      key={permission.key}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(permission.key)}
                        className="peer sr-only"
                      />

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          checked
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked && <Check size={13} strokeWidth={3} />}
                      </span>

                      <span className="text-sm text-slate-700">
                        {permission.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}

      <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading && <RefreshCw size={15} className="animate-spin" />}
          Lưu thay đổi
        </button>
      </div>
    </Modal>
  );
}

function ConfirmModal({ action, onClose, onConfirm }) {
  const user = action.user;

  const isDelete = action.type === "delete";

  const isLock = action.type === "lock";

  const isUnlock = action.type === "unlock";

  let title = "";
  let description = "";
  let confirmText = "";

  if (isDelete) {
    title = "Xóa tài khoản?";
    description =
      "Tài khoản sẽ bị xóa khỏi hệ thống. Hãy chắc chắn rằng tài khoản không còn dữ liệu liên quan.";
    confirmText = "Xóa tài khoản";
  }

  if (isLock) {
    title = "Khóa tài khoản?";
    description =
      "Người dùng sẽ không thể đăng nhập vào hệ thống cho đến khi tài khoản được mở khóa.";
    confirmText = "Khóa tài khoản";
  }

  if (isUnlock) {
    title = "Mở khóa tài khoản?";
    description = "Tài khoản sẽ có thể đăng nhập và sử dụng hệ thống trở lại.";
    confirmText = "Mở khóa";
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          {isDelete ? (
            <Trash2 size={22} />
          ) : isLock ? (
            <Lock size={22} />
          ) : (
            <Unlock size={22} />
          )}
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">
              {getInitials(user.fullName)}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {user.fullName}
              </p>

              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>

        {isDelete && (
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />

            <p>
              Nếu tài khoản đang được sử dụng trong dự án hoặc công việc, hệ
              thống có thể từ chối thao tác xóa.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <button
          onClick={onClose}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Hủy
        </button>

        <button
          onClick={onConfirm}
          className={`h-10 rounded-xl px-5 text-sm font-semibold text-white ${
            isDelete
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
