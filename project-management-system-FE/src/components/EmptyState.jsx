import { useNavigate } from "react-router-dom";
import { Inbox, ArrowLeft, Plus } from "lucide-react";

export default function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Hiện tại chưa có dữ liệu nào trong mục này.",
  icon: Icon = Inbox,
  actionText,
  actionLink,
  onAction,
  secondaryActionText,
  secondaryActionLink,
  extra,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-white rounded-xl border border-dashed border-slate-300 text-center max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-700 mb-4">
        <Icon className="h-6 w-6 text-navy-700" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {extra && <div className="mb-5 w-full">{extra}</div>}

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionText && (
          <button
            type="button"
            onClick={() => {
              if (onAction) onAction();
              else if (actionLink) navigate(actionLink);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            {actionText}
          </button>
        )}

        {secondaryActionText && (
          <button
            type="button"
            onClick={() => {
              if (secondaryActionLink) navigate(secondaryActionLink);
              else navigate(-1);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
}
