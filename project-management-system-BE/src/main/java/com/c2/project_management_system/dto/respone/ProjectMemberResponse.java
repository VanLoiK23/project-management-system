package com.c2.project_management_system.dto.respone;

import com.c2.project_management_system.statusEnum.AccountStatus;
import com.c2.project_management_system.statusEnum.ProjectMemberRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberResponse {

    private Long id;
    private Long projectId;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private AccountStatus userStatus;
    private ProjectMemberRole role;
    private LocalDateTime joinedAt;
}
