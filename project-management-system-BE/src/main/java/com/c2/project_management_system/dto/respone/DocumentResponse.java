package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;

import com.c2.project_management_system.statusEnum.DocumentVisibility;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DocumentResponse {

	private Long id;

	private String name;

	private String description;

	private Long projectId;

	private String projectName;

	private Long folderId;

	private String folderName;

	private DocumentVisibility visibility;

	private Long uploadedById;

	private String uploadedByName;

	private Long currentVersionId;

	private Integer currentVersionNumber;

	private String currentFileName;

	private String currentContentType;

	private Long currentFileSize;
	
    private Boolean canDownload;
    private Boolean canEdit;

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;
}