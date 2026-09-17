package com.c2.project_management_system.dto.request;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MilestoneCreateRequest {

    @NotBlank(message = "Tên Milestone không được để trống")
    @Size(max = 200, message = "Tên Milestone không được vượt quá 200 ký tự")
    private String name;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    @NotNull(message = "Dự án không được để trống")
    private Long projectId;

    private Set<Long> taskIds = new HashSet<>();
}