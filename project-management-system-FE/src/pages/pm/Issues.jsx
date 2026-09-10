import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Bug,
  X,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Send,
  UserCircle2,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const apiFetchProjects = () => axios.get("/projects").then((res) => res.data);
const apiFetchMembers = (projectId) =>
  axios.get(`/projects/${projectId}/members`).then((res) => res.data);
const apiFetchIssues = (projectId, status, severity) =>
  axios
    .get(`/issues/project/${projectId}`, { params: { status, severity } })
    .then((res) => res.data);
const apiCreateIssue = (payload) =>
  axios.post("/issues", payload).then((res) => res.data);
const apiAssignIssue = (id, assigneeId) =>
  axios.post(`/issues/${id}/assign`, { assigneeId }).then((res) => res.data);
const apiUpdateStatus = (id, status) =>
  axios.patch(`/issues/${id}/status`, { status }).then((res) => res.data);
const apiUpdateSeverity = (id, severity) =>
  axios.patch(`/issues/${id}/severity`, { severity }).then((res) => res.data);
const apiFetchComments = (id) =>
  axios.get(`/issues/${id}/comments`).then((res) => res.data);
const apiAddComment = (id, content) =>
  axios.post(`/issues/${id}/comments`, { content }).then((res) => res.data);

const SEVERITY_LABEL = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", CRITICAL: "Nghiêm trọng" };
const SEVERITY_BADGE = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-500/20",
  MEDIUM: "bg-amber-100 text-amber-700 ring-amber-500/20",
  HIGH: "bg-orange-100 text-orange-700 ring-orange-500/20",
  CRITICAL: "bg-rose-100 text-rose-700 ring-rose-500/20",
};
const STATUS_LABEL = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  FIXED: "Đã sửa",
  CLOSED: "Đã đóng",
  REJECTED: "Từ chối",
};
const STATUS_BADGE = {
  NEW: "bg-slate-100 text-slate-700 ring-slate-500/20",
  IN_PROGRESS: "bg-blue-100 text-blue-700 ring-blue-500/20",
  FIXED: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
  CLOSED: "bg-slate-200 text-slate-600 ring-slate-500/20",
  REJECTED: "bg-rose-100 text-rose-700 ring-rose-500/20",
};

const EMPTY_FORM = { title: "", description: "", severity: "MEDIUM" };

export default function Issues() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [activeIssue, setActiveIssue] = useState(null); // issue đang xem bình luận
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    apiFetchProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setProjectId(String(data[0].id));
    });
  }, []);

  useEffect(() => {
    if (projectId) apiFetchMembers(projectId).then(setMembers).catch(() => setMembers([]));
  }, [projectId]);

  const loadIssues = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    apiFetchIssues(projectId, statusFilter || undefined, severityFilter || undefined)
      .then(setIssues)
      .catch((err) => setError(err.message || "Không tải được danh sách vấn đề/lỗi"))
      .finally(() => setLoading(false));
  }, [projectId, statusFilter, severityFilter]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiCreateIssue({ ...form, projectId: Number(projectId) });
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadIssues();
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (issue, assigneeId) => {
    if (!assigneeId) return;
    try {
      await apiAssignIssue(issue.id, Number(assigneeId));
      loadIssues();
    } catch (err) {
      setError(err.message || "Không phân công được");
    }
  };

  const handleStatusChange = async (issue, status) => {
    try {
      await apiUpdateStatus(issue.id, status);
      loadIssues();
    } catch (err) {
      setError(err.message || "Không cập nhật được trạng thái");
    }
  };

  const handleSeverityChange = async (issue, severity) => {
    try {
      await apiUpdateSeverity(issue.id, severity);
      loadIssues();
    } catch (err) {
      setError(err.message || "Không cập nhật được mức độ");
    }
  };

  const openComments = async (issue) => {
    setActiveIssue(issue);
    setNewComment("");
    setCommentLoading(true);
    try {
      const data = await apiFetchComments(issue.id);
      setComments(data);
    } finally {
      setCommentLoading(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      await apiAddComment(activeIssue.id, newComment.trim());
      setNewComment("");
      const data = await apiFetchComments(activeIssue.id);
      setComments(data);
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vấn đề / Lỗi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Báo cáo, phân công và theo dõi lỗi phát sinh trong dự án.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!projectId}
          className="flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-navy-900/20 hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Báo cáo lỗi mới
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Dự án</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Mức độ</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            <option value="">Tất cả</option>
            {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-500/20">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          <Bug className="mx-auto mb-3 h-10 w-10" />
          Chưa có vấn đề/lỗi nào khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tiêu đề</th>
                <th className="px-4 py-3 font-medium">Mức độ</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Người xử lý</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/60">
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate font-medium text-slate-900">{issue.title}</p>
                    <p className="truncate text-xs text-slate-500">{issue.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={issue.severity}
                      onChange={(e) => handleSeverityChange(issue, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none ${SEVERITY_BADGE[issue.severity]}`}
                    >
                      {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none ${STATUS_BADGE[issue.status]}`}
                    >
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={issue.assigneeId || ""}
                      onChange={(e) => handleAssign(issue, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    >
                      <option value="">Chưa phân công</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.userFullName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openComments(issue)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-navy-600 hover:bg-navy-50"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Bình luận
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal báo cáo lỗi mới */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Báo cáo lỗi mới</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tiêu đề</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Trang đăng nhập bị lỗi 500"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả bước tái hiện lỗi, môi trường, ảnh hưởng..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Mức độ nghiêm trọng</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                >
                  {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal bình luận */}
      {activeIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="truncate text-lg font-bold text-slate-900">{activeIssue.title}</h2>
              <button onClick={() => setActiveIssue(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {commentLoading && comments.length === 0 ? (
                <div className="flex justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Chưa có bình luận nào.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <UserCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-slate-300" />
                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold text-slate-700">{c.authorName}</p>
                      <p className="mt-0.5 text-sm text-slate-700">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={submitComment} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              />
              <button
                type="submit"
                disabled={commentLoading}
                className="flex items-center gap-1.5 rounded-xl bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
