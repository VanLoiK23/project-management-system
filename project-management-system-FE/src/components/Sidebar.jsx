import { Link } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import roleMenus from "./RoleMenu";

export default function Sidebar({ role, currentPath }) {
  const menuItems = roleMenus[role?.toUpperCase()] || roleMenus.MEMBER;

  return (
    <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-900">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 shadow-lg shadow-navy-900/30">
          <FolderKanban className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">QL Dự án</p>
          <p className="text-xs text-slate-400">Doanh nghiệp ({role})</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath && currentPath.startsWith(item.path);

          return (
            <Link
              key={item.label}
              to={item.path}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-navy-600 text-white shadow-md shadow-navy-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-slate-800/50 p-3">
          <p className="text-xs font-medium text-slate-400">Phiên bản</p>
          <p className="text-sm font-semibold text-white">v0.1</p>
        </div>
      </div>
    </aside>
  );
}
