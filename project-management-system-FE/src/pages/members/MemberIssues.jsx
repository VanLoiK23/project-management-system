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
  Trash2,
  Eye,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const PAGE_SIZE = 10;

const STATUS = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  FIXED: "FIXED",
  CLOSED: "CLOSED",
  REJECTED: "REJECTED",
};

const SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

const STATUS_LABEL = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  FIXED: "Đã sửa",
  CLOSED: "Đã đóng",
  REJECTED: "Từ chối",
};

const SEVERITY_LABEL = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Nghiêm trọng",
};

const STATUS_BADGE = {
  NEW: "bg-slate-100 text-slate-700 ring-slate-500/20",
  IN_PROGRESS: "bg-blue-100 text-blue-700 ring-blue-500/20",
  FIXED: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
  CLOSED: "bg-slate-200 text-slate-600 ring-slate-500/20",
  REJECTED: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const SEVERITY_BADGE = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-500/20",
  MEDIUM: "bg-amber-100 text-amber-700 ring-amber-500/20",
  HIGH: "bg-orange-100 text-orange-700 ring-orange-500/20",
  CRITICAL: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const SORT_DIRECTION_LABELS = {
  createdAt: {
    asc: "Cũ nhất",
    desc: "Mới nhất",
  },
  updatedAt: {
    asc: "Cập nhật cũ nhất",
    desc: "Cập nhật mới nhất",
  },
  title: {
    asc: "A → Z",
    desc: "Z → A",
  },
  severity: {
    asc: "Thấp → Cao",
    desc: "Cao → Thấp",
  },
  status: {
    asc: "A → Z",
    desc: "Z → A",
  },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  severity: SEVERITY.MEDIUM,
};

const MEMBER_STATUS_OPTIONS = [
  {
    value: STATUS.IN_PROGRESS,
    label: STATUS_LABEL.IN_PROGRESS,
  },
  {
    value: STATUS.FIXED,
    label: STATUS_LABEL.FIXED,
  },
];

const apiFetchProjects = () => axios.get("/projects").then((res) => res.data);

const apiFetchIssues = (projectId, params = {}) =>
  axios
    .get(`/issues/member/project/${projectId}`, { params })
    .then((res) => res.data);

const apiCreateIssue = (formData) =>
  axios.post("/issues/member", formData).then((res) => res.data);

const apiUpdateStatus = (issueId, status) =>
  axios
    .put(`/issues/member/${issueId}/status`, { status })
    .then((res) => res.data);

const apiFetchComments = (issueId) =>
  axios.get(`/issues/${issueId}/comments`).then((res) => res.data);

const apiAddComment = (issueId, content) =>
  axios
    .post(`/issues/${issueId}/comments`, { content })
    .then((res) => res.data);

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
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
    content: Array.isArray(data?.content) ? data.content : [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    number: data?.number ?? 0,
    size: data?.size ?? PAGE_SIZE,
  };
}

function getStats(data) {
  return {
    total: data?.total ?? 0,
    newCount: data?.newCount ?? data?.new ?? 0,
    inProgress: data?.inProgress ?? 0,
    fixed: data?.fixed ?? 0,
    critical: data?.critical ?? 0,
  };
}

