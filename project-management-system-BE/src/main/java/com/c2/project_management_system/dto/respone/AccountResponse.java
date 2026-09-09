package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;

import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

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
public class AccountResponse {

    private Long id;
    private String fullName;
    private String email;
    private String username;
    private AccountRole role;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
