import { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../utils/axios.customize";
import { toast } from "react-toastify";
import {
  Mail,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  ArrowRight,
} from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await instance.post("/auth/forgot-password", { email });
      if (res && res.data.success) {
        toast.success("Yêu cầu đã gửi! Vui lòng kiểm tra email.");
        navigate("/auth");
      }
    } catch (err) {
      console.log(err);
      toast.error("Email không tồn tại trong hệ thống quản lý!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-600 to-navy-800 shadow-lg shadow-navy-900/20 lg:mx-0">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Khôi phục mật khẩu
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Đừng lo lắng, hãy nhập email tài khoản của bạn trên hệ thống Quản
              lý Dự án để nhận mã khôi phục.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6" noValidate>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer h-14 w-full rounded-2xl border border-input bg-transparent pl-11 pr-4 pb-2 pt-5 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-transparent focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                required
              />
              <label
                htmlFor="email"
                className="pointer-events-none absolute left-11 top-1/2 origin-left -translate-y-1/2 text-muted-foreground transition-all duration-200 peer-focus:left-4 peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:scale-[0.75] peer-focus:text-navy-500 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:scale-[0.75] peer-[:not(:placeholder-shown)]:text-navy-500"
              >
                Email đăng nhập
              </label>
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 text-sm font-semibold text-white shadow-lg shadow-navy-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/30 focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang gửi yêu cầu...
                </span>
              ) : (
                <>
                  Gửi yêu cầu khôi phục
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="group flex items-center gap-2 text-sm font-medium text-navy-600 transition-colors hover:text-navy-700 focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Quay lại trang đăng nhập
            </button>
          </div>
        </div>
      </div>

      <div className="relative hidden w-1/2 lg:block">
        <img
          src="https://i.pinimg.com/1200x/8d/a7/6b/8da76b175067c8f8f0a77bbb4f52d940.jpg"
          alt="Security Illustration"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/80 via-navy-800/60 to-navy-600/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/30" />

        <div className="absolute bottom-0 right-0 left-0 p-10 xl:p-14">
          <div className="flex flex-col items-end text-right">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Bảo mật tài khoản
            </h2>
            <p className="max-w-md text-sm text-navy-100/80">
              Hệ thống đảm bảo dữ liệu dự án và thông tin cá nhân của người dùng
              luôn được bảo vệ an toàn 24/7. Vui lòng không chia sẻ mã khôi phục
              cho bất kỳ ai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
