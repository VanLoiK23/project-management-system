package com.c2.project_management_system.dto.request;

import com.c2.project_management_system.statusEnum.ProjectMemberRole;

import jakarta.validation.constraints.NotNull;
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
public class ProjectMemberAddRequest {

	@NotNull(message = "Vui lòng chọn người dùng cần thêm")
	private Long userId;

	@NotNull(message = "Vui lòng chọn vai trò cho thành viên")
	private ProjectMemberRole role;

}
