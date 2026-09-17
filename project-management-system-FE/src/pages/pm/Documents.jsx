import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Image as ImageIcon,
  File,
  Download,
  History,
  UploadCloud,
  Trash2,
  X,
  Loader2,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Search,
  MoreVertical,
  Pencil,
  Move,
  Shield,
  Globe2,
  Users,
  RotateCcw,
  Eye,
  CalendarDays,
  UserCircle2,
  HardDrive,
  Lock,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import axios from "../../utils/axios.customize";

const apiFetchProjects = () =>
  axios.get("/projects").then((res) => res.data);

const apiFetchDocuments = (projectId, folderId = null) =>
  axios
    .get(`/documents/project/${projectId}`, {
      params: folderId ? { folderId } : {},
    })
    .then((res) => res.data);

const apiFetchFolders = (projectId) =>
  axios
    .get(`/documents/folders/project/${projectId}`)
    .then((res) => res.data);

const apiCreateFolder = (projectId, name, parentId = null) =>
  axios
    .post("/documents/folders", null, {
      params: {
        projectId,
        name,
        ...(parentId ? { parentId } : {}),
      },
    })
    .then((res) => res.data);

const apiDeleteFolder = (folderId) =>
  axios.delete(`/documents/folders/${folderId}`);

const apiUploadDocument = (formData) =>
  axios
    .post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

const apiRenameDocument = (documentId, name) =>
  axios
    .put(`/documents/${documentId}/name`, { name })
    .then((res) => res.data);

const apiMoveDocument = (documentId, folderId) =>
  axios
    .put(`/documents/${documentId}/move`, null, {
      params: folderId ? { folderId } : {},
    })
    .then((res) => res.data);

const apiUpdateVisibility = (documentId, visibility) =>
  axios
    .put(`/documents/${documentId}/visibility`, { visibility })
    .then((res) => res.data);

const apiDeleteDocument = (documentId) =>
  axios.delete(`/documents/${documentId}`);

const apiFetchVersions = (documentId) =>
  axios
    .get(`/documents/${documentId}/versions`)
    .then((res) => res.data);

