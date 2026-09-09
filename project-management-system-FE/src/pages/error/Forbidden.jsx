import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 px-6 py-24 text-center">
      
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-rose-100 shadow-sm ring-1 ring-rose-200">
        <ShieldAlert className="h-12 w-12 text-rose-600" />
      </div>

      <h1 className="text-7xl font-extrabold tracking-tight text-slate-900 sm:text-9xl">
        403
      </h1>
      
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Không có quyền truy cập
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-500">
        Xin lỗi, bạn không có quyền truy cập vào khu vực này của hệ thống. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là sự nhầm lẫn.
      </p>
      
      <Link
        to="/"
        className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-navy-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/30 focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Quay về trang chủ
      </Link>
      
    </div>
  );
}