package com.c2.project_management_system.dto.request;

import com.c2.project_management_system.statusEnum.DocumentPermissionType;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentPermissionRequest {

    @NotNull
    private Long userId;

    @NotNull
    private DocumentPermissionType permissionType;
}