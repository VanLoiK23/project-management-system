package com.c2.project_management_system.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.LoginRequest;
import com.c2.project_management_system.dto.request.RegisterRequest;
import com.c2.project_management_system.dto.respone.AccountResponse;
import com.c2.project_management_system.dto.respone.LoginResponse;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.dto.respone.TokenResponse;
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
	public ResponseEntity<TokenResponse> refresh(
			@CookieValue(name = "refresh_token", required = false) String refreshToken, HttpServletResponse response) {
		return ResponseEntity.ok(authService.refreshToken(refreshToken, response));
	}

	@PostMapping("/register")
	public ResponseEntity<AccountResponse> registerAccount(@Valid @RequestBody RegisterRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerAccount(request));
	}

	@GetMapping("/account")
	public ResponseEntity<AccountResponse> findAccount(@AuthenticationPrincipal UserDetails userDetails) {
		String email = userDetails != null && userDetails.getUsername() != null ? userDetails.getUsername() : "";

		return ResponseEntity.ok(authService.findAccount(email));
	}
}
