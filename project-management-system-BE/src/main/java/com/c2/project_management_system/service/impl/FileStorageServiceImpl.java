package com.c2.project_management_system.service.impl;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.service.FileStorageService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path rootLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public FileStorageServiceImpl() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            log.error("Không thể tạo thư mục gốc uploads", e);
        }
    }

    @Override
    public String storeFile(Long projectId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidOperationException("Không thể tải lên file rỗng");
        }

        String rawFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");
        // Loại bỏ ký tự đặc biệt nguy hiểm
        String safeFileName = UUID.randomUUID().toString() + "_" + rawFileName.replaceAll("[^a-zA-Z0-9._-]", "_");

        try {
            Path projectDir = rootLocation.resolve("documents").resolve(String.valueOf(projectId));
            Files.createDirectories(projectDir);

            Path destination = projectDir.resolve(safeFileName).normalize();
            if (!destination.startsWith(rootLocation)) {
                throw new InvalidOperationException("Đường dẫn file không hợp lệ");
            }

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return destination.toString();
        } catch (IOException e) {
            log.error("Lỗi khi lưu trữ file {}", rawFileName, e);
            throw new InvalidOperationException("Lỗi khi lưu trữ file trên máy chủ: " + e.getMessage());
        }
    }

    @Override
    public Resource loadFileAsResource(String filePath) {
        try {
            Path file = Paths.get(filePath).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Không tìm thấy file hoặc không có quyền đọc: " + filePath);
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Đường dẫn file không hợp lệ: " + filePath);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            Path file = Paths.get(filePath).normalize();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Không thể xóa file vật lý: {}", filePath, e);
        }
    }
}