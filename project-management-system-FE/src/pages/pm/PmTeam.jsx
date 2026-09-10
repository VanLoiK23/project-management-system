import { useState, useEffect } from "react";
import {
  Users,
  FolderKanban,
  Search,
  Loader2,
  UserPlus,
} from "lucide-react";
import axios from "../../utils/axios.customize";
import EmptyState from "../../components/EmptyState";
import { toast } from "react-toastify";
import { AddMemberModal } from "./ProjectDashboard";

export default function PmTeam() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/projects")
      .then(async (res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setProjects(list);
        if (list.length > 0) {
          const firstId = list[0].id;
          setSelectedProjectId(firstId);
          try {
            const memberRes = await axios.get(`/projects/${firstId}/members`);
            setMembers(Array.isArray(memberRes.data) ? memberRes.data : []);
          } catch {
            setMembers([]);
          }
        } else {
          setMembers([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách dự án:", err);
        setProjects([]);
        setMembers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSelectProject = async (id) => {
    setSelectedProjectId(id);
    if (!id) {
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/projects/${id}/members`);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải thành viên:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const term = searchKeyword.toLowerCase();
    const name = (m.fullName || m.userName || "").toLowerCase();
    const email = (m.email || "").toLowerCase();
    const role = (m.role || "").toLowerCase();
    return name.includes(term) || email.includes(term) || role.includes(term);
  });

  const selectedProject = projects.find(
    (p) => String(p.id) === String(selectedProjectId)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header synchronized with project typography */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Thành viên dự án
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách nhân sự và phân quyền vai trò trong từng dự án
          </p>
        </div>

        {/* Project Selector & Add Member Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <FolderKanban className="h-4 w-4 text-slate-400" />
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              disabled={loading && projects.length === 0}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            >
              {projects.length === 0 ? (
                <option value="">Không có dự án</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            disabled={!selectedProjectId}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* Content: Loading first, EmptyState only if truly no data */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-navy-600 mb-2" />
          <span className="text-xs text-slate-500 font-medium">
            Đang tải danh sách thành viên...
          </span>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Chưa có dự án nào"
          description="Bạn cần tạo ít nhất một dự án để xem danh sách thành viên."
          actionText="Tạo dự án"
          actionLink="/pm/projects"
        />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Dự án chưa có thành viên"
          description={`Dự án "${selectedProject?.name || ""}" hiện chưa có thành viên nào tham gia.`}
          actionText="Thêm thành viên ngay"
          onAction={() => setShowAddMember(true)}
          secondaryActionText="Quay lại Tổng quan"
          secondaryActionLink="/pm/dashboard"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tên, email, vai trò..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-navy-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Tổng số: <span className="font-semibold text-slate-900">{filteredMembers.length}</span>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="pb-2.5 font-medium">Thành viên</th>
                  <th className="pb-2.5 font-medium">Email</th>
                  <th className="pb-2.5 font-medium">Vai trò</th>
                  <th className="pb-2.5 font-medium text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.userId || member.id} className="hover:bg-slate-50/70">
                    <td className="py-3 font-medium text-slate-900">
                      {member.fullName || member.userName || "Thành viên"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {member.email || "—"}
                    </td>
                    <td className="py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-navy-50 text-navy-800 text-xs font-medium border border-navy-200">
                        {member.role || "MEMBER"}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500 text-xs">
                      Hoạt động
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && selectedProject && (
        <AddMemberModal
          project={selectedProject}
          onClose={() => setShowAddMember(false)}
          onAdded={(newMember) => {
            setMembers((prev) => [...prev, newMember]);
          }}
          pushToast={(type, msg) => {
            if (type === "success") toast.success(msg);
            else toast.error(msg);
          }}
        />
      )}
    </div>
  );
}
