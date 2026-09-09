package com.c2.project_management_system.service;

import com.c2.project_management_system.dto.request.LoginRequest;
import com.c2.project_management_system.dto.request.RegisterRequest;
import com.c2.project_management_system.dto.respone.AccountResponse;
import com.c2.project_management_system.dto.respone.LoginResponse;
import com.c2.project_management_system.dto.respone.TokenResponse;

import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

	LoginResponse login(LoginRequest request, HttpServletResponse response);

	void logout(String refreshToken, HttpServletResponse response);

	TokenResponse refreshToken(String rawToken, HttpServletResponse response);

	AccountResponse registerAccount(RegisterRequest request);

	AccountResponse findAccount(String email);
}