package com.c2.project_management_system.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.request.DocumentPermissionRequest;
import com.c2.project_management_system.dto.request.DocumentRenameRequest;
import com.c2.project_management_system.dto.request.DocumentVisibilityRequest;
import com.c2.project_management_system.dto.respone.DocumentFolderResponse;
import com.c2.project_management_system.dto.respone.DocumentPermissionResponse;
import com.c2.project_management_system.dto.respone.DocumentResponse;
import com.c2.project_management_system.dto.respone.DocumentVersionResponse;
import com.c2.project_management_system.entity.DocumentVersion;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.DocumentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

	private final DocumentService documentService;

	@PostMapping("/upload")
	public ResponseEntity<DocumentResponse> upload(Authentication authentication,
			@RequestParam("projectId") Long projectId,
			@RequestParam(value = "folderId", required = false) Long folderId,
			@RequestParam(value = "name", required = false) String name,
			@RequestParam(value = "description", required = false) String description,
			@RequestParam("file") MultipartFile file) {

		User user = currentUser(authentication);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(documentService.uploadDocument(projectId, user.getId(), folderId, name, description, file));
	}

	@GetMapping("/project/{projectId}")
	public ResponseEntity<List<DocumentResponse>> getByProject(Authentication authentication,
			@PathVariable Long projectId, @RequestParam(required = false) Long folderId) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.getDocumentsByProject(projectId, user.getId(), folderId));
	}

	@GetMapping("/{documentId}")
	public ResponseEntity<DocumentResponse> getById(Authentication authentication, @PathVariable Long documentId) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.getDocumentById(documentId, user.getId()));
	}

	@PutMapping("/{documentId}/name")
	public ResponseEntity<DocumentResponse> rename(Authentication authentication, @PathVariable Long documentId,
			@Valid @RequestBody DocumentRenameRequest request) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.renameDocument(documentId, user.getId(), request));
	}

	@PutMapping("/{documentId}/move")
	public ResponseEntity<DocumentResponse> move(Authentication authentication, @PathVariable Long documentId,
			@RequestParam(required = false) Long folderId) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.moveDocument(documentId, user.getId(), folderId));
	}

	@PutMapping("/{documentId}/visibility")
	public ResponseEntity<DocumentResponse> updateVisibility(Authentication authentication,
			@PathVariable Long documentId, @Valid @RequestBody DocumentVisibilityRequest request) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.updateVisibility(documentId, user.getId(), request));
	}

	@GetMapping("/{documentId}/versions")
	public ResponseEntity<List<DocumentVersionResponse>> getVersions(Authentication authentication,
			@PathVariable Long documentId) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.getDocumentVersions(documentId, user.getId()));
	}

	@PostMapping("/{documentId}/versions")
	public ResponseEntity<DocumentVersionResponse> uploadNewVersion(Authentication authentication,
			@PathVariable Long documentId,
			@RequestParam(value = "changeDescription", required = false) String changeDescription,
			@RequestParam("file") MultipartFile file) {

		User user = currentUser(authentication);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(documentService.uploadNewVersion(documentId, user.getId(), changeDescription, file));
	}

	@PostMapping("/{documentId}/versions/{versionId}/restore")
	public ResponseEntity<DocumentVersionResponse> restoreVersion(Authentication authentication,
			@PathVariable Long documentId, @PathVariable Long versionId) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.restoreVersion(documentId, versionId, user.getId()));
	}

	@GetMapping("/versions/{versionId}/download")
	public ResponseEntity<Resource> downloadVersion(Authentication authentication, @PathVariable Long versionId) {

		User user = currentUser(authentication);

		DocumentVersion version = documentService.getVersion(versionId, user.getId());

		Resource resource = documentService.loadVersionFile(versionId, user.getId());

		String fileName = version.getFileName() != null ? version.getFileName() : "document";

		String encodedFilename = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");

		MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

		if (version.getContentType() != null && !version.getContentType().isBlank()) {

			try {
				mediaType = MediaType.parseMediaType(version.getContentType());
			} catch (Exception ignored) {
			}
		}

		return ResponseEntity.ok().contentType(mediaType)
				.header(HttpHeaders.CONTENT_DISPOSITION,
						"attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
				.body(resource);
	}

	@GetMapping("/{documentId}/permissions")
	public ResponseEntity<List<DocumentPermissionResponse>> getPermissions(Authentication authentication,
			@PathVariable Long documentId) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.getPermissions(documentId, user.getId()));
	}

	@PostMapping("/{documentId}/permissions")
	public ResponseEntity<DocumentPermissionResponse> grantPermission(Authentication authentication,
			@PathVariable Long documentId, @Valid @RequestBody DocumentPermissionRequest request) {

		User user = currentUser(authentication);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(documentService.grantPermission(documentId, user.getId(), request));
	}

	@DeleteMapping("/{documentId}/permissions/{targetUserId}")
	public ResponseEntity<Void> revokePermission(Authentication authentication, @PathVariable Long documentId,
			@PathVariable Long targetUserId) {

		User user = currentUser(authentication);

		documentService.revokePermission(documentId, user.getId(), targetUserId);

		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/{documentId}")
	public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long documentId) {

		User user = currentUser(authentication);

		documentService.deleteDocument(documentId, user.getId());

		return ResponseEntity.noContent().build();
	}

	@PostMapping("/folders")
	public ResponseEntity<DocumentFolderResponse> createFolder(Authentication authentication,
			@RequestParam Long projectId, @RequestParam(required = false) Long parentId, @RequestParam String name) {

		User user = currentUser(authentication);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(documentService.createFolder(projectId, user.getId(), name, parentId));
	}

	@GetMapping("/folders/project/{projectId}")
	public ResponseEntity<List<DocumentFolderResponse>> getFolders(Authentication authentication,
			@PathVariable Long projectId) {

		User user = currentUser(authentication);

		return ResponseEntity.ok(documentService.getFolders(projectId, user.getId()));
	}

	@DeleteMapping("/folders/{folderId}")
	public ResponseEntity<Void> deleteFolder(Authentication authentication, @PathVariable Long folderId) {

		User user = currentUser(authentication);

		documentService.deleteFolder(folderId, user.getId());

		return ResponseEntity.noContent().build();
	}

	private User currentUser(Authentication authentication) {

		return (User) authentication.getPrincipal();
	}
}