const apiUploadVersion = (documentId, formData) =>
  axios
    .post(`/documents/${documentId}/versions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

const apiRestoreVersion = (documentId, versionId) =>
  axios
    .post(`/documents/${documentId}/versions/${versionId}/restore`)
    .then((res) => res.data);

const apiFetchPermissions = (documentId) =>
  axios
    .get(`/documents/${documentId}/permissions`)
    .then((res) => res.data);

const apiGrantPermission = (documentId, userId, permissionType) =>
  axios
    .post(`/documents/${documentId}/permissions`, {
      userId,
      permissionType,
    })
    .then((res) => res.data);

const apiRevokePermission = (documentId, userId) =>
  axios.delete(`/documents/${documentId}/permissions/${userId}`);

const apiFetchProjectMembers = (projectId) =>
  axios
    .get(`/projects/${projectId}/members`, {
      params: {
        page: 0,
        size: 100,
      },
    })
    .then((res) => res.data);

function getApiError(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getFileExtension(name = "") {
  const cleanName = name.split("?")[0];
  const parts = cleanName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getFileIcon(name = "", className = "h-5 w-5") {
  const ext = getFileExtension(name);

  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className={`${className} text-amber-600`} />;
  }

  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "java",
      "kt",
      "py",
      "html",
      "css",
      "json",
      "sql",
      "xml",
    ].includes(ext)
  ) {
    return <FileCode className={`${className} text-blue-600`} />;
  }

  if (
    ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)
  ) {
    return <ImageIcon className={`${className} text-purple-600`} />;
  }

  if (ext === "pdf") {
    return <FileText className={`${className} text-red-600`} />;
  }

  if (["doc", "docx"].includes(ext)) {
    return <FileText className={`${className} text-blue-700`} />;
  }

  return <File className={`${className} text-slate-500`} />;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "-";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
}

function formatDate(date) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function formatDateTime(date) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function getPermissionLabel(permissionType) {
  const value = String(permissionType || "").toUpperCase();

  if (value === "VIEW") return "Xem";
  if (value === "DOWNLOAD") return "Tải xuống";

  return value;
}

function buildFolderTree(folders) {
  const map = new Map();

  folders.forEach((folder) => {
    map.set(String(folder.id), {
      ...folder,
      children: [],
    });
  });

  const roots = [];

  folders.forEach((folder) => {
    const current = map.get(String(folder.id));

    if (folder.parentId && map.has(String(folder.parentId))) {
      map
        .get(String(folder.parentId))
        .children.push(current);
    } else {
      roots.push(current);
    }
  });

  const sortTree = (items) => {
    items.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "vi")
    );

    items.forEach((item) => {
      sortTree(item.children);
    });
  };

  sortTree(roots);

  return roots;
}

function Modal({ title, children, onClose, width = "max-w-lg" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${width} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-72px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function FolderTreeItem({
  folder,
  level,
  selectedFolderId,
  onSelect,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = folder.children?.length > 0;

  const selected =
    selectedFolderId !== null &&
    String(selectedFolderId) === String(folder.id);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 transition ${
          selected
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((value) => !value)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
            hasChildren
              ? "hover:bg-slate-200"
              : "cursor-default"
          }`}
        >
          {hasChildren &&
            (expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>

        <button
          type="button"
          onClick={() => onSelect(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {selected ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-600" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-500" />
          )}

          <span className="truncate text-sm font-medium">
            {folder.name}
          </span>

          <span className="ml-auto text-xs text-slate-400">
            {folder.documentCount || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(folder)}
          className="hidden rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 group-hover:block"
          title="Xóa thư mục"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded &&
        hasChildren &&
        folder.children.map((child) => (
          <FolderTreeItem
            key={child.id}
            folder={child}
            level={level + 1}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

function EmptyState({ searchQuery, selectedFolderId, onUpload }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <FileText className="h-8 w-8 text-slate-400" />
      </div>

      <h3 className="text-lg font-semibold text-slate-800">
        {searchQuery
          ? "Không tìm thấy tài liệu"
          : selectedFolderId
          ? "Thư mục này chưa có tài liệu"
          : "Chưa có tài liệu"}
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {searchQuery
          ? "Hãy thử thay đổi từ khóa tìm kiếm."
          : "Tải tài liệu đầu tiên lên để bắt đầu quản lý tài liệu dự án."}
      </p>

      {!searchQuery && (
        <button
          type="button"
          onClick={onUpload}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <UploadCloud className="h-4 w-4" />
          Tải tài liệu lên
        </button>
      )}
    </div>
  );
}

export default function Documents() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);

  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [toast, setToast] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderParentId, setFolderParentId] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDoc, setRenameDoc] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDoc, setMoveDoc] = useState(null);
  const [moveFolderId, setMoveFolderId] = useState("");
  const [moving, setMoving] = useState(false);

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionFile, setVersionFile] = useState(null);
  const [changeDesc, setChangeDesc] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [submittingVersion, setSubmittingVersion] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState(null);

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionDoc, setPermissionDoc] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [savingPermission, setSavingPermission] = useState(null);

  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [visibilityDoc, setVisibilityDoc] = useState(null);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiFetchProjects();
      const list = extractList(data);

      setProjects(list);

      if (list.length > 0 && !projectId) {
        setProjectId(String(list[0].id));
      }
    } catch (err) {
      setError(getApiError(err, "Không thể tải danh sách dự án"));
    }
  }, [projectId]);

  const loadFolders = useCallback(async () => {
    if (!projectId) return;

    setLoadingFolders(true);

    try {
      const data = await apiFetchFolders(projectId);
      setFolders(extractList(data));
    } catch (err) {
      setError(getApiError(err, "Không thể tải danh sách thư mục"));
    } finally {
      setLoadingFolders(false);
    }
  }, [projectId]);

  const loadDocuments = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError("");

    try {
      const data = await apiFetchDocuments(
        projectId,
        selectedFolderId
      );

      setDocuments(extractList(data));
    } catch (err) {
      setError(getApiError(err, "Không thể tải danh sách tài liệu"));
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedFolderId]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!projectId) return;

    setSelectedFolderId(null);
    loadFolders();
  }, [projectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const folderTree = useMemo(
    () => buildFolderTree(folders),
    [folders]
  );

  const currentFolder = useMemo(() => {
    if (!selectedFolderId) return null;

    return folders.find(
      (folder) =>
        String(folder.id) === String(selectedFolderId)
    );
  }, [folders, selectedFolderId]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return documents;

    return documents.filter((doc) => {
      return (
        String(doc.name || "").toLowerCase().includes(query) ||
        String(doc.description || "")
          .toLowerCase()
          .includes(query) ||
        String(doc.uploadedByName || "")
          .toLowerCase()
          .includes(query) ||
        String(doc.folderName || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [documents, searchQuery]);

  const stats = useMemo(() => {
    const publicCount = documents.filter(
      (doc) =>
        String(doc.visibility || "").toUpperCase() === "PUBLIC"
    ).length;

    const privateCount = documents.filter(
      (doc) =>
        String(doc.visibility || "").toUpperCase() === "PRIVATE"
    ).length;

    return {
      documents: documents.length,
      folders: folders.length,
      publicCount,
      privateCount,
    };
  }, [documents, folders]);

  const refreshAll = async () => {
    await Promise.all([loadDocuments(), loadFolders()]);
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setDocName("");
    setDocDesc("");
    setUploadFolderId(
      selectedFolderId ? String(selectedFolderId) : ""
    );
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();

    if (!projectId) {
      showToast("error", "Vui lòng chọn dự án.");
      return;
    }

    if (!uploadFile) {
      showToast("error", "Vui lòng chọn file.");
      return;
    }

    setUploading(true);

    const formData = new FormData();

    formData.append("projectId", projectId);

    if (uploadFolderId) {
      formData.append("folderId", uploadFolderId);
    }

    formData.append(
      "name",
      docName.trim() || uploadFile.name
    );

    formData.append("description", docDesc.trim());
    formData.append("file", uploadFile);

    try {
      await apiUploadDocument(formData);

      setShowUploadModal(false);
      setUploadFile(null);
      setDocName("");
      setDocDesc("");

      await refreshAll();

      showToast(
        "success",
        "Tải tài liệu lên thành công."
      );
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
    
      showToast(
        "error",
        getApiError(err, "Không thể tải tài liệu lên.")
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();

    if (!folderName.trim()) {
      showToast("error", "Vui lòng nhập tên thư mục.");
      return;
    }

    setCreatingFolder(true);

    try {
      await apiCreateFolder(
        projectId,
        folderName.trim(),
        folderParentId || null
      );

      setShowFolderModal(false);
      setFolderName("");
      setFolderParentId("");

      await loadFolders();

      showToast(
        "success",
        "Tạo thư mục thành công."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(err, "Không thể tạo thư mục.")
      );
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa thư mục "${folder.name}"?`
    );

    if (!confirmed) return;

    try {
      await apiDeleteFolder(folder.id);

      if (
        selectedFolderId &&
        String(selectedFolderId) === String(folder.id)
      ) {
        setSelectedFolderId(null);
      }

      await refreshAll();

      showToast(
        "success",
        "Xóa thư mục thành công."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(
          err,
          "Không thể xóa thư mục. Hãy kiểm tra thư mục có còn tài liệu hay không."
        )
      );
    }
  };

  const openRenameModal = (doc) => {
    setRenameDoc(doc);
    setRenameValue(doc.name || "");
    setShowRenameModal(true);
  };

  const handleRename = async (event) => {
    event.preventDefault();

    if (!renameDoc || !renameValue.trim()) {
      showToast("error", "Tên tài liệu không được để trống.");
      return;
    }

    setRenaming(true);

    try {
      await apiRenameDocument(
        renameDoc.id,
        renameValue.trim()
      );

      setShowRenameModal(false);
      setRenameDoc(null);
      setRenameValue("");

      await loadDocuments();

      showToast(
        "success",
        "Đổi tên tài liệu thành công."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(err, "Không thể đổi tên tài liệu.")
      );
    } finally {
      setRenaming(false);
    }
  };

  const openMoveModal = (doc) => {
    setMoveDoc(doc);
    setMoveFolderId(
      doc.folderId ? String(doc.folderId) : ""
    );
    setShowMoveModal(true);
  };

  const handleMoveDocument = async (event) => {
    event.preventDefault();

    if (!moveDoc) return;

    setMoving(true);

    try {
      await apiMoveDocument(
        moveDoc.id,
        moveFolderId || null
      );

      setShowMoveModal(false);
      setMoveDoc(null);
      setMoveFolderId("");

      await refreshAll();

      showToast(
        "success",
        "Di chuyển tài liệu thành công."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(err, "Không thể di chuyển tài liệu.")
      );
    } finally {
      setMoving(false);
    }
  };

  const openVersionModal = (doc) => {
    setSelectedDoc(doc);
    setVersionFile(null);
    setChangeDesc("");
    setShowVersionModal(true);
  };

  const handleNewVersionSubmit = async (event) => {
    event.preventDefault();

    if (!selectedDoc || !versionFile) {
      showToast(
        "error",
        "Vui lòng chọn file cho phiên bản mới."
      );
      return;
    }

    setSubmittingVersion(true);

    const formData = new FormData();

    formData.append(
      "changeDescription",
      changeDesc.trim()
    );

    formData.append("file", versionFile);

    try {
      await apiUploadVersion(
        selectedDoc.id,
        formData
      );

      setShowVersionModal(false);
      setSelectedDoc(null);
      setVersionFile(null);
      setChangeDesc("");

      await loadDocuments();

      showToast(
        "success",
        "Tạo phiên bản mới thành công."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(
          err,
          "Không thể tạo phiên bản mới."
        )
      );
    } finally {
      setSubmittingVersion(false);
    }
  };

  const openHistoryModal = async (doc) => {
    setSelectedDoc(doc);
    setVersions([]);
    setShowHistoryModal(true);
    setLoadingVersions(true);

    try {
      const data = await apiFetchVersions(doc.id);
      setVersions(extractList(data));
    } catch (err) {
      showToast(
        "error",
        getApiError(
          err,
          "Không thể tải lịch sử phiên bản."
        )
      );
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (version) => {
    if (!selectedDoc) return;

    const confirmed = window.confirm(
      `Khôi phục phiên bản v${version.versionNumber}?`
    );

    if (!confirmed) return;

    setRestoringVersionId(version.id);

    try {
      await apiRestoreVersion(
        selectedDoc.id,
        version.id
      );

      const data = await apiFetchVersions(
        selectedDoc.id
      );

      setVersions(extractList(data));

      await loadDocuments();

      showToast(
        "success",
        `Đã khôi phục phiên bản v${version.versionNumber}.`
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(
          err,
          "Không thể khôi phục phiên bản."
        )
      );
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleDownload = async (
    versionId,
    fileName = "document"
  ) => {
    try {
      const response = await axios.get(
        `/documents/versions/${versionId}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers["content-type"] ||
            "application/octet-stream",
        }
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(
        "error",
        getApiError(err, "Không thể tải file.")
      );
    }
  };

  const handleDeleteDocument = async (doc) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tài liệu "${doc.name}" và toàn bộ lịch sử phiên bản?`
    );

    if (!confirmed) return;

    try {
      await apiDeleteDocument(doc.id);

      await refreshAll();

      showToast(
        "success",
        "Xóa tài liệu thành công."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(err, "Không thể xóa tài liệu.")
      );
    }
  };

  const openVisibilityModal = (doc) => {
    setVisibilityDoc(doc);
    setShowVisibilityModal(true);
  };

  const handleChangeVisibility = async (
    visibility
  ) => {
    if (!visibilityDoc) return;

    setUpdatingVisibility(true);

    try {
      await apiUpdateVisibility(
        visibilityDoc.id,
        visibility
      );

      setShowVisibilityModal(false);
      setVisibilityDoc(null);

      await loadDocuments();

      showToast(
        "success",
        visibility === "PUBLIC"
          ? "Tài liệu đã được chuyển sang công khai."
          : "Tài liệu đã được chuyển sang bảo mật."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(
          err,
          "Không thể thay đổi quyền truy cập."
        )
      );
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const openPermissionModal = async (doc) => {
    setPermissionDoc(doc);
    setPermissionSearch("");
    setPermissions([]);
    setShowPermissionModal(true);
    setLoadingPermissions(true);

    try {
      const data = await apiFetchPermissions(
        doc.id
      );

      setPermissions(extractList(data));
    } catch (err) {
      showToast(
        "error",
        getApiError(
          err,
          "Không thể tải danh sách phân quyền."
        )
      );
    } finally {
      setLoadingPermissions(false);
    }
  };

  const projectMembers = useMemo(() => {
    return [];
  }, []);

  const loadMembersForPermissions = useCallback(
    async () => {
      if (!projectId) return [];

      try {
        const data = await apiFetchProjectMembers(
          projectId
        );

        return extractList(data).map((member) => ({
          id:
            member.userId ??
            member.id ??
            member.user?.id,
          name:
            member.userName ??
            member.fullName ??
            member.user?.fullName ??
            "Người dùng",
          email:
            member.email ??
            member.userEmail ??
            member.user?.email ??
            "",
        }));
      } catch {
        return [];
      }
    },
    [projectId]
  );

  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!showPermissionModal) return;

    loadMembersForPermissions().then(setMembers);
  }, [
    showPermissionModal,
    loadMembersForPermissions,
  ]);

  const hasPermission = (userId, type) => {
    return permissions.some(
      (permission) =>
        String(permission.userId) === String(userId) &&
        String(permission.permissionType).toUpperCase() ===
          type
    );
  };

  const togglePermission = async (
    member,
    permissionType
  ) => {
    if (!permissionDoc) return;

    const exists = hasPermission(
      member.id,
      permissionType
    );

    setSavingPermission(
      `${member.id}-${permissionType}`
    );

    try {
      if (exists) {
        await apiRevokePermission(
          permissionDoc.id,
          member.id
        );
      } else {
        await apiGrantPermission(
          permissionDoc.id,
          member.id,
          permissionType
        );
      }

      const data = await apiFetchPermissions(
        permissionDoc.id
      );

      setPermissions(extractList(data));

      showToast(
        "success",
        exists
          ? "Đã thu hồi quyền."
          : "Đã cấp quyền."
      );
    } catch (err) {
      showToast(
        "error",
        getApiError(
          err,
          "Không thể cập nhật quyền."
        )
      );
    } finally {
      setSavingPermission(null);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();

    if (!q) return members;

    return members.filter(
      (member) =>
        String(member.name || "")
          .toLowerCase()
          .includes(q) ||
        String(member.email || "")
          .toLowerCase()
          .includes(q)
    );
  }, [members, permissionSearch]);

  const renderFolderOptions = (
    tree,
    level = 0
  ) => {
    return tree.flatMap((folder) => [
      <option
        key={folder.id}
        value={folder.id}
      >
        {"— ".repeat(level)}
        {folder.name}
      </option>,
      ...renderFolderOptions(
        folder.children || [],
        level + 1
      ),
    ]);
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 pb-12">
      {toast && (
        <div className="fixed right-6 top-6 z-[70]">
          <div
            className={`flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <span className="text-sm font-medium">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <HardDrive className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Quản lý tài liệu
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Kho lưu trữ tài liệu, phân quyền và quản lý
                  lịch sử phiên bản của dự án.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={projectId}
              onChange={(event) =>
                setProjectId(event.target.value)
              }
              className="min-w-[240px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {projects.length === 0 && (
                <option value="">
                  Không có dự án
                </option>
              )}

              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setFolderParentId(
                  selectedFolderId
                    ? String(selectedFolderId)
                    : ""
                );
                setFolderName("");
                setShowFolderModal(true);
              }}
              disabled={!projectId}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FolderPlus className="h-4 w-4" />
              Tạo thư mục
            </button>

            <button
              type="button"
              onClick={openUploadModal}
              disabled={!projectId}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" />
              Tải tài liệu
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Tổng tài liệu
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.documents}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Thư mục
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.folders}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3">
              <Folder className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Công khai
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.publicCount}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <Globe2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Bảo mật
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.privateCount}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Kho tài liệu
            </h2>

            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <span>Kho gốc</span>

              {currentFolder && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-medium text-slate-700">
                    {currentFolder.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Tìm tài liệu..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Thư mục
              </h3>

              {loadingFolders && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() =>
                  setSelectedFolderId(null)
                }
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  selectedFolderId === null
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {selectedFolderId === null ? (
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                ) : (
                  <Folder className="h-4 w-4 text-amber-500" />
                )}

                <span>Kho gốc</span>

                <span className="ml-auto text-xs text-slate-400">
                  {documents.length}
                </span>
              </button>

              {folderTree.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  selectedFolderId={
                    selectedFolderId
                  }
                  onSelect={(id) =>
                    setSelectedFolderId(id)
                  }
                  onDelete={handleDeleteFolder}
                />
              ))}
            </div>

            {folders.length === 0 &&
              !loadingFolders && (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4 text-center">
                  <Folder className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-2 text-xs text-slate-500">
                    Chưa có thư mục.
                  </p>
                </div>
              )}
          </aside>

          <main className="min-w-0">
            {error && (
              <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    loadDocuments();
                  }}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[480px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  <p className="mt-3 text-sm text-slate-500">
                    Đang tải tài liệu...
                  </p>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                searchQuery={searchQuery}
                selectedFolderId={selectedFolderId}
                onUpload={openUploadModal}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">
                        Tài liệu
                      </th>
                      <th className="px-4 py-3">
                        Thư mục
                      </th>
                      <th className="px-4 py-3">
                        Quyền truy cập
                      </th>
                      <th className="px-4 py-3">
                        Phiên bản
                      </th>
                      <th className="px-4 py-3">
                        Cập nhật
                      </th>
                      <th className="px-4 py-3 text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredDocuments.map(
                      (doc) => {
                        const visibility =
                          String(
                            doc.visibility || "PUBLIC"
                          ).toUpperCase();

                        const fileName =
                          doc.currentFileName ||
                          doc.name ||
                          "document";

                        return (
                          <tr
                            key={doc.id}
                            className="group transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                  {getFileIcon(
                                    fileName,
                                    "h-5 w-5"
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className="truncate font-semibold text-slate-800"
                                    title={doc.name}
                                  >
                                    {doc.name}
                                  </p>

                                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                    <span>
                                      {formatBytes(
                                        doc.currentFileSize
                                      )}
                                    </span>

                                    <span>•</span>

                                    <span>
                                      {doc.currentContentType ||
                                        getFileExtension(
                                          fileName
                                        ).toUpperCase() ||
                                        "FILE"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Folder className="h-4 w-4 text-amber-500" />

                                <span className="max-w-[160px] truncate">
                                  {doc.folderName ||
                                    "Kho gốc"}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  openVisibilityModal(
                                    doc
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  visibility ===
                                  "PUBLIC"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {visibility ===
                                "PUBLIC" ? (
                                  <Globe2 className="h-3.5 w-3.5" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5" />
                                )}

                                {visibility ===
                                "PUBLIC"
                                  ? "Công khai"
                                  : "Bảo mật"}
                              </button>
                            </td>

                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                <History className="h-3.5 w-3.5" />
                                v
                                {doc.currentVersionNumber ||
                                  1}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-700">
                                    {formatDate(
                                      doc.updatedAt
                                    )}
                                  </p>

                                  <p className="mt-0.5 truncate text-xs text-slate-400">
                                    {doc.uploadedByName ||
                                      "Không xác định"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownload(
                                      doc.currentVersionId,
                                      fileName
                                    )
                                  }
                                  title="Tải xuống"
                                  className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Download className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openVersionModal(
                                      doc
                                    )
                                  }
                                  title="Tạo phiên bản mới"
                                  className="rounded-lg p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-600"
                                >
                                  <UploadCloud className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openHistoryModal(
                                      doc
                                    )
                                  }
                                  title="Lịch sử phiên bản"
                                  className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                                >
                                  <History className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openPermissionModal(
                                      doc
                                    )
                                  }
                                  title="Phân quyền"
                                  className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                >
                                  <Users className="h-4 w-4" />
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      const menu =
                                        event.currentTarget
                                          .nextElementSibling;

                                      document
                                        .querySelectorAll(
                                          "[data-document-menu]"
                                        )
                                        .forEach(
                                          (element) => {
                                            if (
                                              element !==
                                              menu
                                            ) {
                                              element.classList.add(
                                                "hidden"
                                              );
                                            }
                                          }
                                        );

                                      menu.classList.toggle(
                                        "hidden"
                                      );
                                    }}
                                    title="Thêm"
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>

                                  <div
                                    data-document-menu
                                    className="absolute right-0 top-10 z-20 hidden w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        openRenameModal(
                                          doc
                                        );
                                        document
                                          .querySelectorAll(
                                            "[data-document-menu]"
                                          )
                                          .forEach(
                                            (element) =>
                                              element.classList.add(
                                                "hidden"
                                              )
                                          );
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      Đổi tên
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        openMoveModal(
                                          doc
                                        );
                                        document
                                          .querySelectorAll(
                                            "[data-document-menu]"
                                          )
                                          .forEach(
                                            (element) =>
                                              element.classList.add(
                                                "hidden"
                                              )
                                          );
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <Move className="h-4 w-4" />
                                      Di chuyển
                                    </button>

                                    <div className="my-1 border-t border-slate-100" />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteDocument(
                                          doc
                                        );
                                        document
                                          .querySelectorAll(
                                            "[data-document-menu]"
                                          )
                                          .forEach(
                                            (element) =>
                                              element.classList.add(
                                                "hidden"
                                              )
                                          );
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Xóa tài liệu
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>

      {showUploadModal && (
        <Modal
          title="Tải tài liệu lên"
          onClose={() =>
            !uploading &&
            setShowUploadModal(false)
          }
        >
          <form
            onSubmit={handleUploadSubmit}
            className="space-y-5 p-6"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                File tài liệu
              </label>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                <UploadCloud className="h-9 w-9 text-blue-500" />

                <span className="mt-3 text-sm font-semibold text-slate-700">
                  {uploadFile
                    ? uploadFile.name
                    : "Chọn file để tải lên"}
                </span>

                <span className="mt-1 text-xs text-slate-400">
                  Hỗ trợ các định dạng file theo cấu hình
                  Cloudinary/server.
                </span>

                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0] ||
                      null;

                    setUploadFile(file);

                    if (
                      file &&
                      !docName.trim()
                    ) {
                      setDocName(file.name);
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tên tài liệu
              </label>

              <input
                value={docName}
                onChange={(event) =>
                  setDocName(event.target.value)
                }
                placeholder="Ví dụ: Tài liệu yêu cầu hệ thống"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Thư mục
              </label>

              <select
                value={uploadFolderId}
                onChange={(event) =>
                  setUploadFolderId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Kho gốc
                </option>

                {renderFolderOptions(
                  folderTree
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mô tả
              </label>

              <textarea
                value={docDesc}
                onChange={(event) =>
                  setDocDesc(event.target.value)
                }
                rows={3}
                placeholder="Mô tả ngắn về tài liệu..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={uploading}
                onClick={() =>
                  setShowUploadModal(false)
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {uploading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Tải lên
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showFolderModal && (
        <Modal
          title="Tạo thư mục mới"
          onClose={() =>
            !creatingFolder &&
            setShowFolderModal(false)
          }
        >
          <form
            onSubmit={handleCreateFolder}
            className="space-y-5 p-6"
          >
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
              <FolderPlus className="h-6 w-6 text-blue-600" />

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Tạo cấu trúc thư mục
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  Ví dụ: 01_Tài liệu yêu cầu,
                  02_Thiết kế, 03_Tài liệu kỹ thuật.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tên thư mục
              </label>

              <input
                autoFocus
                value={folderName}
                onChange={(event) =>
                  setFolderName(event.target.value)
                }
                placeholder="Ví dụ: 01_Tài liệu yêu cầu"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Thư mục cha
              </label>

              <select
                value={folderParentId}
                onChange={(event) =>
                  setFolderParentId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Kho gốc
                </option>

                {renderFolderOptions(
                  folderTree
                )}
              </select>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setShowFolderModal(false)
                }
                disabled={creatingFolder}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={creatingFolder}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {creatingFolder && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Tạo thư mục
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showRenameModal && renameDoc && (
        <Modal
          title="Đổi tên tài liệu"
          onClose={() =>
            !renaming &&
            setShowRenameModal(false)
          }
        >
          <form
            onSubmit={handleRename}
            className="space-y-5 p-6"
          >
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              {getFileIcon(
                renameDoc.name,
                "h-6 w-6"
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">
                  {renameDoc.name}
                </p>

                <p className="text-xs text-slate-400">
                  v
                  {renameDoc.currentVersionNumber ||
                    1}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tên mới
              </label>

              <input
                autoFocus
                value={renameValue}
                onChange={(event) =>
                  setRenameValue(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setShowRenameModal(false)
                }
                disabled={renaming}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={renaming}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {renaming && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showMoveModal && moveDoc && (
        <Modal
          title="Di chuyển tài liệu"
          onClose={() =>
            !moving &&
            setShowMoveModal(false)
          }
        >
          <form
            onSubmit={handleMoveDocument}
            className="space-y-5 p-6"
          >
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Move className="h-5 w-5 text-blue-600" />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {moveDoc.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Chọn thư mục đích.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Thư mục đích
              </label>

              <select
                value={moveFolderId}
                onChange={(event) =>
                  setMoveFolderId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Kho gốc
                </option>

                {renderFolderOptions(
                  folderTree
                )}
              </select>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setShowMoveModal(false)
                }
                disabled={moving}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={moving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {moving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Di chuyển
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showVersionModal && selectedDoc && (
        <Modal
          title={`Tạo phiên bản mới — ${selectedDoc.name}`}
          onClose={() =>
            !submittingVersion &&
            setShowVersionModal(false)
          }
        >
          <form
            onSubmit={handleNewVersionSubmit}
            className="space-y-5 p-6"
          >
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
              <History className="h-6 w-6 text-blue-600" />

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Phiên bản hiện tại: v
                  {selectedDoc.currentVersionNumber ||
                    1}
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  File mới sẽ trở thành phiên bản hiện
                  tại.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                File phiên bản mới
              </label>

              <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 p-5 transition hover:border-blue-400 hover:bg-blue-50/30">
                <UploadCloud className="h-7 w-7 text-blue-600" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {versionFile
                      ? versionFile.name
                      : "Chọn file phiên bản mới"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Chọn file mới để tạo version.
                  </p>
                </div>

                <input
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    setVersionFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mô tả thay đổi
              </label>

              <textarea
                value={changeDesc}
                onChange={(event) =>
                  setChangeDesc(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Ví dụ: Cập nhật tài liệu theo góp ý của PM..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setShowVersionModal(false)
                }
                disabled={submittingVersion}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={
                  submittingVersion ||
                  !versionFile
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submittingVersion && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Tạo phiên bản
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showHistoryModal && selectedDoc && (
        <Modal
          title={`Lịch sử phiên bản — ${selectedDoc.name}`}
          onClose={() =>
            setShowHistoryModal(false)
          }
          width="max-w-3xl"
        >
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {getFileIcon(
                  selectedDoc.currentFileName ||
                    selectedDoc.name,
                  "h-7 w-7"
                )}

                <div>
                  <p className="font-semibold text-slate-800">
                    {selectedDoc.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Phiên bản hiện tại: v
                    {selectedDoc.currentVersionNumber ||
                      1}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  openVersionModal(
                    selectedDoc
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Phiên bản mới
              </button>
            </div>

            {loadingVersions ? (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-slate-500">
                  Đang tải lịch sử...
                </p>
              </div>
            ) : versions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
                <History className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  Chưa có lịch sử phiên bản.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => {
                  const isCurrent =
                    Boolean(version.current);

                  const fileName =
                    version.fileName ||
                    selectedDoc.name;

                  return (
                    <div
                      key={version.id}
                      className={`rounded-xl border p-4 transition ${
                        isCurrent
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                            {getFileIcon(
                              fileName
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                                v
                                {
                                  version.versionNumber
                                }
                              </span>

                              {isCurrent && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  Hiện tại
                                </span>
                              )}
                            </div>

                            <p className="mt-2 truncate text-sm font-semibold text-slate-800">
                              {fileName}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span>
                                {formatBytes(
                                  version.fileSize
                                )}
                              </span>

                              <span>
                                {version.editedByName ||
                                  "Không xác định"}
                              </span>

                              <span>
                                {formatDateTime(
                                  version.createdAt
                                )}
                              </span>
                            </div>

                            {version.changeDescription && (
                              <p className="mt-2 text-sm text-slate-600">
                                {
                                  version.changeDescription
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(
                                version.id,
                                fileName
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Download className="h-4 w-4" />
                            Tải
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              disabled={
                                restoringVersionId ===
                                version.id
                              }
                              onClick={() =>
                                handleRestoreVersion(
                                  version
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {restoringVersionId ===
                              version.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              Khôi phục
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showVisibilityModal && visibilityDoc && (
        <Modal
          title="Thiết lập quyền truy cập"
          onClose={() =>
            !updatingVisibility &&
            setShowVisibilityModal(false)
          }
        >
          <div className="space-y-4 p-6">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />

                <div>
                  <p className="font-semibold text-slate-800">
                    {visibilityDoc.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Chọn phạm vi truy cập cho tài liệu.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={updatingVisibility}
              onClick={() =>
                handleChangeVisibility(
                  "PUBLIC"
                )
              }
              className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                String(
                  visibilityDoc.visibility
                ).toUpperCase() === "PUBLIC"
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
              }`}
            >
              <div className="rounded-xl bg-emerald-100 p-3">
                <Globe2 className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Công khai
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Thành viên trong dự án có thể truy cập
                  tài liệu theo quyền được cấp.
                </p>
              </div>

              {String(
                visibilityDoc.visibility
              ).toUpperCase() === "PUBLIC" && (
                <Check className="h-5 w-5 text-emerald-600" />
              )}
            </button>

            <button
              type="button"
              disabled={updatingVisibility}
              onClick={() =>
                handleChangeVisibility(
                  "PRIVATE"
                )
              }
              className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                String(
                  visibilityDoc.visibility
                ).toUpperCase() === "PRIVATE"
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 hover:border-red-200 hover:bg-slate-50"
              }`}
            >
              <div className="rounded-xl bg-red-100 p-3">
                <Lock className="h-5 w-5 text-red-600" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Bảo mật
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Chỉ người có quyền phù hợp mới có thể
                  truy cập tài liệu.
                </p>
              </div>

              {String(
                visibilityDoc.visibility
              ).toUpperCase() === "PRIVATE" && (
                <Check className="h-5 w-5 text-red-600" />
              )}
            </button>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setShowVisibilityModal(false)
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showPermissionModal && permissionDoc && (
        <Modal
          title={`Phân quyền — ${permissionDoc.name}`}
          onClose={() =>
            setShowPermissionModal(false)
          }
          width="max-w-3xl"
        >
          <div className="p-6">
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-blue-600" />

                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Phân quyền xem và tải
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Cấp quyền riêng cho từng thành viên
                    trong dự án. Backend vẫn kiểm tra quyền
                    ở phía server.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={permissionSearch}
                onChange={(event) =>
                  setPermissionSearch(
                    event.target.value
                  )
                }
                placeholder="Tìm thành viên..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {loadingPermissions ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-slate-500">
                  Đang tải quyền...
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">
                        Thành viên
                      </th>

                      <th className="w-28 px-4 py-3 text-center">
                        Xem
                      </th>

                      <th className="w-32 px-4 py-3 text-center">
                        Tải xuống
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map(
                      (member) => {
                        const viewKey = `${member.id}-VIEW`;
                        const downloadKey = `${member.id}-DOWNLOAD`;

                        return (
                          <tr
                            key={member.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                                  <UserCircle2 className="h-5 w-5 text-slate-500" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-800">
                                    {member.name}
                                  </p>

                                  <p className="truncate text-xs text-slate-400">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                disabled={
                                  savingPermission ===
                                  viewKey
                                }
                                onClick={() =>
                                  togglePermission(
                                    member,
                                    "VIEW"
                                  )
                                }
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition ${
                                  hasPermission(
                                    member.id,
                                    "VIEW"
                                  )
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                }`}
                              >
                                {savingPermission ===
                                viewKey ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                disabled={
                                  savingPermission ===
                                  downloadKey
                                }
                                onClick={() =>
                                  togglePermission(
                                    member,
                                    "DOWNLOAD"
                                  )
                                }
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition ${
                                  hasPermission(
                                    member.id,
                                    "DOWNLOAD"
                                  )
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                }`}
                              >
                                {savingPermission ===
                                downloadKey ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>

                {filteredMembers.length === 0 && (
                  <div className="p-10 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">
                      Không tìm thấy thành viên.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Quyền hiện có:{" "}
                {permissions.length}
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPermissionModal(false)
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}