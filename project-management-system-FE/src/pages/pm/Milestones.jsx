import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  CalendarRange,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CircleDot,
  ChevronDown,
  Target,
  ListChecks,
  Percent,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const apiFetchProjects = () =>
  axios.get("/projects").then((res) => res.data);

const apiFetchMilestones = (projectId) =>
  axios.get(`/milestones/project/${projectId}`).then((res) => res.data);

const apiFetchTasks = (projectId) =>
  axios
    .get(`/projects/${projectId}/tasks`, {
      params: {
        page: 0,
        size: 100,
        sortBy: "createdAt",
        direction: "desc",
      },
    })
    .then((res) => res.data);

const apiCreateMilestone = (payload) =>
  axios.post("/milestones", payload).then((res) => res.data);

const apiUpdateMilestone = (id, payload) =>
  axios.put(`/milestones/${id}`, payload).then((res) => res.data);

const apiDeleteMilestone = (id) =>
  axios.delete(`/milestones/${id}`);

const EMPTY_FORM = {
  name: "",
  startDate: "",
  endDate: "",
  taskIds: [],
};

const formatDate = (value) => {
  if (!value) return "Chưa xác định";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
};

const getMilestoneProgress = (milestone, tasks) => {
  if (
    typeof milestone.progressPercent === "number" ||
    typeof milestone.progressPercent === "string"
  ) {
    return Math.min(
      Math.max(Number(milestone.progressPercent), 0),
      100,
    );
  }

  const taskIds = milestone.taskIds || [];

  if (!taskIds.length) return 0;

  const linkedTasks = tasks.filter((task) =>
    taskIds.includes(task.id),
  );

  if (!linkedTasks.length) return 0;

  return Math.round(
    linkedTasks.reduce(
      (total, task) =>
        total +
        Number(
          task.progressPercent ??
            task.progress ??
            0,
        ),
      0,
    ) / linkedTasks.length,
  );
};

