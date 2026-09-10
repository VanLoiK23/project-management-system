package com.c2.project_management_system.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
	@NotBlank(message = "Trường email bắt buộc phải có!!")
	@Email(message = "Định dạng email không chính xác, thử lại!!")
	private String email;
}
