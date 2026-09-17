package com.c2.project_management_system.service.impl;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.request.DocumentPermissionRequest;
import com.c2.project_management_system.dto.request.DocumentRenameRequest;
import com.c2.project_management_system.dto.request.DocumentVisibilityRequest;
import com.c2.project_management_system.dto.respone.CloudinaryFile;
import com.c2.project_management_system.dto.respone.DocumentFolderResponse;
import com.c2.project_management_system.dto.respone.DocumentPermissionResponse;
import com.c2.project_management_system.dto.respone.DocumentResponse;
import com.c2.project_management_system.dto.respone.DocumentVersionResponse;
import com.c2.project_management_system.entity.Document;
import com.c2.project_management_system.entity.DocumentFolder;
import com.c2.project_management_system.entity.DocumentPermission;
import com.c2.project_management_system.entity.DocumentVersion;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.DocumentFolderRepository;
import com.c2.project_management_system.repository.DocumentPermissionRepository;
import com.c2.project_management_system.repository.DocumentRepository;
import com.c2.project_management_system.repository.DocumentVersionRepository;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.DocumentService;
import com.c2.project_management_system.service.FileStorageService;
import com.c2.project_management_system.service.NotificationService;
import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.DocumentPermissionType;
import com.c2.project_management_system.statusEnum.DocumentVisibility;
import com.c2.project_management_system.statusEnum.NotificationTargetType;
import com.c2.project_management_system.statusEnum.ProjectStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

	private final DocumentRepository documentRepository;
	private final DocumentVersionRepository documentVersionRepository;
	private final DocumentFolderRepository documentFolderRepository;
	private final DocumentPermissionRepository documentPermissionRepository;
	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final UserRepository userRepository;
	private final FileStorageService fileStorageService;
	private final NotificationService notificationService;

	@Override
	@Transactional
	public DocumentResponse uploadDocument(Long projectId, Long userId, Long folderId, String name, String description,
			MultipartFile file) {

		Project project = getProject(projectId);
		User user = getUser(userId);

		checkCanUploadDocument(project, user);
		checkProjectAllowsDocumentManagement(project);

		DocumentFolder folder = null;

		if (folderId != null) {
			folder = documentFolderRepository.findById(folderId)
					.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục"));
			checkFolderBelongsToProject(folder, project);
		}

		if (!StringUtils.hasText(name)) {
			name = file.getOriginalFilename();

			if (!StringUtils.hasText(name)) {
				name = "Tài liệu mới";
			}
		}

		CloudinaryFile uploadedFile = fileStorageService.uploadFile(projectId, file);

		try {

			Document document = Document.builder().name(name.trim()).description(description)
					.visibility(DocumentVisibility.PUBLIC).project(project).folder(folder).uploadedBy(user).build();

			Document savedDocument = documentRepository.save(document);

			DocumentVersion version = DocumentVersion.builder().versionNumber(1).fileUrl(uploadedFile.getFileUrl())
					.cloudinaryPublicId(uploadedFile.getPublicId()).fileName(uploadedFile.getFileName())
					.contentType(uploadedFile.getContentType()).fileSize(uploadedFile.getFileSize())
					.changeDescription("Phiên bản khởi tạo").document(savedDocument).editedBy(user).build();

			DocumentVersion savedVersion = documentVersionRepository.save(version);

			savedDocument.setCurrentVersion(savedVersion);

			savedDocument = documentRepository.save(savedDocument);

			notificationService.sendNotificationToProject(projectId, userId,
					"Tài liệu mới trong dự án " + project.getName(),
					user.getFullName() + " đã tải lên tài liệu: " + savedDocument.getName(),
					NotificationTargetType.GROUP);

			return mapToResponse(savedDocument, user);

		} catch (RuntimeException e) {

			fileStorageService.deleteFile(uploadedFile.getPublicId());

			throw e;
		}
	}

	@Override
	@Transactional(readOnly = true)
	public List<DocumentResponse> getDocumentsByProject(Long projectId, Long userId, Long folderId) {

		Project project = getProject(projectId);
		User user = getUser(userId);

		checkCanViewProject(project, user);

		List<Document> documents;

		if (folderId == null) {

			documents = documentRepository.findByProjectIdAndFolderIsNullOrderByUpdatedAtDesc(projectId);

		} else {

			DocumentFolder folder = documentFolderRepository.findById(folderId)
					.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục"));

			checkFolderBelongsToProject(folder, project);

			documents = documentRepository.findByProjectIdAndFolderIdOrderByUpdatedAtDesc(projectId, folderId);
		}

		return documents.stream().filter(document -> canViewDocument(document, user))
				.map(document -> mapToResponse(document, user)).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public DocumentResponse getDocumentById(Long documentId, Long userId) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanViewProject(document.getProject(), user);

		if (!canViewDocument(document, user)) {
			throw new AccessDeniedException("Bạn không có quyền xem tài liệu này");
		}

		return mapToResponse(document, user);
	}

	@Override
	@Transactional
	public DocumentVersionResponse uploadNewVersion(Long documentId, Long userId, String changeDescription,
			MultipartFile file) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanEditDocument(document, user);
		checkProjectAllowsDocumentManagement(document.getProject());

		int nextVersion = documentVersionRepository.findTopByDocumentOrderByVersionNumberDesc(document)
				.map(v -> v.getVersionNumber() + 1).orElse(1);

		CloudinaryFile uploadedFile = fileStorageService.uploadFile(document.getProject().getId(), file);

		try {

			DocumentVersion version = DocumentVersion.builder().versionNumber(nextVersion)
					.fileUrl(uploadedFile.getFileUrl()).cloudinaryPublicId(uploadedFile.getPublicId())
					.fileName(uploadedFile.getFileName()).contentType(uploadedFile.getContentType())
					.fileSize(uploadedFile.getFileSize())
					.changeDescription(StringUtils.hasText(changeDescription) ? changeDescription
							: "Cập nhật phiên bản v" + nextVersion)
					.document(document).editedBy(user).build();

			DocumentVersion savedVersion = documentVersionRepository.save(version);

			document.setCurrentVersion(savedVersion);

			documentRepository.save(document);

			notificationService.sendNotificationToProject(document.getProject().getId(), userId,
					"Cập nhật phiên bản tài liệu",
					user.getFullName() + " đã cập nhật " + document.getName() + " lên v" + nextVersion,
					NotificationTargetType.GROUP);

			return mapVersionToResponse(savedVersion);

		} catch (RuntimeException e) {

			fileStorageService.deleteFile(uploadedFile.getPublicId());

			throw e;
		}
	}

	@Override
	@Transactional(readOnly = true)
	public List<DocumentVersionResponse> getDocumentVersions(Long documentId, Long userId) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanViewProject(document.getProject(), user);

		if (!canViewDocument(document, user)) {
			throw new AccessDeniedException("Bạn không có quyền xem lịch sử tài liệu");
		}

		return documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document).stream()
				.map(this::mapVersionToResponse).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public DocumentVersion getVersion(Long versionId, Long userId) {

		DocumentVersion version = documentVersionRepository.findById(versionId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản tài liệu"));

		User user = getUser(userId);

		checkCanViewProject(version.getDocument().getProject(), user);

		if (!canDownloadDocument(version.getDocument(), user)) {
			throw new AccessDeniedException("Bạn không có quyền tải tài liệu này");
		}

		return version;
	}

	@Override
	@Transactional(readOnly = true)
	public Resource loadVersionFile(Long versionId, Long userId) {

		DocumentVersion version = getVersion(versionId, userId);

		return fileStorageService.loadFileAsResource(version.getFileUrl());
	}

	@Override
	@Transactional
	public DocumentVersionResponse restoreVersion(Long documentId, Long versionId, Long userId) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanEditDocument(document, user);
		checkProjectAllowsDocumentManagement(document.getProject());

		DocumentVersion oldVersion = documentVersionRepository.findById(versionId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản"));

		if (!oldVersion.getDocument().getId().equals(documentId)) {

			throw new InvalidOperationException("Phiên bản không thuộc tài liệu này");
		}

		int nextVersion = documentVersionRepository.findTopByDocumentOrderByVersionNumberDesc(document)
				.map(v -> v.getVersionNumber() + 1).orElse(1);

		DocumentVersion restoredVersion = DocumentVersion.builder().versionNumber(nextVersion)
				.fileUrl(oldVersion.getFileUrl()).cloudinaryPublicId(oldVersion.getCloudinaryPublicId())
				.fileName(oldVersion.getFileName()).contentType(oldVersion.getContentType())
				.fileSize(oldVersion.getFileSize())
				.changeDescription("Khôi phục từ phiên bản v" + oldVersion.getVersionNumber()).document(document)
				.editedBy(user).build();

		restoredVersion = documentVersionRepository.save(restoredVersion);

		document.setCurrentVersion(restoredVersion);

		documentRepository.save(document);

		notificationService
				.sendNotificationToProject(document.getProject().getId(), userId, "Khôi phục phiên bản tài liệu",
						user.getFullName() + " đã khôi phục " + document.getName() + " từ v"
								+ oldVersion.getVersionNumber() + " thành v" + nextVersion,
						NotificationTargetType.GROUP);

		return mapVersionToResponse(restoredVersion);
	}

	@Override
	@Transactional
	public DocumentResponse renameDocument(Long documentId, Long userId, DocumentRenameRequest request) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanManage(document.getProject(), user);
		checkProjectAllowsDocumentManagement(document.getProject());

		document.setName(request.getName().trim());

		return mapToResponse(documentRepository.save(document), user);
	}

	@Override
	@Transactional
	public DocumentResponse moveDocument(Long documentId, Long userId, Long folderId) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanManage(document.getProject(), user);
		checkProjectAllowsDocumentManagement(document.getProject());

		DocumentFolder folder = null;

		if (folderId != null) {

			folder = documentFolderRepository.findById(folderId)
					.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục"));

			checkFolderBelongsToProject(folder, document.getProject());
		}

		document.setFolder(folder);

		return mapToResponse(documentRepository.save(document), user);
	}

	@Override
	@Transactional
	public DocumentResponse updateVisibility(Long documentId, Long userId, DocumentVisibilityRequest request) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanManage(document.getProject(), user);
		checkProjectAllowsDocumentManagement(document.getProject());

		document.setVisibility(request.getVisibility());

		return mapToResponse(documentRepository.save(document), user);
	}

	@Override
	@Transactional
	public DocumentPermissionResponse grantPermission(Long documentId, Long userId, DocumentPermissionRequest request) {

		Document document = getDocument(documentId);
		User currentUser = getUser(userId);

		checkCanManage(document.getProject(), currentUser);
		checkProjectAllowsDocumentManagement(document.getProject());

		User targetUser = getUser(request.getUserId());

		checkUserBelongsToProject(document.getProject(), targetUser);

		DocumentPermission permission = documentPermissionRepository
				.findByDocumentIdAndUserIdAndPermissionType(documentId, request.getUserId(),
						request.getPermissionType())
				.orElseGet(() -> DocumentPermission.builder().document(document).user(targetUser)
						.permissionType(request.getPermissionType()).build());

		permission = documentPermissionRepository.save(permission);

		return mapPermissionToResponse(permission);
	}

	@Override
	@Transactional
	public void revokePermission(Long documentId, Long userId, Long targetUserId) {

		Document document = getDocument(documentId);
		User currentUser = getUser(userId);

		checkCanManage(document.getProject(), currentUser);
		checkProjectAllowsDocumentManagement(document.getProject());

		documentPermissionRepository.deleteByDocumentIdAndUserId(documentId, targetUserId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<DocumentPermissionResponse> getPermissions(Long documentId, Long userId) {

		Document document = getDocument(documentId);
		User currentUser = getUser(userId);

		checkCanManage(document.getProject(), currentUser);

		return documentPermissionRepository.findByDocumentId(documentId).stream().map(this::mapPermissionToResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public void deleteDocument(Long documentId, Long userId) {

		Document document = getDocument(documentId);
		User user = getUser(userId);

		checkCanManage(document.getProject(), user);
		checkProjectAllowsDocumentManagement(document.getProject());

		Set<String> publicIds = documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document).stream()
				.map(DocumentVersion::getCloudinaryPublicId).filter(StringUtils::hasText)
				.collect(Collectors.toCollection(LinkedHashSet::new));

		documentRepository.delete(document);

		for (String publicId : publicIds) {
			fileStorageService.deleteFile(publicId);
		}
	}

	@Override
	@Transactional
	public DocumentFolderResponse createFolder(Long projectId, Long userId, String name, Long parentId) {

		Project project = getProject(projectId);
		User user = getUser(userId);

		checkCanManage(project, user);
		checkProjectAllowsDocumentManagement(project);

		DocumentFolder parent = null;

		if (parentId != null) {

			parent = documentFolderRepository.findById(parentId)
					.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục cha"));

			checkFolderBelongsToProject(parent, project);
		}

		boolean duplicate;

		if (parentId == null) {

			duplicate = documentFolderRepository.existsByProjectIdAndNameAndParentIsNull(projectId, name.trim());

		} else {

			duplicate = documentFolderRepository.existsByProjectIdAndNameAndParentId(projectId, name.trim(), parentId);
		}

		if (duplicate) {
			throw new InvalidOperationException("Tên thư mục đã tồn tại");
		}

		DocumentFolder folder = DocumentFolder.builder().name(name.trim()).project(project).parent(parent).build();

		return mapFolderToResponse(documentFolderRepository.save(folder));
	}

	@Override
	@Transactional(readOnly = true)
	public List<DocumentFolderResponse> getFolders(Long projectId, Long userId) {

		Project project = getProject(projectId);
		User user = getUser(userId);

		checkCanViewProject(project, user);

		return documentFolderRepository.findByProjectIdOrderByNameAsc(projectId).stream().map(this::mapFolderToResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public void deleteFolder(Long folderId, Long userId) {

		DocumentFolder folder = documentFolderRepository.findById(folderId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục"));

		User user = getUser(userId);

		checkCanManage(folder.getProject(), user);
		checkProjectAllowsDocumentManagement(folder.getProject());

		if (!folder.getDocuments().isEmpty()) {
			throw new InvalidOperationException("Không thể xóa thư mục đang chứa tài liệu");
		}

		if (!folder.getChildren().isEmpty()) {
			throw new InvalidOperationException("Không thể xóa thư mục đang chứa thư mục con");
		}

		documentFolderRepository.delete(folder);
	}

	private Project getProject(Long projectId) {

		return projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));
	}

	private User getUser(Long userId) {

		return userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));
	}

	private Document getDocument(Long documentId) {

		return documentRepository.findById(documentId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu id=" + documentId));
	}

	private void checkCanManage(Project project, User user) {

		boolean admin = user.getRole() == AccountRole.ADMIN;

		boolean pm = project.getProjectManager() != null && project.getProjectManager().getId().equals(user.getId());

		if (!admin && !pm) {
			throw new AccessDeniedException("Chỉ PM hoặc Admin mới có quyền quản lý tài liệu");
		}
	}

	private void checkCanUploadDocument(Project project, User user) {

		if (user.getRole() == AccountRole.ADMIN) {
			return;
		}

		boolean pm = project.getProjectManager() != null && project.getProjectManager().getId().equals(user.getId());

		if (pm) {
			return;
		}

		if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
			throw new AccessDeniedException("Bạn không phải thành viên của dự án nên không thể tải tài liệu lên");
		}
	}

	private void checkCanEditDocument(Document document, User user) {

		if (user.getRole() == AccountRole.ADMIN) {
			return;
		}

		Project project = document.getProject();

		boolean pm = project.getProjectManager() != null && project.getProjectManager().getId().equals(user.getId());

		if (pm) {
			return;
		}

		boolean owner = document.getUploadedBy() != null && document.getUploadedBy().getId().equals(user.getId());

		if (owner) {
			return;
		}

		boolean hasEditPermission = documentPermissionRepository
				.existsByDocumentIdAndUserIdAndPermissionType(document.getId(), user.getId(), DocumentPermissionType.EDIT);

		if (!hasEditPermission) {
			throw new AccessDeniedException("Bạn không có quyền chỉnh sửa tài liệu này");
		}
	}

	private void checkCanViewProject(Project project, User user) {

		if (user.getRole() == AccountRole.ADMIN) {
			return;
		}

		boolean pm = project.getProjectManager() != null && project.getProjectManager().getId().equals(user.getId());

		if (pm) {
			return;
		}

		if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {

			throw new AccessDeniedException("Bạn không phải thành viên của dự án");
		}
	}

	private boolean canViewDocument(Document document, User user) {

		if (user.getRole() == AccountRole.ADMIN) {
			return true;
		}

		if (document.getProject().getProjectManager() != null
				&& document.getProject().getProjectManager().getId().equals(user.getId())) {
			return true;
		}

		if (document.getUploadedBy() != null && document.getUploadedBy().getId().equals(user.getId())) {
			return true;
		}

		if (document.getVisibility() == DocumentVisibility.PUBLIC) {
			return true;
		}

		return documentPermissionRepository.existsByDocumentIdAndUserIdAndPermissionType(document.getId(), user.getId(),
				DocumentPermissionType.VIEW)
				|| documentPermissionRepository.existsByDocumentIdAndUserIdAndPermissionType(document.getId(),
						user.getId(), DocumentPermissionType.DOWNLOAD)
				|| documentPermissionRepository.existsByDocumentIdAndUserIdAndPermissionType(document.getId(),
						user.getId(), DocumentPermissionType.EDIT);
	}

	private boolean canDownloadDocument(Document document, User user) {

		return canViewDocument(document, user);
	}

	private void checkUserBelongsToProject(Project project, User user) {

		if (user.getRole() == AccountRole.ADMIN) {
			return;
		}

		boolean pm = project.getProjectManager() != null && project.getProjectManager().getId().equals(user.getId());

		if (pm) {
			return;
		}

		if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {

			throw new InvalidOperationException("Người dùng không thuộc dự án");
		}
	}

	private void checkProjectAllowsDocumentManagement(Project project) {

		if (project.getStatus() == ProjectStatus.CLOSED || project.getStatus() == ProjectStatus.CANCELLED) {

			throw new InvalidOperationException("Dự án đã đóng hoặc hủy, không thể chỉnh sửa tài liệu");
		}
	}

	private void checkFolderBelongsToProject(DocumentFolder folder, Project project) {

		if (!folder.getProject().getId().equals(project.getId())) {

			throw new InvalidOperationException("Thư mục không thuộc dự án");
		}
	}

	private DocumentResponse mapToResponse(Document document, User currentUser) {

		DocumentVersion current = document.getCurrentVersion();

		return DocumentResponse.builder().id(document.getId()).name(document.getName())
				.description(document.getDescription()).projectId(document.getProject().getId())
				.projectName(document.getProject().getName())
				.folderId(document.getFolder() != null ? document.getFolder().getId() : null)
				.folderName(document.getFolder() != null ? document.getFolder().getName() : null)
				.visibility(document.getVisibility()).uploadedById(document.getUploadedBy().getId())
				.uploadedByName(document.getUploadedBy().getFullName())
				.currentVersionId(current != null ? current.getId() : null)
				.currentVersionNumber(current != null ? current.getVersionNumber() : null)
				.currentFileName(current != null ? current.getFileName() : null)
				.currentContentType(current != null ? current.getContentType() : null)
				.currentFileSize(current != null ? current.getFileSize() : null)
				.canDownload(canDownloadDocument(document, currentUser))
				.canEdit(isCanEditQuietly(document, currentUser)).createdAt(document.getCreatedAt())
				.updatedAt(document.getUpdatedAt()).build();
	}

	private boolean isCanEditQuietly(Document document, User user) {

		try {
			checkCanEditDocument(document, user);
			return true;
		} catch (AccessDeniedException e) {
			return false;
		}
	}

	private DocumentVersionResponse mapVersionToResponse(DocumentVersion version) {

		Document document = version.getDocument();

		return DocumentVersionResponse.builder().id(version.getId()).versionNumber(version.getVersionNumber())
				.fileName(version.getFileName()).contentType(version.getContentType()).fileSize(version.getFileSize())
				.changeDescription(version.getChangeDescription()).documentId(document.getId())
				.editedById(version.getEditedBy().getId()).editedByName(version.getEditedBy().getFullName())
				.createdAt(version.getCreatedAt()).current(document.getCurrentVersion() != null
						&& document.getCurrentVersion().getId().equals(version.getId()))
				.build();
	}

	private DocumentFolderResponse mapFolderToResponse(DocumentFolder folder) {

		return DocumentFolderResponse.builder().id(folder.getId()).name(folder.getName())
				.projectId(folder.getProject().getId())
				.parentId(folder.getParent() != null ? folder.getParent().getId() : null)
				.documentCount(folder.getDocuments().size()).createdAt(folder.getCreatedAt())
				.updatedAt(folder.getUpdatedAt()).build();
	}

	private DocumentPermissionResponse mapPermissionToResponse(DocumentPermission permission) {

		return DocumentPermissionResponse.builder().id(permission.getId()).userId(permission.getUser().getId())
				.userName(permission.getUser().getFullName()).userEmail(permission.getUser().getEmail())
				.permissionType(permission.getPermissionType()).build();
	}
}