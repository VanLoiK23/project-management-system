package com.c2.project_management_system.service;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

import com.c2.project_management_system.dto.respone.CloudinaryFile;

public interface FileStorageService {

	CloudinaryFile uploadFile(Long projectId, MultipartFile file);
	
	CloudinaryFile uploadIssueImage(Long issueId, MultipartFile file);

	Resource loadFileAsResource(String fileUrl);

	void deleteFile(String publicId);
}