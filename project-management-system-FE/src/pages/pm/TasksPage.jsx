import { useState } from "react";
import {
  Plus,
  ListTodo,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import { toast } from "react-toastify";

export default function TasksPage({ isPm = true }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6 pb-12">
      {/* Header synchronized with project typography */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isPm ? "Quản lý công việc" : "Công việc của tôi"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi trạng thái nhiệm vụ và tiến độ thực hiện
          </p>
        </div>

        {isPm && (
          <button
            type="button"
            onClick={() =>
              toast.info(
                "Nhiệm vụ được quản lý tập trung theo Mốc Lịch trình (Milestones)."
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-navy-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tạo công việc
          </button>
        )}
      </div>

      {/* Filter Tabs - Clean Blue/Navy Underline Style */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs sm:text-sm">
        {[
          { id: "all", label: "Tất cả" },
          { id: "todo", label: "Chờ thực hiện" },
          { id: "in_progress", label: "Đang làm" },
          { id: "done", label: "Hoàn thành" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-navy-700 text-navy-800 font-semibold"
                : "border-transparent text-slate-500 hover:text-navy-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State Screen */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <EmptyState
          icon={ListTodo}
          title="Chưa có công việc nào trong danh mục này"
          description="Hiện tại chưa có nhiệm vụ nào được phân công. Bạn có thể theo dõi tiến độ công việc theo các mốc Lịch trình hoặc danh sách Vấn đề & Lỗi."
          actionText="Xem mốc lịch trình"
          actionLink={isPm ? "/pm/milestones" : "/member/issues"}
          secondaryActionText="Xem vấn đề & lỗi"
          secondaryActionLink={isPm ? "/pm/issues" : "/member/issues"}
        />
      </div>
    </div>
  );
}
