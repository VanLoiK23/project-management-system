import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Bug,
  X,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Send,
  UserCircle2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CircleDot,
  Clock3,
  CheckCircle2,
  AlertOctagon,
  UserRound,
  CalendarDays,
  ImagePlus,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const apiFetchProjects = () => axios.get("/projects").then((res) => res.data);

const apiFetchMembers = (projectId) =>
  axios
    .get(`/projects/${projectId}/members`, {
      params: {
        page: 0,
        size: 100,
      },
    })
    .then((res) => {
      const data = res.data;
      return Array.isArray(data) ? data : data.content || [];
    });

const apiFetchIssues = (projectId, params) =>
  axios.get(`/issues/project/${projectId}`, { params }).then((res) => res.data);

const apiCreateIssue = (payload) =>
  axios.post("/issues", payload).then((res) => res.data);

const apiAssignIssue = (id, assigneeId) =>
  axios.post(`/issues/${id}/assign`, { assigneeId }).then((res) => res.data);

const apiUpdateStatus = (id, status) =>
  axios.patch(`/issues/${id}/status`, { status }).then((res) => res.data);

const apiUpdateSeverity = (id, severity) =>
  axios.patch(`/issues/${id}/severity`, { severity }).then((res) => res.data);

const apiFetchComments = (id) =>
  axios.get(`/issues/${id}/comments`).then((res) => res.data);

const apiAddComment = (id, content) =>
  axios.post(`/issues/${id}/comments`, { content }).then((res) => res.data);

const apiFetchIssueStats = (projectId) =>
  axios.get(`/issues/project/${projectId}/stats`).then((res) => res.data);

const SEVERITY_LABEL = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Nghiêm trọng",
};

const SEVERITY_BADGE = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-500/20",
  MEDIUM: "bg-amber-100 text-amber-700 ring-amber-500/20",
  HIGH: "bg-orange-100 text-orange-700 ring-orange-500/20",
  CRITICAL: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const STATUS_LABEL = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  FIXED: "Đã sửa",
  CLOSED: "Đã đóng",
  REJECTED: "Từ chối",
};

const STATUS_BADGE = {
  NEW: "bg-slate-100 text-slate-700 ring-slate-500/20",
  IN_PROGRESS: "bg-blue-100 text-blue-700 ring-blue-500/20",
  FIXED: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
  CLOSED: "bg-slate-200 text-slate-600 ring-slate-500/20",
  REJECTED: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  severity: "MEDIUM",
};

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
}

function getIssueImages(issue) {
  if (!issue) return [];

  if (Array.isArray(issue.images)) {
    return issue.images;
  }

  if (Array.isArray(issue.attachments)) {
    return issue.attachments;
  }

  if (Array.isArray(issue.imageUrls)) {
    return issue.imageUrls;
  }

  return [];
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getPageData(data) {
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      number: 0,
      size: PAGE_SIZE,
    };
  }

  return {
    content: data?.content || [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    number: data?.number ?? 0,
    size: data?.size ?? PAGE_SIZE,
  };
}

