import { useContext, useState } from "react";
import { toast } from "react-toastify";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Briefcase,
} from "lucide-react";
import cityscape from "../../../public/images/cityscape.jpg";
import axios from "../../utils/axios.customize";
import { AuthContext } from "../../components/context/auth.context";
import { useNavigate } from "react-router-dom";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("");
  };

  const validateLogin = () => {
    if (!email.trim() || !password.trim()) {
      return "Vui lòng nhập đầy đủ email/tên đăng nhập và mật khẩu.";
    }
    return null;
  };

  const validateRegister = () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !role) {
      return "Vui lòng nhập đầy đủ thông tin để đăng ký.";
    }
    if (fullName.trim().length < 2) {
      return "Họ và tên phải có ít nhất 2 ký tự.";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Email không đúng định dạng.";
    }
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = isLogin ? validateLogin() : validateRegister();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post("auth/login", {
          usernameOrEmail: email.trim(),
          password,
        });

        if (response && response.data) {
          const user = response.data.user;
          localStorage.setItem("access_token", response.data.token.accessToken);

          toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName}.`);

          setAuth({
            isAuthenticated: true,
            user,
          });

          console.log(localStorage.getItem("access_token"));

          let targetPath = "/auth";

          if (user.role === "ADMIN") {
            targetPath = "/admin/dashboard";
          } else if (user.role === "PM") {
            targetPath = "/pm/dashboard";
          } else if (user.role === "MEMBER" || user.role === "DEV") {
            targetPath = "/member/tasks";
          }

          navigate(targetPath);
        }
      } else {
        const response = await axios.post("auth/register", {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        });

        if (response && response.data) {
          toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
          resetForm();
          setIsLogin(true);
        }
      }
    } catch (err) {
      if (err.message && typeof err.message === "object") {
        Object.values(err.message).forEach((errorMessage) => {
          toast.error(errorMessage);
        });
      } else {
        toast.error(err.message || "Đã xảy ra lỗi hệ thống!");
      }
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      <div
        className={`absolute left-0 top-0 z-20 hidden h-full w-1/2 transition-transform duration-700 ease-in-out lg:block ${
          isLogin ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <img
          src={cityscape}
          alt="Phong cảnh thành phố hiện đại"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/80 via-navy-800/60 to-navy-600/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/30" />

        <div className="absolute bottom-0 left-0 p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                Hệ thống Quản lý Dự án
              </p>
              <p className="text-sm text-navy-100/80">
                Nền tảng quản lý công việc chuyên nghiệp
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`absolute left-0 top-0 z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-background px-6 py-12 sm:px-10 lg:left-1/2 lg:w-1/2 lg:px-16 xl:px-24 transition-transform duration-700 ease-in-out ${
          isLogin
            ? "translate-x-0 lg:translate-x-0"
            : "translate-x-0 lg:-translate-x-full"
        }`}
      >
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin
                ? "Đăng nhập để tiếp tục làm việc với dự án của bạn"
                : "Điền thông tin bên dưới để đăng ký tài khoản"}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isLogin ? "Đăng nhập thất bại" : "Đăng ký thất bại"}
                </p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {!isLogin && (
              <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder=" "
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="peer h-14 w-full rounded-2xl border border-input bg-transparent pl-11 pr-4 pb-2 pt-5 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-transparent focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                />
                <label
                  htmlFor="fullName"
                  className="pointer-events-none absolute left-11 top-1/2 origin-left -translate-y-1/2 text-muted-foreground transition-all duration-200 peer-focus:left-4 peer-focus:top-2 peer-focus:-translate-y-2 peer-focus:scale-[0.75] peer-focus:text-navy-500 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:scale-[0.75] peer-[:not(:placeholder-shown)]:text-navy-500"
                >
                  Họ và tên
                </label>
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}

            <div className="relative">
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer h-14 w-full rounded-2xl border border-input bg-transparent pl-11 pr-4 pb-2 pt-5 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-transparent focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />
              <label
                htmlFor="email"
                className="pointer-events-none absolute left-11 top-1/2 origin-left -translate-y-1/2 text-muted-foreground transition-all duration-200 peer-focus:left-4 peer-focus:top-2 peer-focus:-translate-y-2 peer-focus:scale-[0.75] peer-focus:text-navy-500 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:scale-[0.75] peer-[:not(:placeholder-shown)]:text-navy-500"
              >
                {isLogin ? "Email hoặc Tên đăng nhập" : "Email"}
              </label>
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer h-14 w-full rounded-2xl border border-input bg-transparent pl-11 pr-11 pb-2 pt-5 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-transparent focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              />
              <label
                htmlFor="password"
                className="pointer-events-none absolute left-11 top-1/2 origin-left -translate-y-1/2 text-muted-foreground transition-all duration-200 peer-focus:left-4 peer-focus:top-2 peer-focus:-translate-y-2 peer-focus:scale-[0.75] peer-focus:text-navy-500 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:scale-[0.75] peer-[:not(:placeholder-shown)]:text-navy-500"
              >
                Mật khẩu
              </label>
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {!isLogin && (
              <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="peer h-14 w-full appearance-none rounded-2xl border border-input bg-transparent pl-11 pr-11 pb-2 pt-5 text-sm text-foreground shadow-sm outline-none transition-all focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                >
                  <option value="" disabled hidden>
                    Chọn vai trò của bạn
                  </option>
                  <option value="PM">Quản lý dự án (PM)</option>
                  <option value="MEMBER">Thành viên dự án (Member)</option>
                </select>

                <label
                  htmlFor="role"
                  className={`pointer-events-none absolute left-11 origin-left transition-all duration-200 ${
                    role
                      ? "top-2 -translate-y-2 scale-[0.75] text-navy-500 left-4"
                      : "top-1/2 -translate-y-1/2 text-muted-foreground"
                  } peer-focus:left-4 peer-focus:top-2 peer-focus:-translate-y-2 peer-focus:scale-[0.75] peer-focus:text-navy-500`}
                >
                  Vai trò
                </label>
                <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-700 hover:underline focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                  onClick={() => {
                    navigate("/forgot-password");
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 text-sm font-semibold text-white shadow-lg shadow-navy-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/30 focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-2 disabled:hover:shadow-lg"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isLogin ? "Đang đăng nhập..." : "Đang xử lý..."}
                </span>
              ) : (
                <>
                  {isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>
              {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-semibold text-navy-600 transition-colors hover:text-navy-700 hover:underline focus:outline-none"
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground lg:justify-start">
            <ShieldCheck className="h-4 w-4 text-navy-500" />
            <span>Kết nối được mã hóa và bảo mật</span>
          </div>
        </div>
      </div>
    </div>
  );
}
