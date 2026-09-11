import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../utils/axios.customize";
import getInitials from "../../components/get-avatar-name";

import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  X,
  Check,
  UserCheck,
  Code2,
  TestTube2,
  Palette,
  BriefcaseBusiness,
  Crown,
  MoreHorizontal,
  FolderKanban,
  AlertCircle,
  UserRound,
} from "lucide-react";

const apiGetProjects = () => axios.get("/projects").then((res) => res.data);

const apiGetProjectMembers = (projectId, params = {}) =>
  axios
    .get(`/projects/${projectId}/members/pagination`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        keyword: params.keyword ?? "",
        role: params.role || null,
        status: params.status || null,
        sortBy: params.sortBy ?? "joinedAt",
        direction: params.direction ?? "desc",
      },
    })
    .then((res) => res.data);

const apiAddMember = (projectId, payload) =>
  axios.post(`/projects/${projectId}/members`, payload).then((res) => res.data);

const apiUpdateMemberRole = (projectId, userId, payload) =>
  axios
    .put(`/projects/${projectId}/members/${userId}/role`, payload)
    .then((res) => res.data);

const apiRemoveMember = (projectId, userId) =>
  axios
    .delete(`/projects/${projectId}/members/${userId}`)
    .then((res) => res.data);

const apiSearchUsers = (q) =>
  axios
    .get("/users/search", {
      params: { q },
    })
    .then((res) => res.data);

const ROLE_CONFIG = {
  PM: {
    label: "Project Manager",
    shortLabel: "PM",
    icon: Crown,
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
  },

  MEMBER: {
    label: "Thành viên",
    shortLabel: "Member",
    icon: UserRound,
    className: "bg-slate-100 text-slate-700 ring-slate-600/20",
  },

  DEV: {
    label: "Developer",
    shortLabel: "Developer",
    icon: Code2,
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },

  TESTER: {
    label: "Tester",
    shortLabel: "Tester",
    icon: TestTube2,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },

  BA: {
    label: "Business Analyst",
    shortLabel: "BA",
    icon: BriefcaseBusiness,
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },

  DESIGNER: {
    label: "Designer",
    shortLabel: "Designer",
    icon: Palette,
    className: "bg-pink-50 text-pink-700 ring-pink-600/20",
  },

  OTHER: {
    label: "Khác",
    shortLabel: "Khác",
    icon: Users,
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  },
};

const ROLE_OPTIONS = ["MEMBER", "DEV", "TESTER", "BA", "DESIGNER", "OTHER"];

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Đang hoạt động",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },

  LOCKED: {
    label: "Đã khóa",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
};

const STATUS_PROJECT = {
  PLANNING: "Kế hoạch",
  IN_PROGRESS: "Đang thực hiện",
  ON_HOLD: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
};

function getMemberUserId(member) {
  return member.userId ?? member.user?.id ?? member.user?.userId;
}

function getMemberName(member) {
  return (
    member.userFullName ??
    "Không xác định"
  );
}

function getMemberEmail(member) {
  return member.userEmail ?? "";
}

function getMemberRole(member) {
  return member.role ?? "MEMBER";
}

function getMemberStatus(member) {
  return member.userStatus ?? "ACTIVE";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
}

