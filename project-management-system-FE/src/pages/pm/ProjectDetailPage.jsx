import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Flag,
  Layers,
  FolderKanban,
  Download,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  UserCheck,
  CheckSquare,
  Bug,
  Shield,
  BarChart3,
  CalendarRange,
  AlertCircle
} from "lucide-react";
import axios from "../../utils/axios.customize";
import getInitials from "../../components/get-avatar-name";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";

const STATUS_CONFIG = {
  PLANNING: { label: "Kế hoạch", bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-300" },
  IN_PROGRESS: { label: "Đang thực hiện", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  ON_HOLD: { label: "Tạm dừng", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  COMPLETED: { label: "Hoàn thành", bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  CLOSED: { label: "Đã đóng", bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200" },
  CANCELLED: { label: "Đã hủy", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
};

const TASK_STATUS_CONFIG = {
  NOT_STARTED: { label: "Chưa bắt đầu", bg: "bg-slate-100", text: "text-slate-600" },
  PENDING: { label: "Chờ xử lý", bg: "bg-amber-100", text: "text-amber-700" },
  IN_PROGRESS: { label: "Đang làm", bg: "bg-blue-100", text: "text-blue-700" },
  DONE: { label: "Hoàn thành", bg: "bg-emerald-100", text: "text-emerald-700" },
  CANCELLED: { label: "Đã hủy", bg: "bg-rose-100", text: "text-rose-700" },
};

const SEVERITY_CONFIG = {
  LOW: { label: "Thấp", bg: "bg-slate-100", text: "text-slate-600" },
  MEDIUM: { label: "Trung bình", bg: "bg-amber-100", text: "text-amber-700" },
  HIGH: { label: "Cao", bg: "bg-orange-100", text: "text-orange-700" },
  CRITICAL: { label: "Nghiêm trọng", bg: "bg-rose-100", text: "text-rose-700" },
};

export default function ProjectDetailPage({ isPm = true }) {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");

  const loadAllProjectData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");

    try {
      const projRes = await axios.get(`/projects/${projectId}`);
      setProject(projRes.data);

      try {
        const memRes = await axios.get(`/projects/${projectId}/members`);
        setMembers(Array.isArray(memRes.data) ? memRes.data : []);
      } catch (e) {
        console.warn("Could not load members:", e);
      }

      try {
        const taskRes = await axios.get(`/projects/${projectId}/tasks`);
        const taskData = taskRes.data?.data ?? taskRes.data;
        setTasks(Array.isArray(taskData) ? taskData : []);
      } catch (e) {
        console.warn("Could not load tasks:", e);
      }

      try {
        const issueRes = await axios.get(`/issues/project/${projectId}`);
        setIssues(Array.isArray(issueRes.data) ? issueRes.data : []);
      } catch (e) {
        console.warn("Could not load issues:", e);
      }

      try {
        const msRes = await axios.get(`/milestones/project/${projectId}`);
        setMilestones(Array.isArray(msRes.data) ? msRes.data : []);
      } catch (e) {
        console.warn("Could not load milestones:", e);
      }

      try {
        const docRes = await axios.get(`/documents/project/${projectId}`);
        setDocuments(Array.isArray(docRes.data) ? docRes.data : []);
      } catch (e) {
        console.warn("Could not load documents:", e);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể tải thông tin chi tiết dự án");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAllProjectData();
  }, [loadAllProjectData]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const percentComplete = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const taskChartData = [
    { name: "Hoàn thành", value: doneTasks, color: "#10b981" },
    { name: "Đang làm", value: inProgressTasks, color: "#3b82f6" },
    { name: "Chờ xử lý", value: Math.max(0, totalTasks - doneTasks - inProgressTasks), color: "#cbd5e1" },
  ].filter((d) => d.value > 0);

  const totalIssues = issues.length;
  const openIssues = issues.filter((i) => i.status !== "CLOSED" && i.status !== "REJECTED").length;
  const criticalIssues = issues.filter((i) => i.severity === "CRITICAL").length;

  const handleDownloadDocument = (versionId, fileName = "document") => {
    if (!versionId) return;
    axios
      .get(`/documents/versions/${versionId}/download`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => alert(err?.response?.data?.message || "Lỗi khi tải file"));
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Đang tải chi tiết dự án...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-3 text-lg font-bold text-rose-900">Không tìm thấy dự án</h2>
        <p className="mt-1 text-sm text-rose-600">{error || "Dự án không tồn tại hoặc bạn không có quyền truy cập."}</p>
        <button
          onClick={() => navigate(isPm ? "/pm/projects" : "/member/projects")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách dự án
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNING;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isPm ? "/pm/projects" : "/member/projects")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            title="Quay lại danh sách dự án"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.ring}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Mã dự án: #{project.id} • Quản lý bởi {project.projectManagerName || "PM"}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadAllProjectData}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Làm mới
          </button>
          {isPm && (
            <Link
              to="/pm/team"
              className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Users size={14} /> Quản lý thành viên
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Tiến độ Task</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{percentComplete}%</span>
            <span className="text-xs text-slate-400">({doneTasks}/{totalTasks})</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percentComplete}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Công việc</span>
            <CheckSquare size={18} className="text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalTasks}</span>
            <span className="text-xs text-slate-400">({inProgressTasks} đang làm)</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{doneTasks} việc đã hoàn thành</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Lỗi / Vấn đề</span>
            <Bug size={18} className="text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalIssues}</span>
            {criticalIssues > 0 && (
              <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                {criticalIssues} nghiêm trọng
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">{openIssues} vấn đề cần xử lý</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Tài nguyên</span>
            <Layers size={18} className="text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{members.length}</span>
            <span className="text-xs text-slate-500">thành viên</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{documents.length} tài liệu lưu trữ</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: "overview", label: "Tổng quan & Thông tin", icon: FolderKanban, count: null },
            { id: "tasks", label: "Công việc", icon: CheckSquare, count: tasks.length },
            { id: "members", label: "Thành viên Team", icon: Users, count: members.length },
            { id: "issues", label: "Lỗi & Vấn đề", icon: Bug, count: issues.length },
            { id: "milestones", label: "Lịch trình", icon: CalendarRange, count: milestones.length },
            { id: "documents", label: "Tài liệu", icon: FileText, count: documents.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Mô tả dự án</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {project.description || "Dự án này chưa có nội dung mô tả chi tiết."}
              </p>
            </div>

            {totalTasks > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Biểu đồ Phân bổ Tiến độ Công việc
                  </h3>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                    {percentComplete}% hoàn thành
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                  <div className="md:col-span-7 h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <RechartsTooltip />
                        <Pie
                          data={taskChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={70}
                          paddingAngle={4}
                          cornerRadius={4}
                        >
                          {taskChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-900">{totalTasks}</span>
                      <span className="text-[10px] text-slate-400">Công việc</span>
                    </div>
                  </div>
                  <div className="md:col-span-5 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-700 font-medium">Hoàn thành</span>
                      </div>
                      <span className="font-bold text-emerald-800">{doneTasks}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <span className="text-slate-700 font-medium">Đang làm</span>
                      </div>
                      <span className="font-bold text-blue-800">{inProgressTasks}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                        <span className="text-slate-700 font-medium">Chờ xử lý</span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {Math.max(0, totalTasks - doneTasks - inProgressTasks)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Công việc gần đây</h3>
                {isPm && (
                  <Link to="/pm/tasks" className="text-xs font-semibold text-blue-600 hover:underline">
                    Xem tất cả trong Quản lý công việc &rarr;
                  </Link>
                )}
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">Chưa có công việc nào trong dự án này.</p>
                ) : (
                  tasks.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0 pr-4">
                        <p className="truncate text-sm font-semibold text-slate-800">{t.title}</p>
                        <p className="text-xs text-slate-400">Ưu tiên: {t.priority} • Hạn chót: {t.dueDate || "Không có"}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          TASK_STATUS_CONFIG[t.status]?.bg || "bg-slate-100"
                        } ${TASK_STATUS_CONFIG[t.status]?.text || "text-slate-700"}`}
                      >
                        {TASK_STATUS_CONFIG[t.status]?.label || t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Thông tin chi tiết</h3>
              <dl className="mt-4 divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-3">
                  <dt className="text-slate-500">Trạng thái</dt>
                  <dd className={`font-semibold ${statusInfo.text}`}>{statusInfo.label}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-slate-500">Ngày bắt đầu</dt>
                  <dd className="font-semibold text-slate-800">{project.startDate || "Chưa đặt"}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-slate-500">Ngày kết thúc</dt>
                  <dd className="font-semibold text-slate-800">{project.endDate || "Chưa đặt"}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-slate-500">Project Manager</dt>
                  <dd className="font-semibold text-slate-800">{project.projectManagerName || "—"}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-slate-500">Ngày tạo</dt>
                  <dd className="text-slate-600">{project.createdAt ? new Date(project.createdAt).toLocaleDateString("vi-VN") : "—"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Thành viên ({members.length})</h3>
                <button
                  onClick={() => setActiveTab("members")}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Xem hết &rarr;
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {members.slice(0, 8).map((m) => (
                  <div
                    key={m.id || m.userId}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60"
                    title={m.email}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {getInitials(m.userFullName || m.email)}
                    </div>
                    <span className="text-xs font-medium text-slate-700">{m.userFullName || m.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === "tasks" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh sách công việc ({tasks.length})</h3>
              <p className="text-xs text-slate-500">Tất cả các đầu việc được giao trong dự án này</p>
            </div>
            {isPm && (
              <Link
                to="/pm/tasks"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={15} /> Thêm công việc mới
              </Link>
            )}
          </div>
          {tasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckSquare size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Chưa có công việc nào trong dự án.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Tiêu đề công việc</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Độ ưu tiên</th>
                    <th className="px-4 py-3.5">Người thực hiện</th>
                    <th className="px-4 py-3.5">Hạn chót</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => {
                    const st = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.NOT_STARTED;
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-semibold text-slate-800">{task.title}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-xs text-slate-600">{task.priority || "MEDIUM"}</td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          {task.assignees && task.assignees.length > 0
                            ? task.assignees.map((a) => a.fullName || a.email).join(", ")
                            : "Chưa giao"}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">{task.dueDate || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEMBERS */}
      {activeTab === "members" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh sách thành viên ({members.length})</h3>
              <p className="text-xs text-slate-500">Các thành viên tham gia vào dự án và vai trò tương ứng</p>
            </div>
            {isPm && (
              <Link
                to="/pm/team"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Users size={15} /> Quản lý phân quyền & thành viên
              </Link>
            )}
          </div>
          {members.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Chưa có thành viên nào trong dự án.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Họ và tên</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Vai trò trong dự án</th>
                    <th className="px-4 py-3.5">Ngày tham gia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id || m.userId} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                            {getInitials(m.userFullName || m.email)}
                          </div>
                          <span className="font-semibold text-slate-800">{m.userFullName || "Thành viên"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">{m.email}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/60">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ISSUES */}
      {activeTab === "issues" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Vấn đề & Lỗi phát sinh ({issues.length})</h3>
              <p className="text-xs text-slate-500">Theo dõi lỗi, mức độ nghiêm trọng và tiến độ xử lý</p>
            </div>
            <Link
              to={isPm ? "/pm/issues" : "/member/issues"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Bug size={15} /> Báo cáo lỗi mới
            </Link>
          </div>
          {issues.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bug size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tuyệt vời! Không có lỗi nào trong dự án này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Tiêu đề lỗi</th>
                    <th className="px-4 py-3.5">Mức độ nghiêm trọng</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Người báo cáo</th>
                    <th className="px-4 py-3.5">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((issue) => {
                    const sev = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.LOW;
                    return (
                      <tr key={issue.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-semibold text-slate-800">{issue.title}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${sev.bg} ${sev.text}`}>
                            {sev.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-700">{issue.status}</td>
                        <td className="px-4 py-4 text-xs text-slate-600">{issue.reporterName || "—"}</td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MILESTONES */}
      {activeTab === "milestones" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lịch trình & Cột mốc ({milestones.length})</h3>
              <p className="text-xs text-slate-500">Các giai đoạn quan trọng và mốc thời gian hoàn thành</p>
            </div>
            {isPm && (
              <Link
                to="/pm/milestones"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={15} /> Thêm lịch trình
              </Link>
            )}
          </div>
          {milestones.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CalendarRange size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Chưa có cột mốc lịch trình nào trong dự án.</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {milestones.map((ms) => (
                <div key={ms.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Flag size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ms.name}</h4>
                      <p className="text-xs text-slate-500">
                        {ms.startDate} &rarr; {ms.endDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tài liệu dự án ({documents.length})</h3>
              <p className="text-xs text-slate-500">Tệp tin và văn bản liên quan đến dự án</p>
            </div>
            <Link
              to={isPm ? "/pm/documents" : "/member/documents"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <FileText size={15} /> Quản lý tài liệu
            </Link>
          </div>
          {documents.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Chưa có tài liệu nào trong dự án.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Tên tài liệu</th>
                    <th className="px-4 py-3.5">Mô tả</th>
                    <th className="px-4 py-3.5">Người tải lên</th>
                    <th className="px-4 py-3.5">Phiên bản</th>
                    <th className="px-4 py-3.5">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                        <FileText size={16} className="text-blue-600 shrink-0" />
                        {doc.name}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 max-w-xs truncate">{doc.description || "—"}</td>
                      <td className="px-4 py-4 text-xs text-slate-600">{doc.uploadedByName || "—"}</td>
                      <td className="px-4 py-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                          v{doc.currentVersionNumber || 1}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {doc.currentVersionId ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(doc.currentVersionId, doc.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Download size={13} /> Tải về
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
