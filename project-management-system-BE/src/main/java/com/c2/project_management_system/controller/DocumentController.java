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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.respone.DocumentResponse;
import com.c2.project_management_system.dto.respone.DocumentVersionResponse;
import com.c2.project_management_system.entity.DocumentVersion;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.DocumentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> upload(
            Authentication authentication,
            @RequestParam("projectId") Long projectId,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file) {
        User currentUser = currentUser(authentication);
        DocumentResponse response = documentService.uploadDocument(projectId, currentUser.getId(), name, description, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<DocumentResponse>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(documentService.getDocumentsByProject(projectId));
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> getById(@PathVariable Long documentId) {
        return ResponseEntity.ok(documentService.getDocumentById(documentId));
    }

    @GetMapping("/{documentId}/versions")
    public ResponseEntity<List<DocumentVersionResponse>> getVersions(@PathVariable Long documentId) {
        return ResponseEntity.ok(documentService.getDocumentVersions(documentId));
    }

    @PostMapping("/{documentId}/versions")
    public ResponseEntity<DocumentVersionResponse> uploadNewVersion(
            Authentication authentication,
            @PathVariable Long documentId,
            @RequestParam(value = "changeDescription", required = false) String changeDescription,
            @RequestParam("file") MultipartFile file) {
        User currentUser = currentUser(authentication);
        DocumentVersionResponse response = documentService.uploadNewVersion(documentId, currentUser.getId(), changeDescription, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/versions/{versionId}/download")
    public ResponseEntity<Resource> downloadVersion(@PathVariable Long versionId) {
        DocumentVersion version = documentService.getVersion(versionId);
        Resource resource = documentService.loadVersionFile(versionId);

        String originalFileName = "document";
        if (version.getFilePath() != null) {
            int idx = Math.max(version.getFilePath().lastIndexOf('/'), version.getFilePath().lastIndexOf('\\'));
            if (idx >= 0) {
                originalFileName = version.getFilePath().substring(idx + 1);
                // Bỏ tiền tố UUID_ nếu có để lấy tên hiển thị đẹp
                int underscoreIdx = originalFileName.indexOf('_');
                if (underscoreIdx > 0 && underscoreIdx < originalFileName.length() - 1) {
                    originalFileName = originalFileName.substring(underscoreIdx + 1);
                }
            }
        }

        String encodedFilename = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long documentId) {
        User currentUser = currentUser(authentication);
        documentService.deleteDocument(documentId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    private User currentUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }
}