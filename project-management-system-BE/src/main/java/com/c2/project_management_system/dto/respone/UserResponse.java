package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;

import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;

    private String fullName;

    private String email;

    private AccountRole role;

    private AccountStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