export default function Issues() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState(null);

  const [activeIssue, setActiveIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    inProgress: 0,
    critical: 0,
  });

  useEffect(() => {
    apiFetchProjects()
      .then((data) => {
        setProjects(data || []);

        if (data?.length > 0) {
          setProjectId(String(data[0].id));
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Không tải được danh sách dự án"
        );
      });
  }, []);

  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      return;
    }

    setAssigneeFilter("");

    apiFetchMembers(projectId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [projectId]);

  const loadIssues = useCallback(() => {
    if (!projectId) return;

    setLoading(true);
    setError("");

    Promise.all([
      apiFetchIssues(projectId, {
        page,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        assigneeId: assigneeFilter || undefined,
        sortBy,
        direction,
      }),
      apiFetchIssueStats(projectId),
    ])
      .then(([issueData, statsData]) => {
        const pageData = getPageData(issueData);

        setIssues(pageData.content);
        setTotalElements(pageData.totalElements);
        setTotalPages(pageData.totalPages);

        setStats(statsData);

        if (pageData.number !== page) {
          setPage(pageData.number);
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Không tải được dữ liệu Issue"
        );
        setIssues([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    projectId,
    page,
    keyword,
    statusFilter,
    severityFilter,
    assigneeFilter,
    sortBy,
    direction,
  ]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const resetFilters = () => {
    setSearchInput("");
    setKeyword("");
    setStatusFilter("");
    setSeverityFilter("");
    setAssigneeFilter("");
    setSortBy("createdAt");
    setDirection("desc");
    setPage(0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const refresh = () => {
    loadIssues();
  };

  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    setPage(0);
    setKeyword("");
    setSearchInput("");
    setStatusFilter("");
    setSeverityFilter("");
    setAssigneeFilter("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!projectId) return;

    setSaving(true);
    setError("");

    try {
      await apiCreateIssue({
        ...form,
        projectId: Number(projectId),
      });

      setShowForm(false);
      setForm(EMPTY_FORM);
      setPage(0);
      loadIssues();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra, vui lòng thử lại"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (issue, assigneeId) => {
    try {
      await apiAssignIssue(issue.id, assigneeId ? Number(assigneeId) : null);

      loadIssues();

      if (selectedIssue?.id === issue.id) {
        setSelectedIssue({
          ...selectedIssue,
          assigneeId: assigneeId ? Number(assigneeId) : null,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Không phân công được"
      );
    }
  };

  const handleStatusChange = async (issue, status) => {
    try {
      await apiUpdateStatus(issue.id, status);
      loadIssues();

      if (selectedIssue?.id === issue.id) {
        setSelectedIssue({
          ...selectedIssue,
          status,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không cập nhật được trạng thái"
      );
    }
  };

  const handleSeverityChange = async (issue, severity) => {
    try {
      await apiUpdateSeverity(issue.id, severity);
      loadIssues();

      if (selectedIssue?.id === issue.id) {
        setSelectedIssue({
          ...selectedIssue,
          severity,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không cập nhật được mức độ"
      );
    }
  };

  const openComments = async (issue) => {
    setActiveIssue(issue);
    setNewComment("");
    setComments([]);
    setCommentLoading(true);

    try {
      const data = await apiFetchComments(issue.id);
      setComments(data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Không tải được bình luận"
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();

    if (!activeIssue || !newComment.trim()) return;

    setCommentLoading(true);

    try {
      await apiAddComment(activeIssue.id, newComment.trim());

      setNewComment("");

      const data = await apiFetchComments(activeIssue.id);
      setComments(data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Không thể gửi bình luận"
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const getIssueAssigneeName = (issue) => {
    if (!issue.assigneeId) return "Chưa phân công";

    const member = members.find(
      (m) => Number(m.userId) === Number(issue.assigneeId)
    );

    return member?.userFullName || issue.assigneeName || "Người dùng";
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Bug className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Quản lý vấn đề / lỗi
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Theo dõi, phân loại, phân công và xử lý Issue/Bug trong dự án
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setShowForm(true);
            setError("");
          }}
          disabled={!projectId}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Báo cáo lỗi mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Bug className="h-5 w-5" />}
          title="Tổng Issue"
          value={stats.total}
          description="Theo bộ lọc hiện tại"
        />

        <StatCard
          icon={<CircleDot className="h-5 w-5" />}
          title="Issue mới"
          value={stats.newCount}
          description="Đang chờ xử lý"
        />

        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          title="Đang xử lý"
          value={stats.inProgress}
          description="Đang được phân công"
        />

        <StatCard
          icon={<AlertOctagon className="h-5 w-5" />}
          title="Nghiêm trọng"
          value={stats.critical}
          description="Severity Critical"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />

          <h2 className="text-sm font-semibold text-slate-800">
            Bộ lọc và tìm kiếm
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Dự án
            </label>

            <select
              value={projectId}
              onChange={handleProjectChange}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearch} className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Tìm kiếm
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tiêu đề hoặc mô tả..."
                className="h-10 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />
            </div>
          </form>

          <FilterSelect
            label="Trạng thái"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(0);
            }}
            options={STATUS_LABEL}
          />

          <FilterSelect
            label="Mức độ"
            value={severityFilter}
            onChange={(value) => {
              setSeverityFilter(value);
              setPage(0);
            }}
            options={SEVERITY_LABEL}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-6">
          <FilterSelect
            label="Người xử lý"
            value={assigneeFilter}
            onChange={(value) => {
              setAssigneeFilter(value);
              setPage(0);
            }}
            options={Object.fromEntries(
              members.map((member) => [
                String(member.userId),
                member.userFullName,
              ])
            )}
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Sắp xếp theo
            </label>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
            >
              <option value="createdAt">Ngày tạo</option>
              <option value="updatedAt">Ngày cập nhật</option>
              <option value="title">Tiêu đề</option>
              <option value="severity">Mức độ</option>
              <option value="status">Trạng thái</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Thứ tự
            </label>

            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value);
                setPage(0);
              }}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
          </div>

          <div className="flex items-end lg:col-span-2">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-500/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-900">
              Danh sách vấn đề / lỗi
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {totalElements} Issue
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-sm">Đang tải danh sách...</span>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center text-slate-400">
            <Bug className="mb-3 h-12 w-12" />

            <p className="font-medium text-slate-600">Không tìm thấy Issue</p>

            <p className="mt-1 text-sm">
              Thử thay đổi bộ lọc hoặc tạo một Issue mới.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3">#</th>
                    <th className="min-w-[280px] px-4 py-3">Vấn đề / lỗi</th>
                    <th className="px-4 py-3">Mức độ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Người xử lý</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {issues.map((issue, index) => (
                    <tr
                      key={issue.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {page * PAGE_SIZE + index + 1}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="max-w-[350px] text-left"
                        >
                          <p className="truncate font-semibold text-slate-900 hover:text-navy-600">
                            {issue.title}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {issue.description || "Không có mô tả"}
                          </p>
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={issue.severity}
                          onChange={(e) =>
                            handleSeverityChange(issue, e.target.value)
                          }
                          className={`rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset focus:outline-none ${
                            SEVERITY_BADGE[issue.severity]
                          }`}
                        >
                          {Object.entries(SEVERITY_LABEL).map(
                            ([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={issue.status}
                          onChange={(e) =>
                            handleStatusChange(issue, e.target.value)
                          }
                          className={`rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset focus:outline-none ${
                            STATUS_BADGE[issue.status]
                          }`}
                        >
                          {Object.entries(STATUS_LABEL).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={issue.assigneeId || ""}
                          onChange={(e) => handleAssign(issue, e.target.value)}
                          className="max-w-[180px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                        >
                          <option value="">Chưa phân công</option>

                          {members.map((member) => (
                            <option key={member.userId} value={member.userId}>
                              {member.userFullName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                        {formatDate(issue.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelectedIssue(issue)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy-600"
                            title="Xem chi tiết"
                          >
                            <Bug className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openComments(issue)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy-600"
                            title="Bình luận"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Trang{" "}
                  <span className="font-semibold text-slate-700">
                    {page + 1}
                  </span>{" "}
                  / {totalPages}
                  {" · "}
                  {totalElements} kết quả
                </p>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() =>
                      setPage((current) => Math.max(0, current - 1))
                    }
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, index) => {
                      let pageNumber;

                      if (totalPages <= 5) {
                        pageNumber = index;
                      } else if (page <= 2) {
                        pageNumber = index;
                      } else if (page >= totalPages - 3) {
                        pageNumber = totalPages - 5 + index;
                      } else {
                        pageNumber = page - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                          className={`min-w-9 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                            page === pageNumber
                              ? "bg-navy-600 text-white"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {pageNumber + 1}
                        </button>
                      );
                    }
                  )}

                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages - 1, current + 1)
                      )
                    }
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <Modal title="Báo cáo lỗi mới" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tiêu đề
              </label>

              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder="VD: Trang đăng nhập bị lỗi 500"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mô tả chi tiết
              </label>

              <textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Mô tả bước tái hiện lỗi, môi trường, kết quả thực tế và ảnh hưởng..."
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mức độ nghiêm trọng
              </label>

              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    severity: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              >
                {Object.entries(SEVERITY_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Gửi báo cáo
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedIssue && (
        <Modal
          title="Chi tiết vấn đề / lỗi"
          onClose={() => setSelectedIssue(null)}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                    SEVERITY_BADGE[selectedIssue.severity]
                  }`}
                >
                  {SEVERITY_LABEL[selectedIssue.severity]}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                    STATUS_BADGE[selectedIssue.status]
                  }`}
                >
                  {STATUS_LABEL[selectedIssue.status]}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-bold text-slate-900">
                {selectedIssue.title}
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {selectedIssue.description || "Không có mô tả"}
              </p>

              {getIssueImages(selectedIssue).length > 0 && (
                <div>
                  <div className="mb-2 mt-4 flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-slate-500" />

                    <p className="text-sm font-semibold text-slate-700">
                      Ảnh minh chứng
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {getIssueImages(selectedIssue).map((image, index) => {
                      const imageUrl =
                        typeof image === "string"
                          ? image
                          : image.url || image.imageUrl || image.fileUrl;

                      if (!imageUrl) return null;

                      return (
                        <a
                          key={`${imageUrl}-${index}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={imageUrl}
                            alt={`Ảnh lỗi ${index + 1}`}
                            className="h-36 w-full object-cover transition group-hover:scale-105"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoItem
                icon={<UserCircle2 className="h-4 w-4" />}
                label="Người báo cáo"
                value={
                  selectedIssue.reporterName ||
                  selectedIssue.reportedByName ||
                  "Không xác định"
                }
              />

              <InfoItem
                icon={<UserRound className="h-4 w-4" />}
                label="Người xử lý"
                value={getIssueAssigneeName(selectedIssue)}
              />

              <InfoItem
                icon={<CalendarDays className="h-4 w-4" />}
                label="Ngày tạo"
                value={formatDateTime(selectedIssue.createdAt)}
              />

              <InfoItem
                icon={<RefreshCw className="h-4 w-4" />}
                label="Cập nhật"
                value={formatDateTime(selectedIssue.updatedAt)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Mức độ
                </label>

                <select
                  value={selectedIssue.severity}
                  onChange={(e) =>
                    handleSeverityChange(selectedIssue, e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                >
                  {Object.entries(SEVERITY_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Trạng thái
                </label>

                <select
                  value={selectedIssue.status}
                  onChange={(e) =>
                    handleStatusChange(selectedIssue, e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                >
                  {Object.entries(STATUS_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Phân công
                </label>

                <select
                  value={selectedIssue.assigneeId || ""}
                  onChange={(e) => handleAssign(selectedIssue, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                >
                  <option value="">Chưa phân công</option>

                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userFullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => openComments(selectedIssue)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                <MessageSquare className="h-4 w-4" />
                Xem bình luận
              </button>
            </div>
          </div>
        </Modal>
      )}

      {activeIssue && (
        <Modal
          title={activeIssue.title}
          onClose={() => setActiveIssue(null)}
          maxWidth="max-w-lg"
        >
          <div className="flex max-h-[65vh] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {commentLoading && comments.length === 0 ? (
                <div className="flex justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="py-10 text-center">
                  <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />

                  <p className="text-sm font-medium text-slate-600">
                    Chưa có bình luận
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Hãy thêm bình luận để trao đổi về Issue.
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <UserCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-slate-300" />

                    <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">
                          {comment.authorName}
                        </p>

                        {comment.createdAt && (
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-700">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={submitComment}
              className="mt-4 flex gap-2 border-t border-slate-100 pt-4"
            >
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />

              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60"
              >
                {commentLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Gửi
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, description }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">{title}</p>

      <p className="mt-0.5 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
      >
        <option value="">Tất cả</option>

        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>

      <p className="mt-1.5 truncate text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Modal({ title, children, onClose, maxWidth = "max-w-md" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="min-w-0 truncate text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