export default function PMTeam() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [members, setMembers] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(true);

  const [loadingMembers, setLoadingMembers] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");

  const [roleFilter, setRoleFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] = useState(10);

  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [editingMember, setEditingMember] = useState(null);

  const [removingMember, setRemovingMember] = useState(null);

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchKeyword, roleFilter, statusFilter, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [searchKeyword, roleFilter, statusFilter, pageSize]);
  
  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([]);
      return;
    }
  
    loadMembers(selectedProjectId);
  }, [selectedProjectId, page]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");

      const data = await apiGetProjects();

      const list = Array.isArray(data) ? data : data?.content ?? [];

      setProjects(list);

      if (list.length > 0) {
        setSelectedProjectId(String(list[0].id));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải danh sách dự án");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadMembers = useCallback(
    async (projectId) => {
      try {
        setLoadingMembers(true);
        setError("");

        const data = await apiGetProjectMembers(projectId, {
          page: page,
          size: pageSize,
          keyword: searchKeyword.trim(),
          role: roleFilter || null,
          status: statusFilter || null,
          // sortBy: "joinedAt",
          // direction: "desc"
        });

        const list = Array.isArray(data) ? data : data?.content ?? [];

        setMembers(list);
        setPage(0);
      } catch (err) {
        setMembers([]);
        setError(
          err?.response?.data?.message || "Không thể tải danh sách thành viên"
        );
      } finally {
        setLoadingMembers(false);
      }
    },
    [page, pageSize, searchKeyword, roleFilter, statusFilter]
  );

  const handleRefresh = async () => {
    if (!selectedProjectId) {
      await loadProjects();
      return;
    }

    try {
      setRefreshing(true);
      await loadMembers(selectedProjectId);
    } finally {
      setRefreshing(false);
    }
  };

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => String(project.id) === String(selectedProjectId)
      ),
    [projects, selectedProjectId]
  );

  const filteredMembers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return members.filter((member) => {
      const name = getMemberName(member).toLowerCase();

      const email = getMemberEmail(member).toLowerCase();

      const role = getMemberRole(member);

      const status = getMemberStatus(member);

      const matchKeyword =
        !keyword || name.includes(keyword) || email.includes(keyword);

      const matchRole = !roleFilter || role === roleFilter;

      const matchStatus = !statusFilter || status === statusFilter;

      return matchKeyword && matchRole && matchStatus;
    });
  }, [members, searchKeyword, roleFilter, statusFilter]);

  const totalElements = filteredMembers.length;

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  const currentPageMembers = filteredMembers.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const stats = useMemo(() => {
    return {
      total: members.length,

      developers: members.filter((member) => getMemberRole(member) === "DEV")
        .length,

      testers: members.filter((member) => getMemberRole(member) === "TESTER")
        .length,

      others: members.filter((member) =>
        ["BA", "DESIGNER", "MEMBER", "OTHER"].includes(getMemberRole(member))
      ).length,
    };
  }, [members]);

  const handleAddSuccess = async () => {
    setShowAddModal(false);

    if (selectedProjectId) {
      await loadMembers(selectedProjectId);
    }
  };

  const handleEditSuccess = async () => {
    setEditingMember(null);

    if (selectedProjectId) {
      await loadMembers(selectedProjectId);
    }
  };

  const handleRemove = async () => {
    if (!removingMember || !selectedProjectId) {
      return;
    }

    try {
      await apiRemoveMember(selectedProjectId, getMemberUserId(removingMember));

      setRemovingMember(null);

      await loadMembers(selectedProjectId);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể xóa thành viên");
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Quản lý</span>
              <span>/</span>
              <span className="text-slate-700">Thành viên Team</span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Thành viên Team
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý thành viên và vai trò trong các dự án bạn phụ trách.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={!selectedProjectId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={18} />
            Thêm thành viên
          </button>
        </div>

        {/* PROJECT SELECTOR */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FolderKanban size={21} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Dự án đang quản lý
                </p>

                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={() => setShowProjectDropdown((value) => !value)}
                    className="flex items-center gap-2 text-left text-base font-semibold text-slate-900"
                  >
                    {loadingProjects
                      ? "Đang tải dự án..."
                      : selectedProject?.name || "Chưa chọn dự án"}

                    <ChevronRight
                      size={17}
                      className={`transition ${
                        showProjectDropdown ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {showProjectDropdown && (
                    <div className="absolute left-0 top-full z-40 mt-2 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                      {projects.length === 0 ? (
                        <div className="px-4 py-5 text-center text-sm text-slate-500">
                          Chưa có dự án
                        </div>
                      ) : (
                        projects.map((project) => (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(String(project.id));
                              setShowProjectDropdown(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition ${
                              String(project.id) === String(selectedProjectId)
                                ? "bg-slate-100"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {project.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {STATUS_PROJECT[project.status] ||
                                  project.status}
                              </p>
                            </div>

                            {String(project.id) ===
                              String(selectedProjectId) && (
                              <Check
                                size={17}
                                className="shrink-0 text-blue-600"
                              />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedProject && (
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                    selectedProject.status === "IN_PROGRESS"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                      : selectedProject.status === "CLOSED"
                      ? "bg-slate-100 text-slate-600 ring-slate-500/20"
                      : "bg-blue-50 text-blue-700 ring-blue-600/20"
                  }`}
                >
                  {STATUS_PROJECT[selectedProject.status] ||
                    selectedProject.status}
                </span>

                <span className="text-sm text-slate-400">
                  {formatDate(selectedProject.startDate)} —{" "}
                  {formatDate(selectedProject.endDate)}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-rose-500 hover:text-rose-700"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tổng thành viên"
            value={stats.total}
            description="Thành viên trong dự án"
            icon={Users}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Developer"
            value={stats.developers}
            description="Thành viên phát triển"
            icon={Code2}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            title="Tester"
            value={stats.testers}
            description="Thành viên kiểm thử"
            icon={TestTube2}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Vai trò khác"
            value={stats.others}
            description="BA, Designer, Member..."
            icon={UserCheck}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* TOOLBAR */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Tìm theo họ tên hoặc email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Filter
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="h-11 min-w-[175px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">Tất cả vai trò</option>

                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_CONFIG[role].label}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 min-w-[165px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Tất cả trạng thái</option>

                  <option value="ACTIVE">Đang hoạt động</option>

                  <option value="LOCKED">Đã khóa</option>
                </select>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw
                    size={17}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Làm mới
                </button>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Thành viên
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Vai trò
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tham gia
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loadingMembers ? (
                  <LoadingRows />
                ) : currentPageMembers.length === 0 ? (
                  <EmptyState
                    hasFilter={
                      Boolean(searchKeyword) ||
                      Boolean(roleFilter) ||
                      Boolean(statusFilter)
                    }
                    onClear={() => {
                      setSearchKeyword("");
                      setRoleFilter("");
                      setStatusFilter("");
                    }}
                  />
                ) : (
                  currentPageMembers.map((member) => (
                    <MemberRow
                      key={getMemberUserId(member) ?? member.id}
                      member={member}
                      onEdit={() => setEditingMember(member)}
                      onRemove={() => setRemovingMember(member)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              <span className="font-semibold text-slate-800">
                {totalElements === 0 ? 0 : page * pageSize + 1}
              </span>
              –
              <span className="font-semibold text-slate-800">
                {Math.min((page + 1) * pageSize, totalElements)}
              </span>{" "}
              trong{" "}
              <span className="font-semibold text-slate-800">
                {totalElements}
              </span>{" "}
              thành viên
            </p>

            <div className="flex items-center gap-4">
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
              >
                <option value={5}>5 / trang</option>

                <option value={10}>10 / trang</option>

                <option value={20}>20 / trang</option>

                <option value={50}>50 / trang</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  «
                </button>

                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white">
                  {page + 1}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages - 1, value + 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(totalPages - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showAddModal && (
        <AddMemberModal
          projectId={selectedProjectId}
          existingMembers={members}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {editingMember && (
        <EditRoleModal
          projectId={selectedProjectId}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {removingMember && (
        <RemoveMemberModal
          member={removingMember}
          onClose={() => setRemovingMember(null)}
          onConfirm={handleRemove}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, onEdit, onRemove }) {
  const name = getMemberName(member);
  const email = getMemberEmail(member);
  const role = getMemberRole(member);
  const status = getMemberStatus(member);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.MEMBER;

  const RoleIcon = roleConfig.icon;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;

  return (
    <tr className="group transition hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
            {getInitials(name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {name}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {email || "Chưa có email"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ${roleConfig.className}`}
        >
          <RoleIcon size={14} />
          {roleConfig.label}
        </span>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ${statusConfig.className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusConfig.label}
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-slate-500">
        {formatDate(member.joinedAt)}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            disabled={role === "PM"}
            title={
              role === "PM" ? "Không thể thay đổi vai trò PM" : "Đổi vai trò"
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Edit3 size={17} />
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={role === "PM"}
            title={role === "PM" ? "Không thể xóa PM" : "Xóa thành viên"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Trash2 size={17} />
          </button>

          {/* <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal size={17} />
          </button> */}
        </div>
      </td>
    </tr>
  );
}

function LoadingRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <tr key={item}>
          <td className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />

              <div className="space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-44 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-6 py-5">
            <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
          </td>

          <td className="px-6 py-5">
            <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
          </td>

          <td className="px-6 py-5">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-6 py-5">
            <div className="ml-auto h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState({ hasFilter, onClear }) {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-20">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users size={29} />
          </div>

          <h3 className="mt-5 text-base font-bold text-slate-900">
            {hasFilter ? "Không tìm thấy thành viên" : "Chưa có thành viên"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {hasFilter
              ? "Không có thành viên nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
              : "Dự án hiện chưa có thành viên. Hãy thêm thành viên để bắt đầu quản lý team."}
          </p>

          {hasFilter && (
            <button
              type="button"
              onClick={onClear}
              className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function AddMemberModal({ projectId, existingMembers, onClose, onSuccess }) {
  const [keyword, setKeyword] = useState("");

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);

  const [role, setRole] = useState("DEV");

  const [loading, setLoading] = useState(false);

  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!keyword.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(() => searchUsers(), 350);

    return () => clearTimeout(timer);
  }, [keyword]);

  const existingIds = new Set(
    existingMembers.map((member) => String(getMemberUserId(member)))
  );

  const searchUsers = async () => {
    try {
      setSearching(true);
      setError("");

      const data = await apiSearchUsers(keyword.trim());

      const list = Array.isArray(data) ? data : data?.content ?? [];

      setUsers(list.filter((user) => !existingIds.has(String(user.id))));
    } catch (err) {
      setUsers([]);

      setError(err?.response?.data?.message || "Không thể tìm kiếm người dùng");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError("Vui lòng chọn một thành viên");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await apiAddMember(projectId, {
        userId: selectedUser.id,
        role,
      });

      await onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể thêm thành viên");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Thêm thành viên"
      subtitle="Thêm một người dùng vào dự án và phân công vai trò."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Tìm thành viên
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              autoFocus
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setSelectedUser(null);
              }}
              placeholder="Nhập họ tên hoặc email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

            {searching && (
              <RefreshCw
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
              />
            )}
          </div>

          {users.length > 0 && !selectedUser && (
            <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
              {users.map((user) => (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setKeyword(user.fullName ?? user.name ?? user.email);
                    setUsers([]);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    {getInitials(user.fullName ?? user.name)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user.fullName ?? user.name}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {getInitials(selectedUser.fullName ?? selectedUser.name)}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedUser.fullName ?? selectedUser.name}
                  </p>

                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Vai trò trong dự án
          </label>

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          >
            {ROLE_OPTIONS.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {ROLE_CONFIG[roleOption].label}
              </option>
            ))}
          </select>
        </div>

        {error && <ErrorBox message={error} />}

        <ModalActions
          onClose={onClose}
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Thêm thành viên"
        />
      </div>
    </ModalShell>
  );
}

function EditRoleModal({ projectId, member, onClose, onSuccess }) {
  const [role, setRole] = useState(getMemberRole(member));

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      await apiUpdateMemberRole(projectId, getMemberUserId(member), { role });

      await onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể cập nhật vai trò");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Thay đổi vai trò"
      subtitle="Cập nhật vai trò của thành viên trong dự án."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-600 shadow-sm">
            {getInitials(getMemberName(member))}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {getMemberName(member)}
            </p>

            <p className="text-xs text-slate-500">{getMemberEmail(member)}</p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Vai trò mới
          </label>

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          >
            {ROLE_OPTIONS.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {ROLE_CONFIG[roleOption].label}
              </option>
            ))}
          </select>
        </div>

        {error && <ErrorBox message={error} />}

        <ModalActions
          onClose={onClose}
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Lưu thay đổi"
        />
      </div>
    </ModalShell>
  );
}

function RemoveMemberModal({ member, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Xóa thành viên"
      subtitle="Thành viên sẽ không còn thuộc dự án này."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Trash2 size={19} />
            </div>

            <div>
              <p className="text-sm font-bold text-rose-900">
                Bạn có chắc muốn xóa thành viên này?
              </p>

              <p className="mt-1 text-sm leading-6 text-rose-700">
                <strong>{getMemberName(member)}</strong> sẽ bị xóa khỏi dự án.
                Các công việc đang được giao cho thành viên có thể khiến hệ
                thống từ chối thao tác này.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
            {getInitials(getMemberName(member))}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {getMemberName(member)}
            </p>

            <p className="text-xs text-slate-500">{getMemberEmail(member)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading && <RefreshCw size={16} className="animate-spin" />}
            Xóa thành viên
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>

            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSubmit, loading, submitText }) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Hủy
      </button>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <Check size={16} />
        )}

        {submitText}
      </button>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />

      <span>{message}</span>
    </div>
  );
}
