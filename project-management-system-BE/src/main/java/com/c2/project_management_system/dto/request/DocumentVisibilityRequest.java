package com.c2.project_management_system.dto.request;

import com.c2.project_management_system.statusEnum.DocumentVisibility;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentVisibilityRequest {

    @NotNull(message = "Quyền truy cập không được để trống")
    private DocumentVisibility visibility;
}