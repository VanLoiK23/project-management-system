package com.c2.project_management_system.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
public class UserUpdateRequest {

	@NotBlank(message = "Họ tên không được để trống")
	@Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
	private String fullName;

	@NotBlank(message = "Email không được để trống")
	@Email(message = "Email không đúng định dạng")
	@Size(max = 100, message = "Email không được vượt quá 100 ký tự")
	private String email;

	@Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
	private String password;
}