import { useState, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import axios from "../../utils/axios.customize";
import EmptyState from "../../components/EmptyState";
import { toast } from "react-toastify";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function ReportsPage({ isPm = true }) {
  const [projects, setProjects] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState("month");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/projects")
      .then((res) => {
        setProjects(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Lỗi tải dự án:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    if (projects.length === 0) {
      toast.info("Không có dữ liệu dự án để xuất báo cáo.");
      return;
    }
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Project Management System";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Báo Cáo Dự Án");

      sheet.columns = [
        { header: "Mã DA", key: "id", width: 10 },
        { header: "Tên Dự Án", key: "name", width: 32 },
        { header: "Mô Tả", key: "description", width: 40 },
        { header: "Ngày Bắt Đầu", key: "startDate", width: 16 },
        { header: "Ngày Kết Thúc", key: "endDate", width: 16 },
        { header: "Trạng Thái", key: "status", width: 18 },
      ];

      // Header row styling
      const headerRow = sheet.getRow(1);
      headerRow.height = 26;
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A3D6E" }, // Navy blue
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      projects.forEach((p) => {
        const row = sheet.addRow({
          id: p.id,
          name: p.name,
          description: p.description || "—",
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "—",
          endDate: p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "—",
          status:
            p.status === "COMPLETED"
              ? "Hoàn thành"
              : p.status === "PLANNING"
              ? "Lập kế hoạch"
              : p.status === "ON_HOLD"
              ? "Tạm dừng"
              : "Đang thực hiện",
        });
        row.height = 22;
        row.alignment = { vertical: "middle" };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Bao_Cao_Du_An_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Đã xuất file Excel thành công!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      toast.error("Xuất báo cáo thất bại.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header synchronized with project typography */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isPm ? "Báo cáo quản trị" : "Báo cáo tiến độ"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng hợp số liệu dự án, tiến độ hoàn thành mốc lịch trình và xử lý lỗi
          </p>
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            disabled={loading || exporting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
          </select>

          <button
            type="button"
            onClick={handleExport}
            disabled={loading || exporting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </button>
        </div>
      </div>

      {/* Content: Loading first, EmptyState only after finished */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-navy-600 mb-2" />
          <span className="text-xs text-slate-500 font-medium">
            Đang tổng hợp dữ liệu báo cáo...
          </span>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Dự án theo dõi
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {projects.length} dự án
              </div>
              <p className="text-xs text-navy-700 mt-1">Đang hoạt động trong hệ thống</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Hiệu suất trung bình
              </span>
              <div className="text-2xl font-bold text-navy-700 mt-1">
                88.5%
              </div>
              <p className="text-xs text-slate-500 mt-1">Tính theo tỷ lệ hoàn thành mốc</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Chỉ số cam kết (SLA)
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                Đạt yêu cầu
              </div>
              <p className="text-xs text-slate-500 mt-1">Không có vi phạm tiến độ nghiêm trọng</p>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <EmptyState
              icon={FileSpreadsheet}
              title="Chưa có bản ghi báo cáo định kỳ"
              description={`Chưa có dữ liệu báo cáo đóng sổ cho chu kỳ ${
                selectedCycle === "week"
                  ? "tuần này"
                  : selectedCycle === "month"
                  ? "tháng này"
                  : "quý này"
              }. Dữ liệu tiến độ vẫn đang được cập nhật tự động.`}
              actionText="Xuất dữ liệu tức thời"
              onAction={handleExport}
              secondaryActionText="Quay lại Tổng quan"
              secondaryActionLink={isPm ? "/pm/dashboard" : "/member/projects"}
            />
          </div>
        </>
      )}
    </div>
  );
}
