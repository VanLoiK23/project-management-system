package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;
import java.util.List;

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
public class TaskResponse {

    private Long id;

    private String name;

    private String description;

    private LocalDateTime deadline;

    private String priority;

    private String status;

    private Integer progressPercent;

    private Long projectId;

    private String projectName;

    private List<AssigneeResponse> assignees;

    private List<TaskCommentResponse> comments;

    // =====================================================
    // ASSIGNEE RESPONSE
    // =====================================================

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssigneeResponse {

        private Long id;

        private String fullName;

        private String email;
    }
}