export default function MemberIssues() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  const [issues, setIssues] = useState([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("desc");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const [activeIssue, setActiveIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    inProgress: 0,
    fixed: 0,
    critical: 0,
  });

  useEffect(() => {
    let mounted = true;

    apiFetchProjects()
      .then((data) => {
        if (!mounted) return;

        const projectList = Array.isArray(data) ? data : [];

        setProjects(projectList);

        if (projectList.length > 0) {
          setProjectId(String(projectList[0].id));
        }
      })
      .catch((err) => {
        if (!mounted) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Không tải được danh sách dự án"
        );
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadIssues = useCallback(
    async (isRefresh = false, targetPage = page) => {
      if (!projectId) {
        setIssues([]);
        setStats({
          total: 0,
          newCount: 0,
          inProgress: 0,
          fixed: 0,
          critical: 0,
        });
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [issueData] = await Promise.all([
          apiFetchIssues(projectId, {
            page: targetPage,
            size: PAGE_SIZE,
            keyword: keyword.trim(),
            status: statusFilter,
            severity: severityFilter,
            sortBy,
            direction,
          }),
          //   apiFetchIssueStats(projectId),
        ]);

        const pageData = getPageData(issueData);

        setIssues(pageData.content);
        setTotalElements(pageData.totalElements);
        setTotalPages(pageData.totalPages);
        setStats(getStats(issueData.statistics));

        if (pageData.number !== targetPage) {
          setPage(pageData.number);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Không tải được danh sách vấn đề"
        );

        setIssues([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, page, keyword, statusFilter, severityFilter, sortBy, direction]
  );

  useEffect(() => {
    loadIssues(false, page);
  }, [loadIssues, page]);

  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    setPage(0);
    setKeyword("");
    setSearchInput("");
    setStatusFilter("");
    setSeverityFilter("");
  };

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(0);
    setKeyword(searchInput.trim());
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handleSeverityFilter = (value) => {
    setSeverityFilter(value);
    setPage(0);
  };

  const resetFilters = () => {
    setSearchInput("");
    setKeyword("");
    setStatusFilter("");
    setSeverityFilter("");
    setSortBy("createdAt");
    setDirection("desc");
    setPage(0);
  };

  const refresh = () => {
    loadIssues(true, page);
  };

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setImages([]);
    setError("");
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }

      return file.size <= 5 * 1024 * 1024;
    });

    setImages((current) => [...current, ...validFiles]);

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!projectId) {
      setError("Vui lòng chọn dự án");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      setError("Tiêu đề không được để trống");
      return;
    }

    if (!description) {
      setError("Mô tả không được để trống");
      return;
    }

    if (title.length > 200) {
      setError("Tiêu đề không được vượt quá 200 ký tự");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("projectId", Number(projectId));
      formData.append("title", title);
      formData.append("description", description);
      formData.append("severity", form.severity);

      images.forEach((image) => {
        formData.append("images", image);
      });

      await apiCreateIssue(formData);

      setShowForm(false);
      setForm(EMPTY_FORM);
      setImages([]);
      setPage(0);

      await loadIssues(true, 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tạo báo cáo lỗi"
      );
    } finally {
      setSaving(false);
    }
  };

  const canUpdateStatus = (issue) => {
    if (!issue) return false;

    return issue.status === STATUS.NEW || issue.status === STATUS.IN_PROGRESS;
  };

  const handleStatusChange = async (issue, status) => {
    if (!canUpdateStatus(issue)) {
      return;
    }

    setStatusSaving(true);
    setError("");

    try {
      const response = await apiUpdateStatus(issue.id, status);

      const updatedIssue = response?.data || response;

      setSelectedIssue((current) => {
        if (!current || current.id !== issue.id) {
          return current;
        }

        return {
          ...current,
          ...(updatedIssue || {}),
          status,
        };
      });

      await loadIssues(true, page);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể cập nhật trạng thái"
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const openComments = async (issue) => {
    setActiveIssue(issue);
    setNewComment("");
    setComments([]);
    setCommentLoading(true);
    setError("");

    try {
      const data = await apiFetchComments(issue.id);

      setComments(Array.isArray(data) ? data : data?.data || []);
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

    const content = newComment.trim();

    if (!activeIssue || !content) {
      return;
    }

    setCommentLoading(true);
    setError("");

    try {
      await apiAddComment(activeIssue.id, content);

      setNewComment("");

      const data = await apiFetchComments(activeIssue.id);

      setComments(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Không thể gửi bình luận"
      );
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Bug className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Báo cáo vấn đề
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Báo cáo lỗi, theo dõi và cập nhật các vấn đề bạn phụ trách
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateForm}
          disabled={!projectId}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Báo cáo lỗi mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={<Bug className="h-5 w-5" />}
          title="Tổng Issue"
          value={stats.total}
          description="Issue liên quan đến bạn"
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
          description="Bạn đang phụ trách"
        />

        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Đã sửa"
          value={stats.fixed}
          description="Đã hoàn thành xử lý"
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
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />
            </div>
          </form>

          <FilterSelect
            label="Trạng thái"
            value={statusFilter}
            onChange={handleStatusFilter}
            options={STATUS_LABEL}
          />

          <FilterSelect
            label="Mức độ"
            value={severityFilter}
            onChange={handleSeverityFilter}
            options={SEVERITY_LABEL}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-6">
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
              {/* <option value="status">Trạng thái</option> */}
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
              <option value="asc">{SORT_DIRECTION_LABELS[sortBy]?.asc}</option>
              <option value="desc">
                {SORT_DIRECTION_LABELS[sortBy]?.desc}
              </option>
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
            <h2 className="font-semibold text-slate-900">Issue của tôi</h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {totalElements} Issue
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading || refreshing}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading || refreshing ? "animate-spin" : ""
              }`}
            />
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
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
              <Bug className="h-8 w-8" />
            </div>

            <p className="mt-4 font-medium text-slate-600">Chưa có Issue</p>

            <p className="mt-1 text-sm text-slate-400">
              Không tìm thấy vấn đề phù hợp với bộ lọc hiện tại.
            </p>

            <button
              onClick={openCreateForm}
              disabled={!projectId}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Báo cáo lỗi
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3">#</th>
                    <th className="min-w-[320px] px-4 py-3">Vấn đề / lỗi</th>
                    <th className="px-4 py-3">Mức độ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Người báo cáo</th>
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
                          className="max-w-[380px] text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-slate-900 hover:text-navy-600">
                              {issue.title}
                            </p>

                            {getIssueImages(issue).length > 0 && (
                              <ImagePlus className="h-4 w-4 shrink-0 text-slate-400" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {issue.description || "Không có mô tả"}
                          </p>
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                            SEVERITY_BADGE[issue.severity] ||
                            SEVERITY_BADGE.MEDIUM
                          }`}
                        >
                          {SEVERITY_LABEL[issue.severity] ||
                            issue.severity ||
                            "Trung bình"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                            STATUS_BADGE[issue.status] || STATUS_BADGE.NEW
                          }`}
                        >
                          {STATUS_LABEL[issue.status] || issue.status || "Mới"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <UserCircle2 className="h-5 w-5 text-slate-300" />

                          <span className="max-w-[150px] truncate text-xs font-medium text-slate-600">
                            {issue.reporterName ||
                              issue.reportedByName ||
                              "Bạn"}
                          </span>
                        </div>
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
                            <Eye className="h-4 w-4" />
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
              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {showForm && (
        <Modal
          title="Báo cáo lỗi mới"
          onClose={() => !saving && setShowForm(false)}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Dự án
              </label>

              <select
                value={projectId}
                onChange={handleProjectChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tiêu đề
              </label>

              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    title: e.target.value,
                  }))
                }
                placeholder="VD: Trang đăng nhập trả lỗi 500"
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />

              <p className="mt-1 text-right text-[11px] text-slate-400">
                {form.title.length}/200
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mô tả lỗi
              </label>

              <textarea
                required
                rows={6}
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
                placeholder="Mô tả bước tái hiện lỗi, kết quả thực tế, kết quả mong muốn và ảnh hưởng..."
                disabled={saving}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mức độ nghiêm trọng
              </label>

              <select
                value={form.severity}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    severity: e.target.value,
                  }))
                }
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              >
                {Object.entries(SEVERITY_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Ảnh minh chứng
                </label>

                <span className="text-xs text-slate-400">
                  PNG, JPG, WEBP · tối đa 5MB/ảnh
                </span>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-7 text-center transition hover:border-navy-400 hover:bg-slate-50">
                <ImagePlus className="h-8 w-8 text-slate-400" />

                <p className="mt-2 text-sm font-medium text-slate-700">
                  Chọn ảnh lỗi
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Có thể chọn nhiều ảnh
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleImageChange}
                  disabled={saving}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={image.name}
                        className="h-28 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={saving}
                        className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-rose-500 shadow-sm hover:bg-white"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <p className="truncate px-2 py-1.5 text-[11px] text-slate-500">
                        {image.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                    SEVERITY_BADGE[selectedIssue.severity] ||
                    SEVERITY_BADGE.MEDIUM
                  }`}
                >
                  {SEVERITY_LABEL[selectedIssue.severity] ||
                    selectedIssue.severity}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                    STATUS_BADGE[selectedIssue.status] || STATUS_BADGE.NEW
                  }`}
                >
                  {STATUS_LABEL[selectedIssue.status] || selectedIssue.status}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-bold text-slate-900">
                {selectedIssue.title}
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {selectedIssue.description || "Không có mô tả"}
              </p>
            </div>

            {getIssueImages(selectedIssue).length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
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
                value={
                  selectedIssue.assigneeName ||
                  selectedIssue.assignee?.fullName ||
                  "Chưa phân công"
                }
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

            {canUpdateStatus(selectedIssue) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Clock3 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-blue-900">
                      Cập nhật trạng thái xử lý
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Chỉ người được phân công xử lý Issue mới có thể cập nhật
                      trạng thái.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {MEMBER_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={statusSaving}
                          onClick={() =>
                            handleStatusChange(selectedIssue, option.value)
                          }
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            selectedIssue.status === option.value
                              ? "bg-navy-600 text-white"
                              : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {statusSaving &&
                          selectedIssue.status !== option.value ? (
                            option.label
                          ) : (
                            <>
                              {selectedIssue.status === option.value && (
                                <span className="mr-1.5">✓</span>
                              )}
                              {option.label}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => openComments(selectedIssue)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                <MessageSquare className="h-4 w-4" />
                Bình luận
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
                    Trao đổi thêm để hỗ trợ quá trình xử lý lỗi.
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <UserCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-slate-300" />

                    <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">
                          {comment.authorName ||
                            comment.userName ||
                            "Người dùng"}
                        </p>

                        {comment.createdAt && (
                          <span className="whitespace-nowrap text-[10px] text-slate-400">
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
                maxLength={2000}
                placeholder="Viết bình luận..."
                disabled={commentLoading}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />

              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
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

function Pagination({ page, totalPages, totalElements, onPageChange }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Trang <span className="font-semibold text-slate-700">{page + 1}</span> /{" "}
        {totalPages}
        {" · "}
        {totalElements} kết quả
      </p>

      <div className="flex items-center gap-1">
        <button
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
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
              onClick={() => onPageChange(pageNumber)}
              className={`min-w-9 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                page === pageNumber
                  ? "bg-navy-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {pageNumber + 1}
            </button>
          );
        })}

        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
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
        className={`w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200`}
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

        <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
