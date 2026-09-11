import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  CalendarRange,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const apiFetchProjects = () => axios.get("/projects").then((res) => res.data);
const apiFetchMilestones = (projectId) =>
  axios.get(`/milestones/project/${projectId}`).then((res) => res.data);
const apiCreateMilestone = (payload) =>
  axios.post("/milestones", payload).then((res) => res.data);
const apiUpdateMilestone = (id, payload) =>
  axios.put(`/milestones/${id}`, payload).then((res) => res.data);
const apiDeleteMilestone = (id) => axios.delete(`/milestones/${id}`);

const EMPTY_FORM = { name: "", startDate: "", endDate: "" };

function statusOf(m) {
  const today = new Date().toISOString().slice(0, 10);
  if (today < m.startDate) return { label: "Sắp diễn ra", cls: "bg-slate-100 text-slate-700 ring-slate-500/20" };
  if (today > m.endDate) return { label: "Đã kết thúc", cls: "bg-blue-100 text-blue-700 ring-blue-500/20" };
  return { label: "Đang diễn ra", cls: "bg-emerald-100 text-emerald-700 ring-emerald-500/20" };
}

export default function Milestones() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetchProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setProjectId(String(data[0].id));
    });
  }, []);

  const loadMilestones = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    apiFetchMilestones(projectId)
      .then(setMilestones)
      .catch((err) => setError(err.message || "Không tải được lịch trình"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  };

  const openEditForm = (m) => {
    setEditingId(m.id);
    setForm({ name: m.name, startDate: m.startDate, endDate: m.endDate });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await apiUpdateMilestone(editingId, form);
      } else {
        await apiCreateMilestone({ ...form, projectId: Number(projectId) });
      }
      setShowForm(false);
      loadMilestones();
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lịch trình này? Hành động không thể hoàn tác.")) return;
    try {
      await apiDeleteMilestone(id);
      loadMilestones();
    } catch (err) {
      setError(err.message || "Không xóa được lịch trình");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lịch trình dự án</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi các mốc/sprint quan trọng của từng dự án.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          disabled={!projectId}
          className="flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-navy-900/20 hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Thêm lịch trình
        </button>
      </div>

      <div className="mb-6">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Dự án
        </label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
      ) : milestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          <CalendarRange className="mx-auto mb-3 h-10 w-10" />
          Chưa có lịch trình nào cho dự án này.
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const status = statusOf(m);
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">{m.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {m.startDate} → {m.endDate}
                    {m.taskIds?.length > 0 && ` · ${m.taskIds.length} công việc gắn kèm`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEditForm(m)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy-600"
                    title="Sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Sửa lịch trình" : "Thêm lịch trình"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tên lịch trình
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Sprint 1 - Khởi tạo"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Bắt đầu
                  </label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Kết thúc
                  </label>
                  <input
                    required
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-rose-600">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Lưu thay đổi" : "Tạo lịch trình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
