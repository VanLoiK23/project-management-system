package com.c2.project_management_system.service.impl;

import java.io.IOException;
import java.net.MalformedURLException;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.respone.CloudinaryFile;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.service.FileStorageService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

	private final Cloudinary cloudinary;

	@Override
	public CloudinaryFile uploadFile(Long projectId, MultipartFile file) {

		if (file == null || file.isEmpty()) {
			throw new InvalidOperationException("File không được để trống");
		}

		String originalFileName = file.getOriginalFilename();

		if (originalFileName == null || originalFileName.isBlank()) {
			originalFileName = "document";
		}

		String safeFileName = originalFileName.replace("\\", "_").replace("/", "_").replaceAll("[^a-zA-Z0-9._-]", "_");

		if (safeFileName.length() > 180) {
			safeFileName = safeFileName.substring(safeFileName.length() - 180);
		}

		String publicId = "project_documents/" + projectId + "/" + java.util.UUID.randomUUID() + "_" + safeFileName;

		try {
			var uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("public_id", publicId,
					"resource_type", "raw", "use_filename", false, "unique_filename", false, "overwrite", false));

			Object secureUrlObject = uploadResult.get("secure_url");

			if (secureUrlObject == null) {
				throw new InvalidOperationException("Cloudinary không trả về secure_url");
			}

			String secureUrl = secureUrlObject.toString();

			return CloudinaryFile.builder().fileUrl(secureUrl).publicId(publicId).fileName(originalFileName)
					.contentType(file.getContentType()).fileSize(file.getSize()).build();

		} catch (IOException e) {
			e.printStackTrace();
			throw new InvalidOperationException("Không thể đọc file để upload lên Cloudinary");
		} catch (Exception e) {
			e.printStackTrace();
			throw new InvalidOperationException("Không thể upload file lên Cloudinary: " + e.getMessage());
		}
	}

	@Override
	public CloudinaryFile uploadIssueImage(Long issueId, MultipartFile file) {

		if (file == null || file.isEmpty()) {
			throw new InvalidOperationException("Ảnh không được để trống");
		}

		String contentType = file.getContentType();

		if (contentType == null || !contentType.startsWith("image/")) {
			throw new InvalidOperationException("File tải lên phải là hình ảnh");
		}

		if (file.getSize() > 5 * 1024 * 1024) {
			throw new InvalidOperationException("Ảnh không được vượt quá 5MB");
		}

		String originalFileName = file.getOriginalFilename();

		if (originalFileName == null || originalFileName.isBlank()) {
			originalFileName = "issue-image";
		}

		String safeFileName = originalFileName.replace("\\", "_").replace("/", "_").replaceAll("[^a-zA-Z0-9._-]", "_");

		if (safeFileName.length() > 150) {
			safeFileName = safeFileName.substring(safeFileName.length() - 150);
		}

		String publicId = "issue_images/" + issueId + "/" + java.util.UUID.randomUUID() + "_" + safeFileName;

		try {

			var uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("public_id", publicId,
					"resource_type", "image", "use_filename", false, "unique_filename", false, "overwrite", false));

			Object secureUrlObject = uploadResult.get("secure_url");

			if (secureUrlObject == null) {
				throw new InvalidOperationException("Cloudinary không trả về secure_url");
			}

			return CloudinaryFile.builder().fileUrl(secureUrlObject.toString()).publicId(publicId)
					.fileName(originalFileName).contentType(contentType).fileSize(file.getSize()).build();

		} catch (IOException e) {
			throw new InvalidOperationException("Không thể đọc ảnh để upload lên Cloudinary");
		} catch (Exception e) {
			throw new InvalidOperationException("Không thể upload ảnh lên Cloudinary: " + e.getMessage());
		}
	}

	@Override
	public Resource loadFileAsResource(String fileUrl) {

		if (fileUrl == null || fileUrl.isBlank()) {
			throw new InvalidOperationException("Không tìm thấy đường dẫn file");
		}

		try {

			return new UrlResource(fileUrl);

		} catch (MalformedURLException e) {
			throw new InvalidOperationException("URL file Cloudinary không hợp lệ");
		}
	}

	@Override
	public void deleteFile(String publicId) {

		if (publicId == null || publicId.isBlank()) {
			return;
		}

		try {

			cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw", "invalidate", true));

		} catch (IOException e) {

			throw new InvalidOperationException("Không thể xóa file khỏi Cloudinary");
		}
	}
}