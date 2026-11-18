import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  AtSign,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import axios from "../utils/axios.customize";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(() => {
    axios
      .get("/notifications/unread-count")
      .then((res) => setUnreadCount(res.data?.unreadCount || 0))
      .catch(() => {});
  }, []);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    axios
      .get("/notifications")
      .then((res) => {
        setNotifications(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleScanDeadlines = async (e) => {
    e?.stopPropagation();
    setScanning(true);
    try {
      await axios.post("/notifications/check-deadlines");
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Lỗi quét deadline:", err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = (id, e) => {
    e?.stopPropagation();
    axios
      .patch(`/notifications/${id}/read`)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      })
      .catch(() => {});
  };

  const handleMarkAllAsRead = () => {
    axios
      .patch("/notifications/read-all")
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      })
      .catch(() => {});
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  const getNotificationIcon = (title = "") => {
    const lower = title.toLowerCase();
    if (lower.includes("quá hạn")) {
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
      );
    }
    if (lower.includes("hạn chót") || lower.includes("đến hạn")) {
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock className="h-3.5 w-3.5" />
        </div>
      );
    }
    if (lower.includes("nhắc đến") || lower.includes("bình luận")) {
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <AtSign className="h-3.5 w-3.5" />
        </div>
      );
    }
    if (lower.includes("phân công")) {
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <UserCheck className="h-3.5 w-3.5" />
        </div>
      );
    }
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Bell className="h-3.5 w-3.5" />
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Nút quét deadline nhanh */}
              <button
                type="button"
                onClick={handleScanDeadlines}
                disabled={scanning}
                title="Quét và kiểm tra deadline công việc"
                className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${scanning ? "animate-spin text-blue-600" : ""}`}
                />
                <span>{scanning ? "Đang quét..." : "Quét deadline"}</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Đã đọc
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                    !n.isRead ? "bg-blue-50/40" : "bg-white"
                  }`}
                >
                  {getNotificationIcon(n.title)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4
                        className={`text-xs leading-snug ${
                          !n.isRead
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-700"
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(n.createdAt)}
                      </span>
                      {n.createdByName && (
                        <span className="text-slate-500 font-medium">{n.createdByName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
