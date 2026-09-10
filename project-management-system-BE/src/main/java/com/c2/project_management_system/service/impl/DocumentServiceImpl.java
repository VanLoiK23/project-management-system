package com.c2.project_management_system.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.respone.DocumentResponse;
import com.c2.project_management_system.dto.respone.DocumentVersionResponse;
import com.c2.project_management_system.entity.*;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.*;
import com.c2.project_management_system.service.DocumentService;
import com.c2.project_management_system.service.FileStorageService;
import com.c2.project_management_system.service.NotificationService;
import com.c2.project_management_system.statusEnum.NotificationTargetType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public DocumentResponse uploadDocument(Long projectId, Long userId, String name, String description, MultipartFile file) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

        if (!StringUtils.hasText(name)) {
            name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "Tài liệu mới";
        }

        // Lưu trữ file vật lý
        String storedPath = fileStorageService.storeFile(projectId, file);

        // Tạo Document
        Document document = Document.builder()
                .name(name)
                .description(description)
                .project(project)
                .uploadedBy(user)
                .build();
        Document savedDocument = documentRepository.save(document);

        // Tạo DocumentVersion v1
        DocumentVersion version = DocumentVersion.builder()
                .versionNumber(1)
                .filePath(storedPath)
                .changeDescription("Phiên bản khởi tạo")
                .document(savedDocument)
                .editedBy(user)
                .build();
        DocumentVersion savedVersion = documentVersionRepository.save(version);

        // Gán currentVersion cho Document
        savedDocument.setCurrentVersion(savedVersion);
        savedDocument = documentRepository.save(savedDocument);

        // Bắn thông báo phi tập trung tới nhóm
        notificationService.sendNotificationToProject(
                projectId,
                userId,
                "Tài liệu mới trong dự án " + project.getName(),
                user.getFullName() + " đã tải lên tài liệu mới: " + name,
                NotificationTargetType.GROUP
        );

        return mapToResponse(savedDocument);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));

        List<Document> documents = documentRepository.findByProject(project);
        return documents.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu id=" + documentId));
        return mapToResponse(document);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getDocumentVersions(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu id=" + documentId));

        List<DocumentVersion> versions = documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document);
        return versions.stream().map(this::mapVersionToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DocumentVersionResponse uploadNewVersion(Long documentId, Long userId, String changeDescription, MultipartFile file) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu id=" + documentId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

        int nextVersionNumber = documentVersionRepository.findTopByDocumentOrderByVersionNumberDesc(document)
                .map(v -> v.getVersionNumber() + 1)
                .orElse(1);

        String storedPath = fileStorageService.storeFile(document.getProject().getId(), file);

        DocumentVersion newVersion = DocumentVersion.builder()
                .versionNumber(nextVersionNumber)
                .filePath(storedPath)
                .changeDescription(StringUtils.hasText(changeDescription) ? changeDescription : "Cập nhật phiên bản v" + nextVersionNumber)
                .document(document)
                .editedBy(user)
                .build();
        DocumentVersion savedVersion = documentVersionRepository.save(newVersion);

        document.setCurrentVersion(savedVersion);
        documentRepository.save(document);

        // Bắn thông báo
        notificationService.sendNotificationToProject(
                document.getProject().getId(),
                userId,
                "Cập nhật phiên bản tài liệu",
                user.getFullName() + " đã cập nhật phiên bản v" + nextVersionNumber + " cho tài liệu: " + document.getName(),
                NotificationTargetType.GROUP
        );

        return mapVersionToResponse(savedVersion);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentVersion getVersion(Long versionId) {
        return documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản tài liệu id=" + versionId));
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadVersionFile(Long versionId) {
        DocumentVersion version = getVersion(versionId);
        return fileStorageService.loadFileAsResource(version.getFilePath());
    }

    @Override
    @Transactional
    public void deleteDocument(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu id=" + documentId));

        // Xóa file vật lý của tất cả versions
        List<DocumentVersion> versions = documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document);
        for (DocumentVersion v : versions) {
            fileStorageService.deleteFile(v.getFilePath());
        }

        documentRepository.delete(document);
    }

    private DocumentResponse mapToResponse(Document doc) {
        DocumentVersion cur = doc.getCurrentVersion();
        return DocumentResponse.builder()
                .id(doc.getId())
                .name(doc.getName())
                .description(doc.getDescription())
                .projectId(doc.getProject() != null ? doc.getProject().getId() : null)
                .projectName(doc.getProject() != null ? doc.getProject().getName() : null)
                .uploadedById(doc.getUploadedBy() != null ? doc.getUploadedBy().getId() : null)
                .uploadedByName(doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : null)
                .currentVersionId(cur != null ? cur.getId() : null)
                .currentVersionNumber(cur != null ? cur.getVersionNumber() : 1)
                .currentFilePath(cur != null ? cur.getFilePath() : null)
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    private DocumentVersionResponse mapVersionToResponse(DocumentVersion v) {
        String fileName = "document";
        if (v.getFilePath() != null) {
            int lastSlash = Math.max(v.getFilePath().lastIndexOf('/'), v.getFilePath().lastIndexOf('\\'));
            if (lastSlash >= 0) {
                fileName = v.getFilePath().substring(lastSlash + 1);
            }
        }
        return DocumentVersionResponse.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .filePath(v.getFilePath())
                .fileName(fileName)
                .changeDescription(v.getChangeDescription())
                .documentId(v.getDocument() != null ? v.getDocument().getId() : null)
                .editedById(v.getEditedBy() != null ? v.getEditedBy().getId() : null)
                .editedByName(v.getEditedBy() != null ? v.getEditedBy().getFullName() : null)
                .createdAt(v.getCreatedAt())
                .build();
    }
}