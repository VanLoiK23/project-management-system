import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  FileText,
  Download,
  History,
  UploadCloud,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  FolderKanban,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Clock,
  UserCircle2,
  Search,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const apiFetchProjects = () => axios.get("/projects").then((res) => res.data);
const apiFetchDocuments = (projectId) =>
  axios.get(`/documents/project/${projectId}`).then((res) => res.data);
const apiFetchVersions = (documentId) =>
  axios.get(`/documents/${documentId}/versions`).then((res) => res.data);
const apiDeleteDocument = (documentId) =>
  axios.delete(`/documents/${documentId}`);

function getFileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
  }
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) {
    return <ImageIcon className="h-5 w-5 text-purple-600" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="h-5 w-5 text-amber-600" />;
  }
  if (["js", "jsx", "ts", "tsx", "html", "css", "json", "sql"].includes(ext)) {
    return <FileCode className="h-5 w-5 text-blue-600" />;
  }
  return <FileText className="h-5 w-5 text-slate-600" />;
}

export default function Documents() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Upload tài liệu mới
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [uploading, setUploading] = useState(false);

  // Modal Cập nhật phiên bản mới
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [versionFile, setVersionFile] = useState(null);
  const [changeDesc, setChangeDesc] = useState("");
  const [submittingVersion, setSubmittingVersion] = useState(false);

  // Modal Lịch sử phiên bản
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Load Projects on mount
  useEffect(() => {
    apiFetchProjects()
      .then((data) => {
        setProjects(data || []);
        if (data && data.length > 0) {
          setProjectId(String(data[0].id));
        }
      })
      .catch((err) => setError(err.message || "Không thể tải danh sách dự án"));
  }, []);

  // Load Documents when projectId changes
  const loadDocuments = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    apiFetchDocuments(projectId)
      .then((data) => setDocuments(data || []))
      .catch((err) => setError(err.message || "Không thể tải danh sách tài liệu"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (doc.name || "").toLowerCase().includes(q) ||
      (doc.description || "").toLowerCase().includes(q)
    );
  });

  // Xử lý upload tài liệu mới
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Vui lòng chọn file tải lên!");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("name", docName || uploadFile.name);
    formData.append("description", docDesc);
    formData.append("file", uploadFile);

    try {
      await axios.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowUploadModal(false);
      setUploadFile(null);
      setDocName("");
      setDocDesc("");
      loadDocuments();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Lỗi khi tải lên tài liệu");
    } finally {
      setUploading(false);
    }
  };

  // Xử lý tạo phiên bản mới
  const handleNewVersionSubmit = async (e) => {
    e.preventDefault();
    if (!versionFile || !selectedDoc) {
      alert("Vui lòng chọn file cho phiên bản mới!");
      return;
    }
    setSubmittingVersion(true);
    const formData = new FormData();
    formData.append("changeDescription", changeDesc);
    formData.append("file", versionFile);

    try {
      await axios.post(`/documents/${selectedDoc.id}/versions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowNewVersionModal(false);
      setVersionFile(null);
      setChangeDesc("");
      setSelectedDoc(null);
      loadDocuments();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Lỗi khi cập nhật phiên bản");
    } finally {
      setSubmittingVersion(false);
    }
  };

  // Mở modal lịch sử phiên bản
  const openHistoryModal = (doc) => {
    setSelectedDoc(doc);
    setShowHistoryModal(true);
    setLoadingVersions(true);
    apiFetchVersions(doc.id)
      .then((data) => setVersions(data || []))
      .catch((err) => alert(err.message || "Không thể tải lịch sử phiên bản"))
      .finally(() => setLoadingVersions(false));
  };

  // Tải file tài liệu
  const handleDownload = (versionId, fileName = "document") => {
    axios
      .get(`/documents/versions/${versionId}/download`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => alert(err.message || "Lỗi khi tải file"));
  };

  // Xóa tài liệu
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này và toàn bộ các phiên bản của nó?")) {
      return;
    }
    try {
      await apiDeleteDocument(docId);
      loadDocuments();
    } catch (err) {
      alert(err.message || "Lỗi khi xóa tài liệu");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Tài liệu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Lưu trữ tài liệu dự án, kiểm soát phiên bản và chia sẻ an toàn cho thành viên
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tài liệu..."
              className="h-10 w-44 sm:w-52 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
            />
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <FolderKanban className="h-4 w-4 text-slate-400" />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            disabled={!projectId}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tải lên tài liệu
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Document Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Đang tải danh sách tài liệu...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <UploadCloud className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Dự án chưa có tài liệu nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Nhấn nút &ldquo;Tải lên tài liệu&rdquo; phía trên để thêm tài liệu đầu tiên cho dự án này.
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Không tìm thấy tài liệu phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Không có tài liệu nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Tên tài liệu</th>
                  <th className="py-3.5 px-6">Phiên bản</th>
                  <th className="py-3.5 px-6">Người đăng</th>
                  <th className="py-3.5 px-6">Ngày cập nhật</th>
                  <th className="py-3.5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                          {getFileIcon(doc.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-snug">{doc.name}</p>
                          {doc.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        v{doc.currentVersionNumber || 1}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <UserCircle2 className="h-4 w-4 text-slate-400" />
                        <span>{doc.uploadedByName || "Thành viên"}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-500">
                      {formatDate(doc.updatedAt || doc.createdAt)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Nút Tải xuống phiên bản mới nhất */}
                        <button
                          type="button"
                          onClick={() => handleDownload(doc.currentVersionId, doc.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Tải về bản mới nhất"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {/* Nút Cập nhật phiên bản mới */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowNewVersionModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Tải lên phiên bản mới"
                        >
                          <UploadCloud className="h-4 w-4" />
                        </button>

                        {/* Nút Lịch sử phiên bản */}
                        <button
                          type="button"
                          onClick={() => openHistoryModal(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Lịch sử phiên bản"
                        >
                          <History className="h-4 w-4" />
                        </button>

                        {/* Nút Xóa */}
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Tải lên tài liệu mới */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Tải lên tài liệu mới</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn file tài liệu *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!docName) setDocName(f.name);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên hiển thị tài liệu
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Nhập tên tài liệu (hoặc để trống lấy theo tên file)"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả / Ghi chú
                </label>
                <textarea
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  rows={3}
                  placeholder="Ghi chú nội dung tài liệu..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Tải lên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cập nhật phiên bản mới */}
      {showNewVersionModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900">Cập nhật phiên bản mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tài liệu: <span className="font-semibold text-slate-700">{selectedDoc.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewVersionModal(false);
                  setSelectedDoc(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleNewVersionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn file phiên bản mới *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả thay đổi (Changelog)
                </label>
                <textarea
                  value={changeDesc}
                  onChange={(e) => setChangeDesc(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Cập nhật điều khoản hợp đồng mới, sửa lỗi số liệu bảng 2..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewVersionModal(false);
                    setSelectedDoc(null);
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingVersion}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  {submittingVersion && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu phiên bản mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Lịch sử phiên bản */}
      {showHistoryModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900">Lịch sử phiên bản</h3>
                  <p className="text-xs text-slate-500">
                    Tài liệu: <span className="font-semibold text-slate-700">{selectedDoc.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedDoc(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingVersions ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs">Đang tải lịch sử phiên bản...</p>
                </div>
              ) : versions.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">Chưa có thông tin phiên bản</p>
              ) : (
                <div className="space-y-4">
                  {versions.map((ver, idx) => (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-xl border transition-all ${
                        idx === 0
                          ? "border-emerald-200 bg-emerald-50/30 ring-1 ring-emerald-500/10"
                          : "border-slate-100 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              idx === 0
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            v{ver.versionNumber}
                          </span>
                          {idx === 0 && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Hiện hành
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownload(ver.id, `${selectedDoc.name}_v${ver.versionNumber}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Tải bản v{ver.versionNumber}
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 mt-2 font-medium">
                        {ver.changeDescription || "Không có ghi chú thay đổi"}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ver.createdAt)}
                        </span>
                        <span>Đăng bởi: {ver.editedByName || "Thành viên"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}