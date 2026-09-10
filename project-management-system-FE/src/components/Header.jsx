import { useState, useRef, useEffect } from "react";
import { Search, Bell, LogOut } from "lucide-react";
import getInitials from "./get-avatar-name";
import NotificationDropdown from "./NotificationDropdown";

export default function Header({ user, pageTitle, onLogout }) {
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const userName = user?.name || user?.fullName || "Người dùng";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      
      <div className="flex w-full max-w-lg items-center gap-6">
        <div className="hidden min-w-max sm:block">
          <h1 className="text-lg font-bold text-slate-900">{pageTitle || "Dashboard"}</h1>
          <p className="text-xs text-slate-500">
             {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm dự án, công việc..."
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-navy-500 focus:bg-white focus:ring-2 focus:ring-navy-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4">
        
        <NotificationDropdown />

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-3 rounded-full bg-slate-50 p-1 pr-3 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-xs font-semibold text-white">
              {getInitials(userName)}
            </div>
            <span className="hidden text-sm font-medium text-slate-900 sm:block">
              {userName}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}