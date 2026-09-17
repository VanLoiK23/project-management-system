package com.c2.project_management_system.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.request.DocumentPermissionRequest;
import com.c2.project_management_system.dto.request.DocumentRenameRequest;
import com.c2.project_management_system.dto.request.DocumentVisibilityRequest;
import com.c2.project_management_system.dto.respone.DocumentFolderResponse;
import com.c2.project_management_system.dto.respone.DocumentPermissionResponse;
import com.c2.project_management_system.dto.respone.DocumentResponse;
import com.c2.project_management_system.dto.respone.DocumentVersionResponse;
import com.c2.project_management_system.entity.DocumentVersion;

public interface DocumentService {

	DocumentResponse uploadDocument(Long projectId, Long userId, Long folderId, String name, String description,
			MultipartFile file);

	List<DocumentResponse> getDocumentsByProject(Long projectId, Long userId, Long folderId);

	DocumentResponse getDocumentById(Long documentId, Long userId);

	DocumentVersionResponse uploadNewVersion(Long documentId, Long userId, String changeDescription,
			MultipartFile file);

	List<DocumentVersionResponse> getDocumentVersions(Long documentId, Long userId);

	DocumentVersion getVersion(Long versionId, Long userId);

	Resource loadVersionFile(Long versionId, Long userId);

	DocumentVersionResponse restoreVersion(Long documentId, Long versionId, Long userId);

	DocumentResponse renameDocument(Long documentId, Long userId, DocumentRenameRequest request);

	DocumentResponse moveDocument(Long documentId, Long userId, Long folderId);

	DocumentResponse updateVisibility(Long documentId, Long userId, DocumentVisibilityRequest request);

	DocumentPermissionResponse grantPermission(Long documentId, Long userId, DocumentPermissionRequest request);

	void revokePermission(Long documentId, Long userId, Long targetUserId);

	List<DocumentPermissionResponse> getPermissions(Long documentId, Long userId);

	void deleteDocument(Long documentId, Long userId);

	DocumentFolderResponse createFolder(Long projectId, Long userId, String name, Long parentId);

	List<DocumentFolderResponse> getFolders(Long projectId, Long userId);

	void deleteFolder(Long folderId, Long userId);
}