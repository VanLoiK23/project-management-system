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
public class TaskCommentResponse {

    private Long id;

    private String content;

    private Long userId;

    private String userName;

    private LocalDateTime createdAt;
}