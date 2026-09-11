import { useState, useEffect } from "react";
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
} from "lucide-react";
import axios from "../../utils/axios.customize";

export default function PmDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [issues, setIssues] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [projRes, notifRes] = await Promise.all([
        axios.get("/projects").catch(() => ({ data: [] })),
        axios.get("/notifications").catch(() => ({ data: [] })),
      ]);

      const projectList = Array.isArray(projRes.data) ? projRes.data : [];
      setProjects(projectList);
      setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);

      if (projectList.length > 0) {
        const issuePromises = projectList.slice(0, 5).map((p) =>
          axios.get(`/issues/project/${p.id}`).then((r) => r.data).catch(() => [])
        );
        const milestonePromises = projectList.slice(0, 5).map((p) =>
          axios.get(`/milestones/project/${p.id}`).then((r) => r.data).catch(() => [])
        );

        const allIssuesArrays = await Promise.all(issuePromises);
        const allMilestonesArrays = await Promise.all(milestonePromises);

        setIssues(allIssuesArrays.flat());
        setMilestones(allMilestonesArrays.flat());
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const inProgressProjects = projects.filter(
    (p) => p.status === "IN_PROGRESS" || !p.status
  ).length;
  const planningProjects = projects.filter((p) => p.status === "PLANNING").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const onHoldProjects = projects.filter((p) => p.status === "ON_HOLD").length;
  const totalProjects = projects.length || 1;

  const criticalIssues = issues.filter((i) => i.severity === "CRITICAL").length;
  const highIssues = issues.filter((i) => i.severity === "HIGH").length;
  const mediumIssues = issues.filter((i) => i.severity === "MEDIUM").length;
  const lowIssues = issues.filter((i) => i.severity === "LOW").length;
  const totalIssuesCount = issues.length || 1;

  const resolvedIssues = issues.filter(
    (i) => i.status === "RESOLVED" || i.status === "CLOSED"
  ).length;
  const issueResolutionRate =
    issues.length > 0 ? Math.round((resolvedIssues / issues.length) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header synchronized with project typography */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Thống kê tiến độ dự án, vấn đề phát sinh và tài liệu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-navy-600 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => navigate("/pm/projects")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-navy-700 transition-colors"
          >
            <FolderKanban className="h-4 w-4" />
            Dự án của tôi
          </button>
        </div>
      </div>

      {/* Content: Loading spinner first */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border border-slate-200 shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-navy-600 mb-2" />
          <span className="text-xs text-slate-500 font-medium">
            Đang tải dữ liệu tổng quan...
          </span>
        </div>
      ) : (
        <>
          {/* KPI Cards with Navy & Blue accents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div
          onClick={() => navigate("/pm/projects")}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-navy-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tổng số dự án
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {projects.length}
            </span>
            <span className="text-xs font-medium text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
              {inProgressProjects} đang chạy
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Đã hoàn thành</span>
            <span className="font-semibold text-slate-800">{completedProjects}</span>
          </div>
        </div>

        {/* Milestones */}
        <div
          onClick={() => navigate("/pm/milestones")}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-navy-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Mốc lịch trình
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CalendarRange className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {milestones.length || projects.length}
            </span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              theo dõi
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Tiến độ</span>
            <span className="font-semibold text-blue-700">Đúng hạn</span>
          </div>
        </div>

        {/* Issues */}
        <div
          onClick={() => navigate("/pm/issues")}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-navy-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Vấn đề & Lỗi
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
              <Bug className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{issues.length}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                criticalIssues > 0
                  ? "text-red-700 bg-red-50"
                  : "text-slate-600 bg-slate-100"
              }`}
            >
              {criticalIssues} khẩn cấp
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Tỷ lệ giải quyết</span>
            <span className="font-semibold text-navy-700">{issueResolutionRate}%</span>
          </div>
        </div>

        {/* Documents */}
        <div
          onClick={() => navigate("/pm/documents")}
          className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-navy-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tài liệu & Phiên bản
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">Lưu trữ</span>
            <span className="text-xs font-medium text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
              v1 &bull; v2 &bull; v3
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Trạng thái</span>
            <span className="font-semibold text-blue-700">Sẵn sàng</span>
          </div>
        </div>
      </div>

      {/* Visual Metrics & Status Grid with Blue/Navy theme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Trạng thái dự án
            </h3>
            <span className="text-xs text-slate-500">
              Tổng {projects.length} dự án
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex mb-4">
            <div
              style={{ width: `${(inProgressProjects / totalProjects) * 100}%` }}
              className="bg-navy-700 h-full"
              title={`Đang thực hiện: ${inProgressProjects}`}
            />
            <div
              style={{ width: `${(planningProjects / totalProjects) * 100}%` }}
              className="bg-blue-400 h-full"
              title={`Lập kế hoạch: ${planningProjects}`}
            />
            <div
              style={{ width: `${(completedProjects / totalProjects) * 100}%` }}
              className="bg-emerald-500 h-full"
              title={`Hoàn thành: ${completedProjects}`}
            />
            <div
              style={{ width: `${(onHoldProjects / totalProjects) * 100}%` }}
              className="bg-slate-300 h-full"
              title={`Tạm dừng: ${onHoldProjects}`}
            />
          </div>

          {/* Status List */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-navy-700" />
                <span className="text-slate-600">Đang thực hiện</span>
              </div>
              <span className="font-semibold text-navy-800">{inProgressProjects}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-slate-600">Lập kế hoạch</span>
              </div>
              <span className="font-semibold text-slate-800">{planningProjects}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Đã hoàn thành</span>
              </div>
              <span className="font-semibold text-slate-800">{completedProjects}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">Tạm dừng</span>
              </div>
              <span className="font-semibold text-slate-800">{onHoldProjects}</span>
            </div>
          </div>
        </div>

        {/* Issues by Severity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Phân loại vấn đề & lỗi
            </h3>
            <button
              type="button"
              onClick={() => navigate("/pm/issues")}
              className="text-xs text-navy-700 hover:text-navy-900 flex items-center gap-1 font-medium"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Khẩn cấp (Critical)</span>
                <span className="font-semibold text-red-600">{criticalIssues}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{
                    width: `${Math.max(
                      (criticalIssues / totalIssuesCount) * 100,
                      criticalIssues > 0 ? 10 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Mức cao (High)</span>
                <span className="font-semibold text-amber-600">{highIssues}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${Math.max(
                      (highIssues / totalIssuesCount) * 100,
                      highIssues > 0 ? 10 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Trung bình (Medium)</span>
                <span className="font-semibold text-navy-700">{mediumIssues}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-navy-600 h-full rounded-full"
                  style={{
                    width: `${Math.max(
                      (mediumIssues / totalIssuesCount) * 100,
                      mediumIssues > 0 ? 10 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Thấp (Low)</span>
                <span className="font-semibold text-slate-700">{lowIssues}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-300 h-full rounded-full"
                  style={{
                    width: `${Math.max(
                      (lowIssues / totalIssuesCount) * 100,
                      lowIssues > 0 ? 10 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Dự án gần đây
            </h3>
            <button
              type="button"
              onClick={() => navigate("/pm/projects")}
              className="text-xs text-navy-700 hover:text-navy-900 flex items-center gap-1 font-medium"
            >
              Xem danh sách <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Chưa có dự án nào.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate("/pm/projects")}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <h4 className="text-sm font-medium text-slate-900 truncate">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {project.description || "Không có mô tả"}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-md font-medium shrink-0 ${
                      project.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : project.status === "PLANNING"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-navy-50 text-navy-800 border border-navy-200"
                    }`}
                  >
                    {project.status || "IN_PROGRESS"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-navy-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Thông báo mới
              </h3>
            </div>
            <span className="text-xs font-medium text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
              {notifications.length} tin
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Chưa có thông báo mới.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="py-2.5 text-xs">
                  <div className="font-medium text-slate-800 line-clamp-1">
                    {n.title}
                  </div>
                  <div className="text-slate-500 line-clamp-2 mt-0.5">
                    {n.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}