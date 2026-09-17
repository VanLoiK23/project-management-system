import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Flag,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserCircle2,
  X,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING: "PENDING",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
};

const STATUS_LABEL = {
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  PENDING: "Tạm dừng",
  DONE: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const PRIORITY_LABEL = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

const STATUS_OPTIONS = [
  {
    value: "",
    label: "Tất cả trạng thái",
  },
  {
    value: STATUS.NOT_STARTED,
    label: STATUS_LABEL.NOT_STARTED,
  },
  {
    value: STATUS.IN_PROGRESS,
    label: STATUS_LABEL.IN_PROGRESS,
  },
  {
    value: STATUS.DONE,
    label: STATUS_LABEL.DONE,
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "",
    label: "Tất cả ưu tiên",
  },
  { value: "LOW", label: PRIORITY_LABEL.LOW },
  { value: "MEDIUM", label: PRIORITY_LABEL.MEDIUM },
  { value: "HIGH", label: PRIORITY_LABEL.HIGH },
  { value: "URGENT", label: PRIORITY_LABEL.URGENT },
];

const apiFetchMyTasks = (params = {}) =>
  axios.get("/member/tasks", { params }).then((res) => res.data);

const apiFetchTask = (taskId) =>
  axios.get(`/tasks/${taskId}`).then((res) => res.data);

const apiUpdateTaskProgress = (taskId, payload) =>
  axios.put(`/tasks/${taskId}/progress`, payload).then((res) => res.data);

const apiFetchTaskComments = (taskId) =>
  axios.get(`/tasks/${taskId}/comments`).then((res) => res.data);

const apiAddTaskComment = (taskId, content) =>
  axios.post(`/tasks/${taskId}/comments`, { content }).then((res) => res.data);

function getTasksFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getCommentsFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getTaskId(task) {
  return task?.id ?? task?.taskId;
}

function getTaskName(task) {
  return task?.name ?? task?.title ?? "Công việc chưa có tên";
}

function getProjectName(task) {
  return (
    task?.projectName ??
    task?.project?.name ??
    task?.project?.title ??
    "Không xác định"
  );
}

function getStatus(task) {
  return task?.status ?? STATUS.NOT_STARTED;
}

function getProgress(task) {
  const value =
    task?.progressPercent ?? task?.progress ?? task?.completionPercent ?? 0;

  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
}

function getPriority(task) {
  return task?.priority ?? "MEDIUM";
}

function getDeadline(task) {
  return task?.deadline ?? null;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDeadlineState(deadline, status) {
  if (!deadline || status === STATUS.DONE || status === STATUS.CANCELLED) {
    return "normal";
  }

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return "normal";
  }

  const now = new Date();

  if (date < now) {
    return "overdue";
  }

  const diff = date.getTime() - now.getTime();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  if (diff <= threeDays) {
    return "soon";
  }

  return "normal";
}

function getStatusClass(status) {
  switch (status) {
    case STATUS.IN_PROGRESS:
      return "status-progress";

    case STATUS.DONE:
      return "status-done";

    case STATUS.PENDING:
      return "status-pending";

    case STATUS.CANCELLED:
      return "status-cancelled";

    default:
      return "status-not-started";
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case "URGENT":
      return "priority-urgent";

    case "HIGH":
      return "priority-high";

    case "LOW":
      return "priority-low";

    default:
      return "priority-medium";
  }
}

function getCommentUserName(comment) {
  return (
    comment?.userName ??
    comment?.createdByName ??
    comment?.user?.fullName ??
    comment?.user?.name ??
    "Người dùng"
  );
}

function getCommentContent(comment) {
  return comment?.content ?? comment?.message ?? "";
}

function getCommentDate(comment) {
  return comment?.createdAt ?? comment?.createdDate ?? comment?.updatedAt;
}

function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`member-toast ${toast.type}`}>
      {toast.type === "success" ? (
        <CheckCircle2 size={19} />
      ) : (
        <AlertCircle size={19} />
      )}

      <span>{toast.message}</span>

      <button onClick={onClose}>
        <X size={17} />
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, active, onClick }) {
  return (
    <button
      type="button"
      className={`member-stat-card ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="member-stat-icon">{icon}</div>

      <div className="member-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </button>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="member-progress-wrapper">
      <div className="member-progress-track">
        <div
          className="member-progress-value"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span>{progress}%</span>
    </div>
  );
}

function TaskRow({ task, onClick }) {
  const taskId = getTaskId(task);
  const name = getTaskName(task);
  const projectName = getProjectName(task);
  const status = getStatus(task);
  const progress = getProgress(task);
  const priority = getPriority(task);
  const deadline = getDeadline(task);
  const deadlineState = getDeadlineState(deadline, status);

  return (
    <button
      type="button"
      className="member-task-row"
      onClick={() => onClick(taskId)}
    >
      <div className="member-task-main">
        <div className="member-task-title-line">
          <FileText size={18} />

          <span className="member-task-title">{name}</span>
        </div>

        <div className="member-task-project">
          <span>{projectName}</span>
        </div>
      </div>

      <div className="member-task-status">
        <span className={`member-status ${getStatusClass(status)}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      <div className="member-task-priority">
        <span className={`member-priority ${getPriorityClass(priority)}`}>
          <Flag size={14} />
          {PRIORITY_LABEL[priority] ?? priority}
        </span>
      </div>

      <div className={`member-task-deadline ${deadlineState}`}>
        <CalendarDays size={15} />
        <span>{formatDate(deadline)}</span>
      </div>

      <div className="member-task-progress">
        <ProgressBar progress={progress} />
      </div>

      <div className="member-task-arrow">
        <ChevronDown size={18} />
      </div>
    </button>
  );
}

function EmptyState({ hasFilter, onClear }) {
  return (
    <div className="member-empty-state">
      <div className="member-empty-icon">
        <CheckCircle2 size={38} />
      </div>

      <h3>
        {hasFilter
          ? "Không tìm thấy công việc phù hợp"
          : "Bạn chưa có công việc nào"}
      </h3>

      <p>
        {hasFilter
          ? "Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc."
          : "Các công việc được giao cho bạn sẽ xuất hiện tại đây."}
      </p>

      {hasFilter && (
        <button type="button" onClick={onClear}>
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}

function TaskDetailModal({ task, onClose, onUpdated, showToast }) {
  const taskId = getTaskId(task);

  const [detail, setDetail] = useState(task);
  const [status, setStatus] = useState(getStatus(task));
  const [progress, setProgress] = useState(getProgress(task));
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!taskId) {
      return;
    }

    try {
      setLoadingDetail(true);

      const data = await apiFetchTask(taskId);

      if (data) {
        setDetail(data);
        setStatus(getStatus(data));
        setProgress(getProgress(data));
      }
    } catch (error) {
      console.error("GET TASK DETAIL ERROR:", error);
    } finally {
      setLoadingDetail(false);
    }
  }, [taskId]);

  const loadComments = useCallback(async () => {
    if (!taskId) {
      return;
    }

    try {
      setLoadingComments(true);

      const data = await apiFetchTaskComments(taskId);

      setComments(getCommentsFromResponse(data));
    } catch (error) {
      console.error("GET COMMENTS ERROR:", error);

      showToast(
        "error",
        error?.response?.data?.message || "Không thể tải danh sách bình luận"
      );
    } finally {
      setLoadingComments(false);
    }
  }, [taskId, showToast]);

  useEffect(() => {
    loadDetail();
    loadComments();
  }, [loadDetail, loadComments]);

  const currentStatus = getStatus(detail);
  const currentProgress = getProgress(detail);
  const deadline = getDeadline(detail);
  const priority = getPriority(detail);

  const projectName = getProjectName(detail);
  const taskName = getTaskName(detail);

  const description =
    detail?.description ??
    detail?.content ??
    "Không có mô tả cho công việc này.";

  const isFinished =
    currentStatus === STATUS.DONE || currentStatus === STATUS.CANCELLED;

  const handleStatusChange = (value) => {
    setStatus(value);

    if (value === STATUS.NOT_STARTED) {
      setProgress(0);
    }

    if (value === STATUS.DONE) {
      setProgress(100);
    }

    if (value === STATUS.IN_PROGRESS && (progress <= 0 || progress >= 100)) {
      setProgress(1);
    }
  };

  const handleProgressChange = (event) => {
    const value = Number(event.target.value);

    if (Number.isNaN(value)) {
      return;
    }

    const normalized = Math.min(100, Math.max(0, value));

    setProgress(normalized);

    if (normalized === 0) {
      setStatus(STATUS.NOT_STARTED);
    } else if (normalized === 100) {
      setStatus(STATUS.DONE);
    } else {
      setStatus(STATUS.IN_PROGRESS);
    }
  };

  const handleSaveProgress = async () => {
    if (!taskId || savingProgress || isFinished) {
      return;
    }

    if (status === STATUS.NOT_STARTED && progress !== 0) {
      showToast("error", "Công việc chưa bắt đầu phải có tiến độ 0%.");
      return;
    }

    if (status === STATUS.IN_PROGRESS) {
      if (progress <= 0 || progress >= 100) {
        showToast(
          "error",
          "Công việc đang thực hiện phải có tiến độ từ 1% đến 99%."
        );
        return;
      }
    }

    if (status === STATUS.DONE && progress !== 100) {
      showToast("error", "Công việc hoàn thành phải có tiến độ 100%.");
      return;
    }

    try {
      setSavingProgress(true);

      const updated = await apiUpdateTaskProgress(taskId, {
        progressPercent: progress,
      });

      setDetail(updated ?? { ...detail, status, progressPercent: progress });

      showToast("success", "Đã cập nhật tiến độ công việc.");

      if (onUpdated) {
        onUpdated(updated ?? { ...detail, status, progressPercent: progress });
      }
    } catch (error) {
      console.error("UPDATE TASK PROGRESS ERROR:", error);

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể cập nhật tiến độ công việc."
      );
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSendComment = async (event) => {
    event.preventDefault();

    const content = comment.trim();

    if (!content || sendingComment) {
      return;
    }

    try {
      setSendingComment(true);

      const createdComment = await apiAddTaskComment(taskId, content);

      if (createdComment) {
        setComments((prev) => [...prev, createdComment.data]);
      } else {
        await loadComments();
      }

      setComment("");

      showToast("success", "Đã thêm bình luận.");
    } catch (error) {
      console.error("ADD COMMENT ERROR:", error);

      showToast(
        "error",
        error?.response?.data?.message || "Không thể thêm bình luận."
      );
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="member-modal-backdrop" onMouseDown={onClose}>
      <div
        className="member-task-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="member-modal-header">
          <div>
            <span className="member-modal-eyebrow">CHI TIẾT CÔNG VIỆC</span>

            <h2>{taskName}</h2>

            <div className="member-modal-project">
              <FileText size={15} />
              {projectName}
            </div>
          </div>

          <button
            type="button"
            className="member-modal-close"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <div className="member-modal-body">
          {loadingDetail ? (
            <div className="member-detail-loading">
              <Loader2 size={24} className="spin" />
              Đang tải thông tin...
            </div>
          ) : (
            <>
              <div className="member-detail-grid">
                <div className="member-detail-item">
                  <span>Trạng thái</span>

                  <span
                    className={`member-status ${getStatusClass(currentStatus)}`}
                  >
                    {STATUS_LABEL[currentStatus] ?? currentStatus}
                  </span>
                </div>

                <div className="member-detail-item">
                  <span>Ưu tiên</span>

                  <span
                    className={`member-priority ${getPriorityClass(priority)}`}
                  >
                    <Flag size={14} />
                    {PRIORITY_LABEL[priority] ?? priority}
                  </span>
                </div>

                <div className="member-detail-item">
                  <span>Deadline</span>

                  <span
                    className={`member-detail-deadline ${getDeadlineState(
                      deadline,
                      currentStatus
                    )}`}
                  >
                    <CalendarDays size={15} />
                    {formatDate(deadline)}
                  </span>
                </div>

                <div className="member-detail-item">
                  <span>Tiến độ hiện tại</span>

                  <strong>{currentProgress}%</strong>
                </div>
              </div>

              <section className="member-detail-section">
                <div className="member-section-title">
                  <FileText size={18} />
                  <h3>Mô tả công việc</h3>
                </div>

                <div className="member-description">{description}</div>
              </section>

              <section className="member-detail-section member-update-section">
                <div className="member-section-title">
                  <Clock3 size={18} />
                  <h3>Cập nhật tiến độ</h3>
                </div>

                {isFinished ? (
                  <div className="member-finished-notice">
                    <CheckCircle2 size={20} />

                    <div>
                      <strong>
                        {currentStatus === STATUS.DONE
                          ? "Công việc đã hoàn thành"
                          : "Công việc đã bị hủy"}
                      </strong>

                      <span>
                        Công việc này không còn cho phép cập nhật tiến độ.
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="member-update-grid">
                      <div className="member-form-group">
                        <label>Trạng thái</label>

                        <select
                          value={status}
                          onChange={(event) =>
                            handleStatusChange(event.target.value)
                          }
                        >
                          {STATUS_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="member-form-group">
                        <label>Hoàn thành</label>

                        <div className="member-percent-input">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleProgressChange}
                          />

                          <span>%</span>
                        </div>
                      </div>
                    </div>

                    <div className="member-large-progress">
                      <div className="member-large-progress-header">
                        <span>Tiến độ</span>
                        <strong>{progress}%</strong>
                      </div>

                      <input
                        className="member-range"
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleProgressChange}
                      />

                      <div className="member-range-labels">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="member-update-actions">
                      <button
                        type="button"
                        className="member-primary-button"
                        onClick={handleSaveProgress}
                        disabled={savingProgress}
                      >
                        {savingProgress ? (
                          <>
                            <Loader2 size={17} className="spin" />
                            Đang cập nhật...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={17} />
                            Cập nhật tiến độ
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </section>

              <section className="member-detail-section">
                <div className="member-section-title">
                  <MessageCircle size={18} />
                  <h3>Bình luận</h3>

                  <span className="member-comment-count">
                    {comments.length}
                  </span>
                </div>

                <div className="member-comments">
                  {loadingComments ? (
                    <div className="member-comments-loading">
                      <Loader2 size={20} className="spin" />
                      Đang tải bình luận...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="member-no-comments">
                      Chưa có bình luận nào. Hãy bắt đầu trao đổi về công việc
                      này.
                    </div>
                  ) : (
                    comments.map((item, index) => (
                      <div className="member-comment" key={item?.id ?? index}>
                        <div className="member-comment-avatar">
                          <UserCircle2 size={30} />
                        </div>

                        <div className="member-comment-content">
                          <div className="member-comment-top">
                            <strong>{getCommentUserName(item)}</strong>

                            <span>{formatDateTime(getCommentDate(item))}</span>
                          </div>

                          <p>{getCommentContent(item)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  className="member-comment-form"
                  onSubmit={handleSendComment}
                >
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Nhập ghi chú hoặc bình luận..."
                    rows={3}
                    maxLength={2000}
                  />

                  <div className="member-comment-form-bottom">
                    <span>{comment.length}/2000</span>

                    <button
                      type="submit"
                      className="member-primary-button"
                      disabled={!comment.trim() || sendingComment}
                    >
                      {sendingComment ? (
                        <>
                          <Loader2 size={17} className="spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send size={17} />
                          Gửi bình luận
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemberTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    done: 0,
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const loadTasks = useCallback(
    async (isRefresh = false, targetPage = 0) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await apiFetchMyTasks({
          page: targetPage,
          size,
          keyword: search.trim() || "",
          status: statusFilter,
          priority: priorityFilter,
          sortBy: "deadline",
          direction: "asc",
        });

        setTasks(getTasksFromResponse(data));

        setPage(data?.page ?? targetPage);
        setTotalPages(data?.totalPages ?? 0);
        setTotalElements(data?.totalElements ?? 0);

        setStats({
          total: data?.statistics?.total ?? 0,
          notStarted: data?.statistics?.notStarted ?? 0,
          inProgress: data?.statistics?.inProgress ?? 0,
          done: data?.statistics?.done ?? 0,
        });
      } catch (error) {
        console.error("GET MY TASKS ERROR:", error);

        showToast(
          "error",
          error?.response?.data?.message || "Không thể tải danh sách công việc."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [size, search, statusFilter, priorityFilter, showToast]
  );

  useEffect(() => {
    loadTasks(false, page);
  }, [page, loadTasks]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handlePriorityFilterChange = (value) => {
    setPriorityFilter(value);
    setPage(0);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages || newPage === page) {
      return;
    }

    setPage(newPage);
  };

  const hasFilter =
    search.trim() !== "" || statusFilter !== "" || priorityFilter !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setPage(0);
  };

  const handleTaskUpdated = (updatedTask) => {
    if (!updatedTask) {
      loadTasks(true);
      return;
    }

    const updatedId = getTaskId(updatedTask);

    setTasks((prev) =>
      prev.map((task) =>
        getTaskId(task) === updatedId ? { ...task, ...updatedTask } : task
      )
    );

    setSelectedTask((prev) =>
      prev && getTaskId(prev) === updatedId ? { ...prev, ...updatedTask } : prev
    );
  };

  return (
    <div className="member-tasks-page">
      <style>{`
        .member-tasks-page {
          min-height: 100%;
          padding: 28px 30px 40px;
          background: #f7f8fc;
          color: #172033;
        }

        .member-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .member-page-eyebrow {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: .08em;
          margin-bottom: 7px;
        }

        .member-page-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 750;
          letter-spacing: -.025em;
        }

        .member-page-subtitle {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .member-refresh-button {
          height: 40px;
          padding: 0 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #334155;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .member-refresh-button:hover {
          background: #f8fafc;
        }

        .member-refresh-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .member-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .member-stat-card {
          border: 1px solid #e6eaf0;
          background: #fff;
          border-radius: 12px;
          min-height: 88px;
          padding: 17px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          cursor: pointer;
          transition: .18s ease;
        }

        .member-stat-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .member-stat-card.active {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, .08);
        }

        .member-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #eff6ff;
          color: #2563eb;
          flex-shrink: 0;
        }

        .member-stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .member-stat-content span {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .member-stat-content strong {
          font-size: 23px;
          line-height: 1;
        }

        .member-filter-card {
          background: #fff;
          border: 1px solid #e6eaf0;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 18px;
          display: grid;
          grid-template-columns: minmax(220px, 1.8fr) repeat(3, minmax(150px, 1fr));
          gap: 10px;
        }

        .member-search-box {
          position: relative;
        }

        .member-search-box svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .member-search-box input,
        .member-filter-select {
          width: 100%;
          height: 40px;
          border: 1px solid #dfe5ec;
          border-radius: 8px;
          background: #fff;
          color: #1e293b;
          font-size: 13px;
          outline: none;
        }

        .member-search-box input {
          padding: 0 13px 0 38px;
        }

        .member-search-box input:focus,
        .member-filter-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .08);
        }

        .member-filter-select {
          padding: 0 11px;
        }

        .member-list-card {
          background: #fff;
          border: 1px solid #e6eaf0;
          border-radius: 12px;
          overflow: hidden;
        }

        .member-list-header {
          min-height: 55px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #edf0f4;
        }

        .member-list-header h2 {
          font-size: 15px;
          margin: 0;
          font-weight: 700;
        }

        .member-list-count {
          font-size: 12px;
          color: #64748b;
          background: #f1f5f9;
          border-radius: 999px;
          padding: 5px 9px;
          font-weight: 600;
        }

        .member-task-table-head {
          display: grid;
          grid-template-columns: minmax(260px, 2.4fr) 150px 145px 150px 190px 28px;
          gap: 12px;
          align-items: center;
          padding: 11px 18px;
          border-bottom: 1px solid #edf0f4;
          background: #fafbfc;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .member-task-row {
          width: 100%;
          border: 0;
          border-bottom: 1px solid #edf0f4;
          background: #fff;
          display: grid;
          grid-template-columns: minmax(260px, 2.4fr) 150px 145px 150px 190px 28px;
          gap: 12px;
          align-items: center;
          padding: 15px 18px;
          text-align: left;
          cursor: pointer;
          color: inherit;
          transition: background .15s ease;
        }

        .member-task-row:last-child {
          border-bottom: 0;
        }

        .member-task-row:hover {
          background: #f8fafc;
        }

        .member-task-title-line {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #334155;
        }

        .member-task-title-line svg {
          color: #64748b;
          flex-shrink: 0;
        }

        .member-task-title {
          font-size: 13px;
          font-weight: 650;
          color: #172033;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-task-project {
          margin: 5px 0 0 27px;
          color: #94a3b8;
          font-size: 11px;
        }

        .member-status,
        .member-priority {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          gap: 5px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
        }

        .status-not-started {
          color: #475569;
          background: #f1f5f9;
        }

        .status-progress {
          color: #1d4ed8;
          background: #eff6ff;
        }

        .status-pending {
          color: #a16207;
          background: #fefce8;
        }

        .status-done {
          color: #15803d;
          background: #f0fdf4;
        }

        .status-cancelled {
          color: #b91c1c;
          background: #fef2f2;
        }

        .priority-low {
          color: #475569;
          background: #f8fafc;
        }

        .priority-medium {
          color: #0369a1;
          background: #f0f9ff;
        }

        .priority-high {
          color: #c2410c;
          background: #fff7ed;
        }

        .priority-urgent {
          color: #b91c1c;
          background: #fef2f2;
        }

        .member-task-deadline {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-size: 12px;
        }

        .member-task-deadline.soon {
          color: #b45309;
          font-weight: 650;
        }

        .member-task-deadline.overdue {
          color: #dc2626;
          font-weight: 650;
        }

        .member-progress-wrapper {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .member-progress-track {
          flex: 1;
          height: 7px;
          border-radius: 999px;
          background: #e8edf3;
          overflow: hidden;
        }

        .member-progress-value {
          height: 100%;
          border-radius: inherit;
          background: #2563eb;
          transition: width .2s ease;
        }

        .member-progress-wrapper span {
          min-width: 34px;
          text-align: right;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
        }

        .member-task-arrow {
          color: #94a3b8;
          transform: rotate(-90deg);
        }

        .member-empty-state {
          padding: 70px 20px;
          text-align: center;
        }

        .member-empty-icon {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          margin: 0 auto 17px;
          display: grid;
          place-items: center;
          color: #2563eb;
          background: #eff6ff;
        }

        .member-empty-state h3 {
          margin: 0 0 7px;
          font-size: 16px;
        }

        .member-empty-state p {
          margin: 0 auto 17px;
          color: #64748b;
          font-size: 13px;
        }

        .member-empty-state button {
          border: 0;
          background: transparent;
          color: #2563eb;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
        }

        .member-loading {
          min-height: 350px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 13px;
        }

        .spin {
          animation: member-spin 1s linear infinite;
        }

        @keyframes member-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .member-toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 100;
          min-width: 290px;
          max-width: 430px;
          padding: 13px 14px;
          border-radius: 10px;
          background: #fff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 14px 35px rgba(15, 23, 42, .14);
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 600;
        }

        .member-toast.success {
          color: #166534;
        }

        .member-toast.error {
          color: #b91c1c;
        }

        .member-toast span {
          flex: 1;
        }

        .member-toast button {
          border: 0;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
        }

        .member-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
          background: rgba(15, 23, 42, .48);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 22px;
        }

        .member-task-modal {
          width: min(900px, 100%);
          max-height: calc(100vh - 44px);
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(15, 23, 42, .25);
          display: flex;
          flex-direction: column;
        }

        .member-modal-header {
          padding: 20px 22px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          justify-content: space-between;
          gap: 18px;
        }

        .member-modal-eyebrow {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .08em;
          margin-bottom: 5px;
        }

        .member-modal-header h2 {
          margin: 0;
          font-size: 21px;
          line-height: 1.3;
        }

        .member-modal-project {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 12px;
          margin-top: 7px;
        }

        .member-modal-close {
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .member-modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .member-modal-body {
          overflow-y: auto;
          padding: 22px;
        }

        .member-detail-loading,
        .member-comments-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 180px;
          color: #64748b;
          font-size: 13px;
        }

        .member-detail-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid #e7ebf0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 22px;
        }

        .member-detail-item {
          padding: 13px 15px;
          border-right: 1px solid #e7ebf0;
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .member-detail-item:last-child {
          border-right: 0;
        }

        .member-detail-item > span:first-child {
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
        }

        .member-detail-item strong {
          font-size: 14px;
        }

        .member-detail-deadline {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
        }

        .member-detail-deadline.soon {
          color: #b45309;
        }

        .member-detail-deadline.overdue {
          color: #dc2626;
        }

        .member-detail-section {
          padding-top: 3px;
          margin-bottom: 25px;
        }

        .member-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .member-section-title svg {
          color: #2563eb;
        }

        .member-section-title h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 750;
        }

        .member-comment-count {
          background: #eff6ff;
          color: #2563eb;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: 999px;
        }

        .member-description {
          background: #f8fafc;
          border: 1px solid #edf0f4;
          border-radius: 9px;
          padding: 14px;
          color: #475569;
          font-size: 13px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .member-update-section {
          background: #f8fafc;
          border: 1px solid #e8edf3;
          border-radius: 10px;
          padding: 17px;
        }

        .member-update-grid {
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 14px;
        }

        .member-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .member-form-group label {
          color: #475569;
          font-size: 12px;
          font-weight: 650;
        }

        .member-form-group select {
          height: 40px;
          padding: 0 11px;
          border: 1px solid #dfe5ec;
          border-radius: 8px;
          background: #fff;
          outline: none;
          font-size: 13px;
          color: #172033;
        }

        .member-form-group select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .08);
        }

        .member-percent-input {
          height: 40px;
          border: 1px solid #dfe5ec;
          background: #fff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .member-percent-input input {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          padding: 0 10px;
          font-size: 13px;
        }

        .member-percent-input span {
          padding-right: 11px;
          color: #64748b;
          font-size: 12px;
          font-weight: 650;
        }

        .member-large-progress {
          margin-top: 19px;
        }

        .member-large-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #475569;
          font-size: 12px;
          font-weight: 650;
          margin-bottom: 9px;
        }

        .member-large-progress-header strong {
          color: #172033;
        }

        .member-range {
          width: 100%;
          accent-color: #2563eb;
          cursor: pointer;
        }

        .member-range-labels {
          display: flex;
          justify-content: space-between;
          color: #94a3b8;
          font-size: 10px;
          margin-top: 2px;
        }

        .member-update-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 15px;
        }

        .member-primary-button {
          min-height: 38px;
          border: 0;
          border-radius: 8px;
          padding: 0 14px;
          background: #2563eb;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .member-primary-button:hover {
          background: #1d4ed8;
        }

        .member-primary-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .member-finished-notice {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #166534;
          padding: 13px;
          border-radius: 8px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .member-finished-notice div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .member-finished-notice strong {
          font-size: 12px;
        }

        .member-finished-notice span {
          font-size: 11px;
          color: #4d7c5c;
        }

        .member-comments {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .member-no-comments {
          padding: 18px;
          border: 1px dashed #d8dee8;
          border-radius: 9px;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
        }

        .member-comment {
          display: flex;
          gap: 10px;
        }

        .member-comment-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          color: #64748b;
        }

        .member-comment-content {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #edf0f4;
          border-radius: 9px;
          padding: 10px 12px;
        }

        .member-comment-top {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 5px;
        }

        .member-comment-top strong {
          font-size: 12px;
        }

        .member-comment-top span {
          color: #94a3b8;
          font-size: 10px;
        }

        .member-comment-content p {
          margin: 0;
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .member-comment-form {
          margin-top: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          overflow: hidden;
          background: #fff;
        }

        .member-comment-form textarea {
          display: block;
          width: 100%;
          min-height: 75px;
          resize: vertical;
          border: 0;
          outline: 0;
          padding: 12px;
          font-family: inherit;
          font-size: 12px;
          color: #172033;
        }

        .member-comment-form-bottom {
          border-top: 1px solid #edf0f4;
          padding: 8px 9px 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .member-comment-form-bottom > span {
          color: #94a3b8;
          font-size: 10px;
        }

        @media (max-width: 1150px) {
          .member-task-table-head,
          .member-task-row {
            grid-template-columns: minmax(240px, 2fr) 130px 125px 130px 170px 20px;
          }

          .member-filter-card {
            grid-template-columns: 1fr 1fr;
          }
        }

        .member-pagination {
  min-height: 58px;
  padding: 0 18px;
  border-top: 1px solid #edf0f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.member-pagination-info {
  color: #64748b;
  font-size: 12px;
}

.member-pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #475569;
  font-size: 12px;
}

.member-pagination-controls button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #dfe5ec;
  border-radius: 7px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.member-pagination-controls button:hover:not(:disabled) {
  background: #f8fafc;
}

.member-pagination-controls button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

        @media (max-width: 900px) {
          .member-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .member-task-table-head {
            display: none;
          }

          .member-task-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            padding: 16px;
          }

          .member-task-main {
            grid-column: 1 / -1;
          }

          .member-task-arrow {
            display: none;
          }

          .member-detail-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .member-detail-item:nth-child(2) {
            border-right: 0;
          }

          .member-detail-item:nth-child(-n+2) {
            border-bottom: 1px solid #e7ebf0;
          }

          .member-update-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .member-tasks-page {
            padding: 18px 14px 30px;
          }

          .member-page-header {
            align-items: stretch;
          }

          .member-refresh-button {
            width: 40px;
            padding: 0;
            justify-content: center;
          }

          .member-refresh-button span {
            display: none;
          }

          .member-page-header h1 {
            font-size: 23px;
          }

          .member-stats {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }

          .member-stat-card {
            padding: 12px;
            min-height: 75px;
          }

          .member-stat-icon {
            width: 36px;
            height: 36px;
          }

          .member-filter-card {
            grid-template-columns: 1fr;
          }

          .member-task-row {
            grid-template-columns: 1fr;
          }

          .member-task-status,
          .member-task-priority,
          .member-task-deadline,
          .member-task-progress {
            grid-column: 1;
          }

          .member-modal-backdrop {
            padding: 0;
          }

          .member-task-modal {
            width: 100%;
            height: 100%;
            max-height: 100%;
            border-radius: 0;
          }

          .member-modal-body {
            padding: 16px;
          }

          .member-detail-grid {
            grid-template-columns: 1fr 1fr;
          }

          .member-detail-item {
            border-right: 1px solid #e7ebf0;
          }

          .member-detail-item:nth-child(even) {
            border-right: 0;
          }
        }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="member-page-header">
        <div>
          <span className="member-page-eyebrow">WORKSPACE</span>

          <h1>Công việc của tôi</h1>

          <p className="member-page-subtitle">
            Theo dõi và cập nhật các công việc được giao cho bạn.
          </p>
        </div>

        <button
          type="button"
          className="member-refresh-button"
          onClick={() => loadTasks(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />

          <span>Làm mới</span>
        </button>
      </header>

      <div className="member-stats">
        <StatCard
          icon={<FileText size={20} />}
          label="Tổng công việc"
          value={stats.total}
          active={statusFilter === ""}
          onClick={() => handleStatusFilterChange("")}
        />

        <StatCard
          icon={<Clock3 size={20} />}
          label="Chưa bắt đầu"
          value={stats.notStarted}
          active={statusFilter === STATUS.NOT_STARTED}
          onClick={() => handleStatusFilterChange(STATUS.NOT_STARTED)}
        />

        <StatCard
          icon={<Clock3 size={20} />}
          label="Đang thực hiện"
          value={stats.inProgress}
          active={statusFilter === STATUS.IN_PROGRESS}
          onClick={() => handleStatusFilterChange(STATUS.IN_PROGRESS)}
        />

        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Hoàn thành"
          value={stats.done}
          active={statusFilter === STATUS.DONE}
          onClick={() => handleStatusFilterChange(STATUS.DONE)}
        />
      </div>

      <div className="member-filter-card">
        <div className="member-search-box">
          <Search size={17} />

          <input
            type="text"
            placeholder="Tìm công việc, dự án..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <select
          className="member-filter-select"
          value={statusFilter}
          onChange={(event) => handleStatusFilterChange(event.target.value)}
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value || "ALL"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          className="member-filter-select"
          value={priorityFilter}
          onChange={(event) => handlePriorityFilterChange(event.target.value)}
        >
          {PRIORITY_OPTIONS.map((item) => (
            <option key={item.value || "ALL"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {/* <select
          className="member-filter-select"
          value={deadlineFilter}
          onChange={(event) => setDeadlineFilter(event.target.value)}
        >
          <option value="">Tất cả deadline</option>
          <option value="SOON">Sắp đến hạn</option>
          <option value="OVERDUE">Quá hạn</option>
        </select> */}
      </div>

      <section className="member-list-card">
        <div className="member-list-header">
          <h2>Danh sách công việc</h2>

          <span className="member-list-count">{totalElements} công việc</span>
        </div>

        {loading ? (
          <div className="member-loading">
            <Loader2 size={22} className="spin" />
            Đang tải công việc...
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState hasFilter={hasFilter} onClear={clearFilters} />
        ) : (
          <>
            <div className="member-task-table-head">
              <span>Công việc</span>
              <span>Trạng thái</span>
              <span>Ưu tiên</span>
              <span>Deadline</span>
              <span>Tiến độ</span>
              <span />
            </div>

            {tasks.map((task) => (
              <TaskRow
                key={getTaskId(task)}
                task={task}
                onClick={(taskId) => {
                  const found = tasks.find(
                    (item) => getTaskId(item) === taskId
                  );

                  setSelectedTask(found ?? task);
                }}
              />
            ))}

            {totalPages > 0 && (
              <div className="member-pagination">
                <span className="member-pagination-info">
                  Tổng cộng {totalElements} công việc
                </span>

                <div className="member-pagination-controls">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Trước
                  </button>

                  <span>
                    Trang <strong>{page + 1}</strong> / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          showToast={showToast}
        />
      )}
    </div>
  );
}
