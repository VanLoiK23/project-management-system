package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IssueAttachmentResponse {

    private Long id;

    private String fileName;

    private String fileUrl;

    private LocalDateTime uploadedAt;

    private Long uploadedBy;

    private String uploadedByName;
}