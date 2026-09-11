package com.c2.project_management_system.dto.respone;

import com.c2.project_management_system.statusEnum.ProjectStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {

    private Long id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private ProjectStatus status;
    private Long projectManagerId;
    private String projectManagerName;
    private String projectManagerEmail;
    private int memberCount;
    private List<ProjectMemberResponse> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
