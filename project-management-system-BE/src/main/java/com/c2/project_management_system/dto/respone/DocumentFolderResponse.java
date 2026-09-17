package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DocumentFolderResponse {

    private Long id;

    private String name;

    private Long projectId;

    private Long parentId;

    private int documentCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}