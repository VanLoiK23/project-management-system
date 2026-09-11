package com.c2.project_management_system.dto.respone;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MilestoneResponse {
    private Long id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long projectId;
    private String projectName;
    private List<Long> taskIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}