package com.c2.project_management_system.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentFolderCreateRequest {

    @NotBlank(message = "Tên thư mục không được để trống")
    @Size(max = 200, message = "Tên thư mục tối đa 200 ký tự")
    private String name;

    private Long parentId;
}