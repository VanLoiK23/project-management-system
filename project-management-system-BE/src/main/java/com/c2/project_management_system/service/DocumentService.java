package com.c2.project_management_system.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.respone.DocumentResponse;
import com.c2.project_management_system.dto.respone.DocumentVersionResponse;
import com.c2.project_management_system.entity.DocumentVersion;

public interface DocumentService {
    DocumentResponse uploadDocument(Long projectId, Long userId, String name, String description, MultipartFile file);
    List<DocumentResponse> getDocumentsByProject(Long projectId);
    DocumentResponse getDocumentById(Long documentId);
    List<DocumentVersionResponse> getDocumentVersions(Long documentId);
    DocumentVersionResponse uploadNewVersion(Long documentId, Long userId, String changeDescription, MultipartFile file);
    DocumentVersion getVersion(Long versionId);
    Resource loadVersionFile(Long versionId);
    void deleteDocument(Long documentId, Long userId);
}