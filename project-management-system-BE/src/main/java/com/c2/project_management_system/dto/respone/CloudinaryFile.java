package com.c2.project_management_system.dto.respone;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CloudinaryFile {

	private String fileUrl;

	private String publicId;

	private String fileName;

	private String contentType;

	private Long fileSize;
}