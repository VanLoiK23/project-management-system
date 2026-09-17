import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  CalendarRange,
  Bug,
  FileText,
  ArrowRight,
  RefreshCw,
  Bell,
  CheckCircle2,
  Loader2,
  CheckSquare,
  Clock,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import axios from "../../utils/axios.customize";

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur text-xs z-50">
        {label && <p className="font-bold text-slate-800 mb-1.5">{label}</p>}
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 py-0.5">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Donut Chart Custom Tooltip
const DonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur text-xs z-50">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: data.payload.color || data.fill }}
          />
          <span className="font-semibold text-slate-800">{data.name}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-slate-900">{data.value}</span>
          <span className="text-slate-500 text-[11px]">dự án ({data.payload.percent}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

// Module-level cache so switching tabs does not reload data
let dashboardCache = null;

export default function PmDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => dashboardCache?.projects || []);
  const [notifications, setNotifications] = useState(() => dashboardCache?.notifications || []);
  const [issues, setIssues] = useState(() => dashboardCache?.issues || []);
  const [milestones, setMilestones] = useState(() => dashboardCache?.milestones || []);
  const [projectTasks, setProjectTasks] = useState(() => dashboardCache?.projectTasks || []);
  const [documents, setDocuments] = useState(() => dashboardCache?.documents || []);
  const [loading, setLoading] = useState(() => !dashboardCache);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (force = false) => {
    if (!force && dashboardCache) {
      setLoading(false);
      return;
    }
    try {
      const [projRes, notifRes] = await Promise.all([
        axios.get("/projects").catch(() => ({ data: [] })),
        axios.get("/notifications").catch(() => ({ data: [] })),
      ]);

      const projectList = Array.isArray(projRes.data) ? projRes.data : [];
      setProjects(projectList);
      const notifList = Array.isArray(notifRes.data) ? notifRes.data : [];
      setNotifications(notifList);

      let allIssues = [];
      let allMilestones = [];
      let allTasks = [];
      let allDocs = [];

      if (projectList.length > 0) {
        const issuePromises = projectList.slice(0, 8).map((p) =>
          axios.get(`/issues/project/${p.id}`).then((r) => r.data).catch(() => [])
        );
        const milestonePromises = projectList.slice(0, 8).map((p) =>
          axios.get(`/milestones/project/${p.id}`).then((r) => r.data).catch(() => [])
        );
        const taskPromises = projectList.slice(0, 8).map((p) =>
          axios
            .get(`/projects/${p.id}/tasks`)
            .then((r) => {
              const list = r.data?.data ?? r.data;
              return {
                projectId: p.id,
                projectName: p.name,
                tasks: Array.isArray(list) ? list : [],
              };
            })
            .catch(() => ({
              projectId: p.id,
              projectName: p.name,
              tasks: [],
            }))
        );
        const docPromises = projectList.slice(0, 8).map((p) =>
          axios.get(`/documents/project/${p.id}`).then((r) => r.data).catch(() => [])
        );

        const [allIssuesArrays, allMilestonesArrays, allTasksData, allDocsArrays] =
          await Promise.all([
            Promise.all(issuePromises),
            Promise.all(milestonePromises),
            Promise.all(taskPromises),
            Promise.all(docPromises),
          ]);

        allIssues = allIssuesArrays.flat();
        allMilestones = allMilestonesArrays.flat();
        allTasks = allTasksData;
        allDocs = allDocsArrays.flat();

        setIssues(allIssues);
        setMilestones(allMilestones);
        setProjectTasks(allTasks);
        setDocuments(allDocs);
      }

      dashboardCache = {
        projects: projectList,
        notifications: notifList,
        issues: allIssues,
        milestones: allMilestones,
        projectTasks: allTasks,
        documents: allDocs,
      };
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!dashboardCache) {
      fetchDashboardData();
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  // --- THỐNG KÊ DỰ ÁN ---
  const inProgressProjects = projects.filter(
    (p) => p.status === "IN_PROGRESS" || !p.status
  ).length;
  const planningProjects = projects.filter((p) => p.status === "PLANNING").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const onHoldProjects = projects.filter((p) => p.status === "ON_HOLD").length;
  const closedProjects = projects.filter((p) => p.status === "CLOSED").length;
  const totalProjects = projects.length || 1;

  // Dữ liệu biểu đồ tròn Trạng thái Dự án
  const rawStatusData = [
    { name: "Đang thực hiện", value: inProgressProjects, color: "#2563eb", key: "IN_PROGRESS" },
    { name: "Kế hoạch", value: planningProjects, color: "#06b6d4", key: "PLANNING" },
    { name: "Hoàn thành", value: completedProjects, color: "#10b981", key: "COMPLETED" },
    { name: "Tạm dừng", value: onHoldProjects, color: "#f59e0b", key: "ON_HOLD" },
    { name: "Đã đóng", value: closedProjects, color: "#8b5cf6", key: "CLOSED" },
  ];
  const projectStatusData = rawStatusData
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      percent: Math.round((d.value / (projects.length || 1)) * 100),
    }));

  // --- THỐNG KÊ ISSUES / VẤN ĐỀ ---
  const criticalIssues = issues.filter((i) => i.severity === "CRITICAL").length;
  const highIssues = issues.filter((i) => i.severity === "HIGH").length;
  const mediumIssues = issues.filter((i) => i.severity === "MEDIUM").length;
  const lowIssues = issues.filter((i) => i.severity === "LOW").length;

  const resolvedIssues = issues.filter(
    (i) => i.status === "RESOLVED" || i.status === "CLOSED"
  ).length;
  const openIssues = Math.max(0, issues.length - resolvedIssues);
  const issueResolutionRate =
    issues.length > 0 ? Math.round((resolvedIssues / issues.length) * 100) : 100;

  // --- THỐNG KÊ CỘT MỐC LỊCH TRÌNH ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const activeMilestones = milestones.filter(
    (m) => m.startDate && m.endDate && todayStr >= m.startDate && todayStr <= m.endDate
  ).length;
  const endedMilestones = milestones.filter(
    (m) => m.endDate && todayStr > m.endDate
  ).length;
  const upcomingMilestones = milestones.filter(
    (m) => (m.startDate && todayStr < m.startDate) || (!m.startDate && !m.endDate)
  ).length;

  // Dữ liệu biểu đồ cột Vấn đề theo Mức độ & Tình trạng
  const issueSeverityData = [
    {
      severity: "Khẩn cấp",
      "Chưa giải quyết": issues.filter(
        (i) => i.severity === "CRITICAL" && i.status !== "RESOLVED" && i.status !== "CLOSED"
      ).length,
      "Đã giải quyết": issues.filter(
        (i) => i.severity === "CRITICAL" && (i.status === "RESOLVED" || i.status === "CLOSED")
      ).length,
    },
    {
      severity: "Mức cao",
      "Chưa giải quyết": issues.filter(
        (i) => i.severity === "HIGH" && i.status !== "RESOLVED" && i.status !== "CLOSED"
      ).length,
      "Đã giải quyết": issues.filter(
        (i) => i.severity === "HIGH" && (i.status === "RESOLVED" || i.status === "CLOSED")
      ).length,
    },
    {
      severity: "Trung bình",
      "Chưa giải quyết": issues.filter(
        (i) => i.severity === "MEDIUM" && i.status !== "RESOLVED" && i.status !== "CLOSED"
      ).length,
      "Đã giải quyết": issues.filter(
        (i) => i.severity === "MEDIUM" && (i.status === "RESOLVED" || i.status === "CLOSED")
      ).length,
    },
    {
      severity: "Thấp",
      "Chưa giải quyết": issues.filter(
        (i) => i.severity === "LOW" && i.status !== "RESOLVED" && i.status !== "CLOSED"
      ).length,
      "Đã giải quyết": issues.filter(
        (i) => i.severity === "LOW" && (i.status === "RESOLVED" || i.status === "CLOSED")
      ).length,
    },
  ];

  // --- THỐNG KÊ TASKS / CÔNG VIỆC ---
  const allTasksList = projectTasks.flatMap((pt) => pt.tasks);
  const totalTasksCount = allTasksList.length;
  const doneTasksCount = allTasksList.filter((t) => t.status === "DONE").length;
  const inProgressTasksCount = allTasksList.filter((t) => t.status === "IN_PROGRESS").length;
  const taskCompletionRate =
    totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  // Dữ liệu biểu đồ cột chồng Tiến độ Task theo từng dự án
  const taskProgressChartData = projectTasks.slice(0, 6).map((pt) => {
    const total = pt.tasks.length;
    const done = pt.tasks.filter((t) => t.status === "DONE").length;
    const inProg = pt.tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const pending = total - done - inProg;
    const shortName =
      pt.projectName?.length > 14 ? pt.projectName.substring(0, 14) + "..." : pt.projectName;
    return {
      name: shortName || `Dự án #${pt.projectId}`,
      fullName: pt.projectName || `Dự án #${pt.projectId}`,
      "Hoàn thành": done,
      "Đang làm": inProg,
      "Chờ xử lý": Math.max(0, pending),
      total,
    };
  });

  // Dữ liệu biểu đồ Phân bổ nhân sự theo dự án
  const memberAllocationData = projects.slice(0, 6).map((p) => ({
    name: p.name?.length > 14 ? p.name.substring(0, 14) + "..." : p.name,
    fullName: p.name,
    "Thành viên": p.memberCount || 0,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Số liệu thời gian thực, biểu đồ phân tích tiến độ, công việc và rủi ro dự án
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => navigate("/pm/projects")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <FolderKanban className="h-4 w-4" />
            Dự án của tôi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <span className="text-xs text-slate-500 font-medium">
            Đang tải dữ liệu biểu đồ tổng quan...
          </span>
        </div>
      ) : (
        <>
          {/* KPI Cards Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Card 1: Total Projects */}
            <div
              onClick={() => navigate("/pm/projects")}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dự án quản lý
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{projects.length}</span>
                  <span className="text-xs text-slate-500 font-medium">dự án</span>
                  <span className="ml-auto text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {inProgressProjects > 0
                      ? `${inProgressProjects} đang chạy`
                      : planningProjects > 0
                      ? `${planningProjects} kế hoạch`
                      : "0 đang chạy"}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Kế hoạch: <strong className="text-cyan-700 font-semibold">{planningProjects}</strong></span>
                <span>Hoàn tất: <strong className="text-emerald-600 font-semibold">{completedProjects}</strong></span>
              </div>
            </div>

            {/* Card 2: Total Tasks */}
            <div
              onClick={() => navigate("/pm/tasks")}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tổng công việc
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{totalTasksCount}</span>
                  <span className="text-xs text-slate-500 font-medium">task</span>
                  <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {taskCompletionRate}% xong
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Đang làm: <strong className="text-blue-600 font-semibold">{inProgressTasksCount}</strong></span>
                <span>Chờ: <strong className="text-slate-700 font-semibold">{Math.max(0, totalTasksCount - doneTasksCount - inProgressTasksCount)}</strong></span>
                <span>Xong: <strong className="text-emerald-600 font-semibold">{doneTasksCount}</strong></span>
              </div>
            </div>

            {/* Card 3: Issues */}
            <div
              onClick={() => navigate("/pm/issues")}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Vấn đề & Lỗi
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Bug className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{issues.length}</span>
                  <span className="text-xs text-slate-500 font-medium">vấn đề</span>
                  {criticalIssues > 0 ? (
                    <span className="ml-auto text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200 animate-pulse">
                      {criticalIssues} khẩn cấp
                    </span>
                  ) : openIssues > 0 ? (
                    <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {openIssues} đang mở
                    </span>
                  ) : (
                    <span className="ml-auto text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ổn định
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Đang mở: <strong className="text-rose-600 font-semibold">{openIssues}</strong></span>
                <span>Đã đóng: <strong className="text-emerald-600 font-semibold">{resolvedIssues} ({issueResolutionRate}%)</strong></span>
              </div>
            </div>

            {/* Card 4: Milestones */}
            <div
              onClick={() => navigate("/pm/milestones")}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Mốc lịch trình
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <CalendarRange className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{milestones.length}</span>
                  <span className="text-xs text-slate-500 font-medium">cột mốc</span>
                  <span className="ml-auto text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {activeMilestones > 0
                      ? `${activeMilestones} đang chạy`
                      : upcomingMilestones > 0
                      ? `${upcomingMilestones} sắp tới`
                      : milestones.length > 0
                      ? "Đúng tiến độ"
                      : "Chưa có mốc"}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Đang chạy: <strong className="text-indigo-600 font-semibold">{activeMilestones}</strong></span>
                <span>Sắp tới: <strong className="text-blue-600 font-semibold">{upcomingMilestones}</strong></span>
                <span>Đã qua: <strong className="text-slate-600 font-semibold">{endedMilestones}</strong></span>
              </div>
            </div>

            {/* Card 5: Documents */}
            <div
              onClick={() => navigate("/pm/documents")}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm cursor-pointer hover:border-violet-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tài liệu dự án
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{documents.length}</span>
                  <span className="text-xs text-slate-500 font-medium">tệp tin</span>
                  <span className="ml-auto text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                    {documents.length > 0 ? "Lưu trữ" : "Trống"}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Lưu trữ qua</span>
                <span className="font-semibold text-slate-700">{projects.length} dự án</span>
              </div>
            </div>
          </div>

          {/* =========================================================
              CHARTS ROW 1: Donut Chart & Issues Severity Chart
          ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Donut Chart - Trạng thái Dự án */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-blue-600" />
                      Phân bổ Trạng thái Dự án
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tỷ lệ phần trăm và số lượng theo từng giai đoạn
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    Tổng: {projects.length} dự án
                  </span>
                </div>

                {projectStatusData.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
                    Chưa có dữ liệu dự án
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 py-3">
                    {/* Donut Chart Canvas */}
                    <div className="md:col-span-7 h-[250px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip content={<DonutTooltip />} />
                          <Pie
                            data={projectStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={88}
                            paddingAngle={4}
                            cornerRadius={5}
                          >
                            {projectStatusData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Label inside Donut */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-extrabold text-slate-900 leading-none">
                          {projects.length}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 mt-1">
                          Dự án
                        </span>
                      </div>
                    </div>

                    {/* Legend Breakdown List */}
                    <div className="md:col-span-5 space-y-2.5 text-xs">
                      {rawStatusData.map((item) => {
                        const count = item.value;
                        const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
                        return (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-medium text-slate-700">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{count}</span>
                              <span className="text-slate-400 font-medium">({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Đang thực hiện chiếm nhiều nhất</span>
                <span className="font-semibold text-blue-700">
                  {Math.round((inProgressProjects / (projects.length || 1)) * 100)}% tổng số
                </span>
              </div>
            </div>

            {/* Chart 2: Stacked Bar Chart - Tiến độ Công việc theo Dự án */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Tiến độ Công việc theo Dự án
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Số lượng task hoàn thành, đang làm và chờ xử lý
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {totalTasksCount} tasks
                  </span>
                </div>

                {taskProgressChartData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                    Chưa có công việc nào được giao trong các dự án
                  </div>
                ) : (
                  <div className="h-[250px] w-full mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={taskProgressChartData}
                        margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                        />
                        <Bar
                          dataKey="Hoàn thành"
                          stackId="a"
                          fill="#10b981"
                          radius={[0, 0, 0, 0]}
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="Đang làm"
                          stackId="a"
                          fill="#3b82f6"
                          radius={[0, 0, 0, 0]}
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="Chờ xử lý"
                          stackId="a"
                          fill="#cbd5e1"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Tổng task đã hoàn thành:</span>
                <span className="font-bold text-emerald-600">
                  {doneTasksCount} / {totalTasksCount} tasks ({taskCompletionRate}%)
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              CHARTS ROW 2: Issues Severity & Team Allocation
          ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Issues Severity & Resolution Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                      Phân loại Vấn đề & Mức độ Nghiêm trọng
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      So sánh vấn đề chưa giải quyết vs đã xử lý
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/pm/issues")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    Xem chi tiết <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="h-[250px] w-full mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={issueSeverityData}
                      margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="severity"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                      />
                      <Bar
                        dataKey="Chưa giải quyết"
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar
                        dataKey="Đã giải quyết"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Tỷ lệ giải quyết sự cố chung:</span>
                <span className="font-bold text-emerald-600">{issueResolutionRate}% hoàn tất</span>
              </div>
            </div>

            {/* Chart 4: Team Member Allocation per Project */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      Phân bổ Nhân sự theo Dự án
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quy mô thành viên tham gia từng dự án trọng điểm
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/pm/team")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    Quản lý Team <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {memberAllocationData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                    Chưa có dự án nào
                  </div>
                ) : (
                  <div className="h-[250px] w-full mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={memberAllocationData}
                        margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="Thành viên"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorMembers)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Dự án quy mô lớn nhất:</span>
                <span className="font-bold text-indigo-600">
                  {projects.length > 0
                    ? `${Math.max(...projects.map((p) => p.memberCount || 0))} nhân sự`
                    : "0"}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              BOTTOM SECTION: Recent Projects & Notifications
          ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-slate-700" />
                    Dự án gần đây
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhấp vào dự án để xem màn hình chi tiết
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/pm/projects")}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  Xem tất cả ({projects.length}) <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Chưa có dự án nào trong hệ thống.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/pm/projects/${project.id}`)}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-3 rounded-xl cursor-pointer transition-all group"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                            {project.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            #{project.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {project.description || "Chưa có mô tả dự án"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-500 hidden sm:inline">
                          {project.memberCount || 0} thành viên
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${
                            project.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : project.status === "PLANNING"
                              ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
                              : project.status === "ON_HOLD"
                              ? "bg-amber-50 text-amber-700 ring-amber-200"
                              : project.status === "CLOSED"
                              ? "bg-purple-50 text-purple-700 ring-purple-200"
                              : "bg-blue-50 text-blue-700 ring-blue-200"
                          }`}
                        >
                          {project.status === "IN_PROGRESS"
                            ? "Đang chạy"
                            : project.status === "PLANNING"
                            ? "Kế hoạch"
                            : project.status === "COMPLETED"
                            ? "Hoàn thành"
                            : project.status === "ON_HOLD"
                            ? "Tạm dừng"
                            : project.status === "CLOSED"
                            ? "Đã đóng"
                            : project.status || "Đang chạy"}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-slate-700" />
                    <h3 className="text-base font-bold text-slate-900">
                      Thông báo mới
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {notifications.length} tin
                  </span>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Chưa có thông báo mới nào.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="py-3 text-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {n.title}
                        </div>
                        <div className="text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {n.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Cập nhật tự động</span>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}