const getMilestoneStatus = (milestone, progress) => {
  if (progress >= 100) {
    return {
      label: "Hoàn thành",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      icon: CheckCircle2,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = milestone.startDate
    ? new Date(`${milestone.startDate}T00:00:00`)
    : null;

  const endDate = milestone.endDate
    ? new Date(`${milestone.endDate}T23:59:59`)
    : null;

  if (endDate && today > endDate) {
    return {
      label: "Quá hạn",
      className:
        "bg-rose-50 text-rose-700 ring-rose-600/20",
      icon: AlertTriangle,
    };
  }

  if (startDate && today < startDate) {
    return {
      label: "Chưa bắt đầu",
      className:
        "bg-slate-100 text-slate-700 ring-slate-500/20",
      icon: Clock3,
    };
  }

  return {
    label: "Đang thực hiện",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20",
    icon: CircleDot,
  };
};

function getTaskStatusLabel(status) {
  switch (status) {
    case "NOT_STARTED":
      return "Chưa bắt đầu";
    case "IN_PROGRESS":
      return "Đang thực hiện";
    case "PENDING":
      return "Đang chờ";
    case "DONE":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return "Chưa xác định";
  }
}

function getTaskStatusClass(status) {
  switch (status) {
    case "DONE":
      return "bg-emerald-50 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Milestones() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedMilestone, setSelectedMilestone] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetchProjects()
      .then((data) => {
        setProjects(data);

        if (data.length > 0) {
          setProjectId(String(data[0].id));
        }
      })
      .catch((err) => {
        setError(
          err.message || "Không tải được danh sách dự án",
        );
      });
  }, []);

  const loadData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setLoadingTasks(true);
    setError("");

    try {
      const [milestoneData, taskData] =
        await Promise.all([
          apiFetchMilestones(projectId),
          apiFetchTasks(projectId),
        ]);

      setMilestones(
        Array.isArray(milestoneData)
          ? milestoneData
          : [],
      );

      setTasks(
        Array.isArray(taskData)
          ? taskData
          : taskData?.content || [],
      );
    } catch (err) {
      setError(
        err.message ||
          "Không thể tải dữ liệu Milestone",
      );
    } finally {
      setLoading(false);
      setLoadingTasks(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedProject = projects.find(
    (project) =>
      String(project.id) === String(projectId),
  );

  const filteredMilestones = milestones.filter(
    (milestone) =>
      !search.trim() ||
      milestone.name
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const statistics = milestones.reduce(
    (result, milestone) => {
      const progress = getMilestoneProgress(
        milestone,
        tasks,
      );

      const status = getMilestoneStatus(
        milestone,
        progress,
      );

      result.total += 1;

      if (status.label === "Chưa bắt đầu") {
        result.notStarted += 1;
      }

      if (status.label === "Đang thực hiện") {
        result.inProgress += 1;
      }

      if (status.label === "Hoàn thành") {
        result.completed += 1;
      }

      if (status.label === "Quá hạn") {
        result.overdue += 1;
      }

      return result;
    },
    {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    },
  );

  const openCreateForm = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      taskIds: [],
    });

    setShowForm(true);
    setError("");
  };

  const openEditForm = (milestone) => {
    setEditingId(milestone.id);

    setForm({
      name: milestone.name || "",
      startDate: milestone.startDate || "",
      endDate: milestone.endDate || "",
      taskIds: milestone.taskIds || [],
    });

    setShowForm(true);
    setError("");
  };

  const openDetail = (milestone) => {
    setSelectedMilestone(milestone);
    setShowDetail(true);
  };

  const handleTaskToggle = (taskId) => {
    setForm((current) => {
      const exists = current.taskIds.includes(taskId);

      return {
        ...current,
        taskIds: exists
          ? current.taskIds.filter(
              (id) => id !== taskId,
            )
          : [...current.taskIds, taskId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Tên Milestone không được để trống");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Vui lòng chọn đầy đủ thời gian");
      return;
    }

    if (form.startDate > form.endDate) {
      setError(
        "Ngày bắt đầu không được sau ngày kết thúc",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        projectId: Number(projectId),
        taskIds: form.taskIds,
      };

      if (editingId) {
        await apiUpdateMilestone(
          editingId,
          payload,
        );
      } else {
        await apiCreateMilestone(payload);
      }

      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Không thể lưu Milestone",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (milestone) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa Milestone "${milestone.name}"?\n\nCác công việc sẽ không bị xóa.`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiDeleteMilestone(milestone.id);

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Không thể xóa Milestone",
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-50 text-navy-600">
              <Target className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Quản lý Milestone
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Quản lý các mốc quan trọng và theo dõi
                tiến độ của dự án
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateForm}
          disabled={!projectId}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Thêm Milestone
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Dự án
        </label>

        <div className="relative max-w-lg">
          <select
            value={projectId}
            onChange={(event) =>
              setProjectId(event.target.value)
            }
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
          >
            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        {selectedProject && (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span>
              Thời gian:{" "}
              <strong className="font-semibold text-slate-700">
                {formatDate(
                  selectedProject.startDate,
                )}{" "}
                -{" "}
                {formatDate(
                  selectedProject.endDate,
                )}
              </strong>
            </span>

            <span>
              Trạng thái:{" "}
              <strong className="font-semibold text-slate-700">
                {selectedProject.status}
              </strong>
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-500/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="ml-auto text-rose-400 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={Target}
          label="Tổng Milestone"
          value={statistics.total}
        />

        <StatCard
          icon={Clock3}
          label="Chưa bắt đầu"
          value={statistics.notStarted}
        />

        <StatCard
          icon={CircleDot}
          label="Đang thực hiện"
          value={statistics.inProgress}
        />

        <StatCard
          icon={CheckCircle2}
          label="Hoàn thành"
          value={statistics.completed}
        />

        <StatCard
          icon={AlertTriangle}
          label="Quá hạn"
          value={statistics.overdue}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Các Milestone
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tiến độ được xác định từ các công việc
            được gắn với từng Milestone
          </p>
        </div>

        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Tìm Milestone..."
          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 sm:w-64"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-white py-20 text-slate-400 ring-1 ring-slate-200">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Target className="h-7 w-7" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-700">
            Chưa có Milestone
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Hãy tạo Milestone đầu tiên cho dự án này.
          </p>

          <button
            onClick={openCreateForm}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
          >
            <Plus className="h-4 w-4" />
            Thêm Milestone
          </button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredMilestones.map((milestone) => {
            const progress =
              getMilestoneProgress(
                milestone,
                tasks,
              );

            const status =
              getMilestoneStatus(
                milestone,
                progress,
              );

            const StatusIcon = status.icon;

            const linkedTaskIds =
              milestone.taskIds || [];

            const linkedTasks = tasks.filter(
              (task) =>
                linkedTaskIds.includes(task.id),
            );

            const completedTasks =
              linkedTasks.filter(
                (task) =>
                  task.status === "DONE" ||
                  Number(
                    task.progressPercent ??
                      task.progress ??
                      0,
                  ) >= 100,
              ).length;

            return (
              <div
                key={milestone.id}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() =>
                      openDetail(milestone)
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                        <Target className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900 group-hover:text-navy-600">
                          {milestone.name}
                        </h3>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarRange className="h-3.5 w-3.5" />

                          {formatDate(
                            milestone.startDate,
                          )}

                          <span>→</span>

                          {formatDate(
                            milestone.endDate,
                          )}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() =>
                        openEditForm(milestone)
                      }
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy-600"
                      title="Sửa Milestone"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(milestone)
                      }
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa Milestone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    {progress}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-navy-600 transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ListChecks className="h-4 w-4" />

                    <span>
                      {linkedTasks.length} công việc
                    </span>

                    {linkedTasks.length > 0 && (
                      <span>
                        · {completedTasks}/
                        {linkedTasks.length} hoàn thành
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      openDetail(milestone)
                    }
                    className="font-semibold text-navy-600 hover:text-navy-700"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? "Chỉnh sửa Milestone"
                    : "Thêm Milestone"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Xác định mốc quan trọng và các công việc
                  liên quan
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(90vh-73px)] overflow-y-auto"
            >
              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tên Milestone
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Ví dụ: Hoàn thành Backend"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Ngày bắt đầu
                    </label>

                    <input
                      required
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          startDate:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Ngày kết thúc
                    </label>

                    <input
                      required
                      type="date"
                      value={form.endDate}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          endDate:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Công việc thuộc Milestone
                      </label>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Tiến độ Milestone sẽ được tính
                        dựa trên các công việc này
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {form.taskIds.length} đã chọn
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                    {loadingTasks ? (
                      <div className="flex items-center justify-center py-10 text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="py-10 text-center text-sm text-slate-400">
                        Dự án chưa có công việc.
                      </div>
                    ) : (
                      tasks.map((task) => {
                        const checked =
                          form.taskIds.includes(
                            task.id,
                          );

                        const progress = Math.min(
                          Math.max(
                            Number(
                              task.progressPercent ??
                                task.progress ??
                                0,
                            ),
                            0,
                          ),
                          100,
                        );

                        return (
                          <label
                            key={task.id}
                            className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
                              checked
                                ? "bg-navy-50/60"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleTaskToggle(
                                  task.id,
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="truncate text-sm font-semibold text-slate-800">
                                  {task.name ||
                                    task.title ||
                                    "Công việc"}
                                </span>

                                <span className="shrink-0 text-xs font-bold text-slate-600">
                                  {progress}%
                                </span>
                              </div>

                              <div className="mt-1.5 flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getTaskStatusClass(
                                    task.status,
                                  )}`}
                                >
                                  {getTaskStatusLabel(
                                    task.status,
                                  )}
                                </span>

                                {task.deadline && (
                                  <span className="text-[11px] text-slate-400">
                                    Hạn:{" "}
                                    {formatDate(
                                      task.deadline.slice(
                                        0,
                                        10,
                                      ),
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {editingId
                    ? "Lưu thay đổi"
                    : "Tạo Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                  <Target className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedMilestone.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(
                      selectedMilestone.startDate,
                    )}{" "}
                    →{" "}
                    {formatDate(
                      selectedMilestone.endDate,
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setShowDetail(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-85px)] overflow-y-auto p-6">
              {(() => {
                const progress =
                  getMilestoneProgress(
                    selectedMilestone,
                    tasks,
                  );

                const linkedTasks =
                  tasks.filter((task) =>
                    (
                      selectedMilestone.taskIds ||
                      []
                    ).includes(task.id),
                  );

                const completedTasks =
                  linkedTasks.filter(
                    (task) =>
                      task.status === "DONE" ||
                      Number(
                        task.progressPercent ??
                          task.progress ??
                          0,
                      ) >= 100,
                  ).length;

                const status =
                  getMilestoneStatus(
                    selectedMilestone,
                    progress,
                  );

                return (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Tiến độ Milestone
                          </p>

                          <p className="mt-1 text-3xl font-bold text-slate-900">
                            {progress}%
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-navy-600 transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {completedTasks}/
                        {linkedTasks.length} công việc
                        đã hoàn thành
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">
                          Công việc thuộc Milestone
                        </h3>

                        <span className="text-xs text-slate-500">
                          {linkedTasks.length} công việc
                        </span>
                      </div>

                      {linkedTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
                          Chưa có công việc được gắn.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                          {linkedTasks.map(
                            (task) => {
                              const taskProgress =
                                Math.min(
                                  Math.max(
                                    Number(
                                      task.progressPercent ??
                                        task.progress ??
                                        0,
                                    ),
                                    0,
                                  ),
                                  100,
                                );

                              return (
                                <div
                                  key={task.id}
                                  className="p-4"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-slate-800">
                                        {task.name ||
                                          task.title ||
                                          "Công việc"}
                                      </p>

                                      <span
                                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getTaskStatusClass(
                                          task.status,
                                        )}`}
                                      >
                                        {getTaskStatusLabel(
                                          task.status,
                                        )}
                                      </span>
                                    </div>

                                    <span className="text-sm font-bold text-slate-700">
                                      {taskProgress}%
                                    </span>
                                  </div>

                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-navy-500"
                                      style={{
                                        width: `${taskProgress}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-2xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}