import { useContext } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar"; // Thay đổi đường dẫn tuỳ thư mục của bạn
import Header from "./components/Header"; // Thay đổi đường dẫn tuỳ thư mục của bạn
import { AuthContext } from "./components/context/auth.context";
import roleMenus from "./components/RoleMenu";
import axios from "./utils/axios.customize";

export default function App() {
  const { auth, setAuth, isAppLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Lỗi logout:", error);
    } finally { 
      localStorage.removeItem("access_token");
      setAuth({
        isAuthenticated: false,
        user: { email: "", fullName: "", role: "", avatar: "" },
      });
      navigate("/auth");
    }
  };

  if (isAppLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <span className="flex items-center gap-2 text-navy-600 font-medium">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-600 border-t-transparent" />
          Đang tải dữ liệu hệ thống...
        </span>
      </div>
    );
  }

  if (!auth.user || !auth.user.email) {
    return <Navigate to="/auth" />;
  }

  const role = auth.user.role || "MEMBER";
  const menuItems = roleMenus[role.toUpperCase()] || roleMenus.MEMBER;

  const currentMenu = menuItems.find((item) =>
    currentPath.startsWith(item.path)
  );
  const computedPageTitle = currentMenu ? currentMenu.label : "Dashboard";

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900">
      <Sidebar
        role={auth.user.role} //Role (ADMIN, PM, MEMBER)
        currentPath={currentPath}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* HEADER */}
        <Header
          user={auth.user}
          pageTitle={computedPageTitle}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet context={{ auth }} />
          </div>
        </main>
      </div>
    </div>
  );
}
