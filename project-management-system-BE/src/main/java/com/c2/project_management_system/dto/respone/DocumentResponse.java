package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {
    private Long id;
    private String name;
    private String description;
    private Long projectId;
    private String projectName;
    private Long uploadedById;
    private String uploadedByName;
    private Integer currentVersionNumber;
    private String currentFilePath;
    private Long currentVersionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}