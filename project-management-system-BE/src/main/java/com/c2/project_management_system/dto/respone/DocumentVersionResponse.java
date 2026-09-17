package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DocumentVersionResponse {

    private Long id;

    private Integer versionNumber;

    private String fileName;

    private String contentType;

    private Long fileSize;

    private String changeDescription;

    private Long documentId;

    private Long editedById;

    private String editedByName;

    private LocalDateTime createdAt;

    private boolean current;
}