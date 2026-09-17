package com.c2.project_management_system.dto.request;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class TaskRequest {

	@NotBlank(message = "Tên công việc không được để trống")
	@Size(min = 2, max = 200, message = "Tên công việc phải từ 2 đến 200 ký tự")
	private String name;

	@Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
	private String description;

	@NotNull(message = "Deadline không được để trống")
	private LocalDateTime deadline;

	@NotBlank(message = "Độ ưu tiên không được để trống")
	private String priority;

	@NotEmpty(message = "Phải phân công ít nhất một thành viên")
	@Builder.Default
	private List<Long> assigneeIds = new ArrayList<>();
}