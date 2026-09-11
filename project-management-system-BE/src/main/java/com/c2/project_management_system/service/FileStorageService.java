package com.c2.project_management_system.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(Long projectId, MultipartFile file);
    Resource loadFileAsResource(String filePath);
    void deleteFile(String filePath);
}