import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  MoreHorizontal,
  X,
  Briefcase,
  TrendingUp,
  CalendarDays,
  XCircle,
} from "lucide-react";

const initialProjects = [
  {
    id: 1,
    name: "Hệ thống ERP doanh nghiệp",
    description: "Tích hợp quản lý tài chính, nhân sự và vận hành",
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    status: "Đang thực hiện",
    progress: 78,
    team: ["NT", "HL", "AP", "MK"],
  },
  {
    id: 2,
    name: "Website thương mại điện tử",
    description: "Xây dựng nền tảng bán hàng đa kênh",
    startDate: "2026-02-15",
    endDate: "2026-08-20",
    status: "Planning",
    progress: 24,
    team: ["HL", "NT"],
  },
  {
    id: 3,
    name: "Ứng dụng di động CRM",
    description: "Hỗ trợ đội ngũ sales theo dõi khách hàng",
    startDate: "2025-09-01",
    endDate: "2025-12-15",
    status: "Closed",
    progress: 100,
    team: ["AP", "MK", "NT"],
  },
  {
    id: 4,
    name: "Nâng cấp hạng tầng Cloud",
    description: "Chuyển đổi và tối ưu kiến trúc cloud",
    startDate: "2026-03-01",
    endDate: "2026-05-30",
    status: "Đang thực hiện",
    progress: 62,
    team: ["NT", "HL"],
  },
  {
    id: 5,
    name: "Chiến dịch Marketing Q3",
    description: "Kế hoạch quảng bá sản phẩm mới",
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    status: "Planning",
    progress: 12,
    team: ["MK", "AP"],
  },
];

const avatarGradients = [
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
];

// ================= CÁC HÀM HELPER =================
function statusBadgeClasses(status) {
  switch (status) {
    case "Planning":
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
    case "Đang thực hiện":
      return "bg-emerald-100 text-emerald-700 ring-emerald-500/20";
    case "Closed":
      return "bg-rose-100 text-rose-700 ring-rose-500/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

function progressBarColor(progress) {
  if (progress >= 80) return "bg-emerald-500";
  if (progress >= 50) return "bg-amber-500";
  return "bg-rose-500";
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

// ================= COMPONENT CHÍNH =================
export default function ProjectDashboard() {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState(""); // Nếu muốn thêm thanh search cho riêng bảng
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Khóa cuộn trang khi mở Modal
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Lọc dự án
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  function openModal() {
    setForm({ name: "", description: "", startDate: "", endDate: "" });
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên dự án.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setFormError("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const newProject = {
      id: projects.length + 1,
      name: form.name.trim(),
      description: form.description.trim() || "—",
      startDate: form.startDate,
      endDate: form.endDate,
      status: "Planning",
      progress: 0,
      team: ["NT"], // Tạm thời hardcode team
    };

    setProjects((prev) => [newProject, ...prev]);
    closeModal();
  }

  // Thống kê
  const stats = [
    {
      label: "Tổng dự án",
      value: projects.length,
      icon: Briefcase,
      color: "from-navy-600 to-navy-800",
      iconColor: "text-navy-200",
      trend: "+2 dự án trong tháng này",
      trendColor: "text-emerald-600",
    },
    {
      label: "Đang thực hiện",
      value: projects.filter((p) => p.status === "Đang thực hiện").length,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-700",
      iconColor: "text-emerald-200",
      trend: "+1 so với tuần trước",
      trendColor: "text-emerald-600",
    },
    {
      label: "Planning",
      value: projects.filter((p) => p.status === "Planning").length,
      icon: CalendarDays,
      color: "from-slate-500 to-slate-700",
      iconColor: "text-slate-300",
      trend: "Ổn định",
      trendColor: "text-slate-500",
    },
    {
      label: "Closed",
      value: projects.filter((p) => p.status === "Closed").length,
      icon: XCircle,
      color: "from-rose-500 to-rose-700",
      iconColor: "text-rose-200",
      trend: "-1 so với tháng trước",
      trendColor: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Tiêu đề & Nút Tạo Dự án */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Danh sách dự án
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý và theo dõi tiến độ các dự án của doanh nghiệp
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-900/30 focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          <Plus className="h-4 w-4" />
          Tạo dự án mới
        </button>
      </div>

      {/* Thẻ Thống kê */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div
                className={[
                  "absolute right-0 top-0 h-full w-1 bg-gradient-to-b",
                  stat.color,
                ].join(" ")}
              />
              <Icon
                className={[
                  "absolute right-4 top-4 h-10 w-10 opacity-20",
                  stat.iconColor,
                ].join(" ")}
              />
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p
                className={[
                  "mt-2 flex items-center gap-1 text-xs font-medium",
                  stat.trendColor,
                ].join(" ")}
              >
                {stat.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bảng Danh sách Dự án */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên dự án</th>
                <th className="px-6 py-4 font-semibold">Mô tả ngắn</th>
                <th className="px-6 py-4 font-semibold">Ngày bắt đầu</th>
                <th className="px-6 py-4 font-semibold">Ngày kết thúc</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Tiến độ</th>
                <th className="px-6 py-4 font-semibold">Team</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    Không tìm thấy dự án nào.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {project.name}
                    </td>
                    <td className="max-w-xs px-6 py-4 text-slate-500">
                      <span className="line-clamp-1">
                        {project.description}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(project.startDate)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(project.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                          statusBadgeClasses(project.status),
                        ].join(" ")}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={[
                              "h-2 rounded-full transition-all",
                              progressBarColor(project.progress),
                            ].join(" ")}
                            style={{
                              width: `${project.progress}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {project.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {project.team.map((member, i) => (
                          <div
                            key={i}
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ring-2 ring-white text-[10px] font-bold text-white",
                              avatarGradients[i % avatarGradients.length],
                            ].join(" ")}
                            title={member}
                          >
                            {member}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                        aria-label="Thao tác khác"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Dự án */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                Tạo dự án mới
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="project-name"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Tên dự án <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="project-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên dự án"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="project-description"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Mô tả
                  </label>
                  <textarea
                    id="project-description"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả ngắn về dự án"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="mb-1.5 block text-sm font-medium text-slate-900"
                    >
                      Ngày bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="start-date"
                        name="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={handleInputChange}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="end-date"
                      className="mb-1.5 block text-sm font-medium text-slate-900"
                    >
                      Ngày kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="end-date"
                        name="endDate"
                        type="date"
                        value={form.endDate}
                        onChange={handleInputChange}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                      />
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-500/20">
                    {formError}
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 px-5 text-sm font-semibold text-white shadow-lg shadow-navy-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-900/30 focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:ring-offset-2 focus:ring-offset-white"
                >
                  Lưu dự án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}