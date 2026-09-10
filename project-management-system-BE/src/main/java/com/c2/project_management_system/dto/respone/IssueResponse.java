package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;

import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IssueResponse {
    private Long id;
    private String title;
    private String description;
    private IssueSeverity severity;
    private IssueStatus status;
    private Long projectId;
    private Long reporterId;
    private String reporterName;
    private Long assigneeId;
    private String assigneeName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}