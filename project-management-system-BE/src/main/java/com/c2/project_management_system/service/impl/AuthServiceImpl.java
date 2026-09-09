package com.c2.project_management_system.service.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.config.JwtProvider;
import com.c2.project_management_system.dto.request.LoginRequest;
import com.c2.project_management_system.dto.request.RegisterRequest;
import com.c2.project_management_system.dto.respone.AccountResponse;
import com.c2.project_management_system.dto.respone.LoginResponse;
import com.c2.project_management_system.dto.respone.TokenResponse;
import com.c2.project_management_system.entity.RefreshToken;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.AccountLockedException;
import com.c2.project_management_system.exception.EmailAlreadyExistsException;
import com.c2.project_management_system.exception.InvalidCredentialsException;
import com.c2.project_management_system.exception.RefreshTokenNotFoundException;
import com.c2.project_management_system.repository.RefreshTokenRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.AuthService;
import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtProvider jwtProvider;

	@Override
	@Transactional
	public LoginResponse login(LoginRequest request, HttpServletResponse response) {
		User user = findUserByEmailOrUsername(request.getUsernameOrEmail())
				.orElseThrow(() -> new InvalidCredentialsException("Email/username hoặc mật khẩu không chính xác"));

		if (user.getStatus() == AccountStatus.LOCKED) {
			throw new AccountLockedException();
		}

		if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			throw new InvalidCredentialsException("Email/username hoặc mật khẩu không chính xác");
		}

		TokenResponse token = issueTokenPair(user, response);

		return LoginResponse.builder().token(token).user(toAccountResponse(user)).build();
	}

	@Override
	@Transactional
	public void logout(String refreshToken, HttpServletResponse response) {
		if (refreshToken != null) {
			refreshTokenRepository.findByToken(refreshToken).ifPresent(refreshTokenRepository::delete);
		}

		Cookie cookie = new Cookie("refresh_token", null);
		cookie.setHttpOnly(true);
		cookie.setSecure(false); 
		cookie.setPath("/");
		cookie.setMaxAge(0);

		response.addCookie(cookie);
		log.info("Đã xóa phiên đăng xuất và xóa Cookie refresh_token.");
	}

	@Override
	@Transactional
	public TokenResponse refreshToken(String rawToken, HttpServletResponse response) { 
		if (rawToken == null || !jwtProvider.validateToken(rawToken)) {
			throw new RefreshTokenNotFoundException();
		}

		RefreshToken storedToken = refreshTokenRepository.findByToken(rawToken)
				.orElseThrow(RefreshTokenNotFoundException::new);

		if (storedToken.isExpired()) {
			refreshTokenRepository.delete(storedToken);
			throw new RefreshTokenNotFoundException();
		}

		User user = storedToken.getUser();

		if (user.getStatus() == AccountStatus.LOCKED) {
			refreshTokenRepository.delete(storedToken);
			throw new AccountLockedException();
		}

		refreshTokenRepository.delete(storedToken);

		return issueTokenPair(user, response);
	}

	@Override
	@Transactional
	public AccountResponse registerAccount(RegisterRequest request) {
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new EmailAlreadyExistsException(request.getEmail());
		}

		if (AccountRole.ADMIN.equals(request.getRole())) {
			throw new IllegalArgumentException("Vai trò không hợp lệ");
		}

		User user = User.builder().fullName(request.getFullName()).email(request.getEmail())
				.password(passwordEncoder.encode(request.getPassword())).role(request.getRole())
				.status(AccountStatus.ACTIVE).build();

		User saved = userRepository.save(user);

		return toAccountResponse(saved);
	}

	private TokenResponse issueTokenPair(User user, HttpServletResponse response) {
		String accessToken = jwtProvider.generateAccessToken(user);
		String refreshTokenValue = jwtProvider.generateRefreshToken(user);

		long expiryMs = jwtProvider.getRefreshTokenExpirationMs();
		RefreshToken refreshToken = RefreshToken.builder()
				.token(refreshTokenValue)
				.expiryDate(LocalDateTime.now().plus(Duration.ofMillis(expiryMs)))
				.user(user)
				.build();

		refreshTokenRepository.save(refreshToken);

		Cookie cookie = new Cookie("refresh_token", refreshTokenValue);
		cookie.setHttpOnly(true);
		cookie.setSecure(false); 
		cookie.setPath("/");
		cookie.setMaxAge((int) (expiryMs / 1000)); 
		
		response.addCookie(cookie);

		return TokenResponse.builder()
				.accessToken(accessToken)
				.tokenType("Bearer")
				.expiresIn(jwtProvider.getAccessTokenExpirationMs() / 1000)
				.build();
	}

	private Optional<User> findUserByEmailOrUsername(String emailOrUsername) {
		return userRepository.findByEmail(emailOrUsername).or(() -> userRepository.findByUsername(emailOrUsername));
	}

	private AccountResponse toAccountResponse(User user) {
		return AccountResponse.builder().id(user.getId()).fullName(user.getFullName()).email(user.getEmail())
				.username(user.getUsername()).role(user.getRole()).status(user.getStatus())
				.createdAt(user.getCreatedAt()).build();
	}

	@Override
	public AccountResponse findAccount(String email) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new InvalidCredentialsException("Email/username hoặc mật khẩu không chính xác"));

		return toAccountResponse(user);
	}
}
