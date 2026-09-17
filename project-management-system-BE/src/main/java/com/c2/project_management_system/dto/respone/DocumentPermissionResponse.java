package com.c2.project_management_system.dto.respone;

import com.c2.project_management_system.statusEnum.DocumentPermissionType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DocumentPermissionResponse {

    private Long id;

    private Long userId;

    private String userName;

    private String userEmail;

    private DocumentPermissionType permissionType;
}