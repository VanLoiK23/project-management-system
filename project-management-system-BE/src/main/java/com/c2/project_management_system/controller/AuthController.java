package com.c2.project_management_system.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.ForgotPasswordRequest;
import com.c2.project_management_system.dto.request.LoginRequest;
import com.c2.project_management_system.dto.request.RegisterRequest;
import com.c2.project_management_system.dto.request.ResetPasswordRequest;
import com.c2.project_management_system.dto.respone.AccountResponse;
import com.c2.project_management_system.dto.respone.LoginResponse;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.AuthService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController("authResController")
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
		return ResponseEntity.ok(authService.login(request, response));
	}

	@PostMapping("/logout")
	public ResponseEntity<MessageResponse> logout(
			@CookieValue(name = "refresh_token", required = false) String refreshToken, HttpServletResponse response) {

		authService.logout(refreshToken, response);
		return ResponseEntity.ok(MessageResponse.builder().message("Đăng xuất thành công").build());
	}

	@PostMapping("/refresh")
	public ResponseEntity<?> refresh(@CookieValue(name = "refresh_token", required = false) String refreshToken) {
		return ResponseEntity.ok(Map.of("accessToken", authService.refreshToken(refreshToken)));
	}

	@PostMapping("/register")
	public ResponseEntity<AccountResponse> registerAccount(@Valid @RequestBody RegisterRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerAccount(request));
	}

	@GetMapping("/account")
	public ResponseEntity<AccountResponse> findAccount(Authentication authentication) {
		User user = currentUser(authentication);

		return ResponseEntity.ok(authService.findAccount(user.getEmail()));
	}

	@PostMapping("forgot-password")
	public ResponseEntity<?> sendEmailForgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {

		boolean success = authService.generateTokenAndSendMailReset(request.getEmail());

		return ResponseEntity.ok(Map.of("success", success));
	}

	@PostMapping("reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {

		boolean success = authService.resetPassword(request.getToken(), request.getPassword());

		return ResponseEntity.ok(Map.of("success", success));
	}

	private User currentUser(Authentication authentication) {

		if (authentication == null || authentication.getPrincipal() == null) {

			throw new IllegalStateException("Không xác định được người dùng hiện tại");
		}

		return (User) authentication.getPrincipal();
	}

}