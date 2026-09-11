package com.c2.project_management_system.service.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
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
import com.c2.project_management_system.service.EmailService;
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

    private final RedisTemplate<String, Object> redisTemplate;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final EmailService emailService;

    @Override
    @Transactional
    public LoginResponse login(
            LoginRequest request,
            HttpServletResponse response) {

        User user = findUserByEmailOrFullName(request.getUsernameOrEmail())
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Email/họ tên hoặc mật khẩu không chính xác"));

        if (user.getStatus() == AccountStatus.LOCKED) {
            throw new AccountLockedException();
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new InvalidCredentialsException(
                    "Email/họ tên hoặc mật khẩu không chính xác");
        }

        TokenResponse token = issueTokenPair(user, response);

        return LoginResponse.builder()
                .token(token)
                .user(toAccountResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(
            String refreshToken,
            HttpServletResponse response) {

        if (refreshToken != null) {
            refreshTokenRepository
                    .findByToken(refreshToken)
                    .ifPresent(refreshTokenRepository::delete);
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
    public String refreshToken(String rawToken) {

        if (rawToken == null || !jwtProvider.validateToken(rawToken)) {
            throw new RefreshTokenNotFoundException();
        }

        RefreshToken storedToken = refreshTokenRepository
                .findByToken(rawToken)
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

        return jwtProvider.generateAccessToken(user);
    }

    @Override
    @Transactional
    public AccountResponse registerAccount(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        if (AccountRole.ADMIN.equals(request.getRole())) {
            throw new IllegalArgumentException(
                    "Không thể đăng ký tài khoản ADMIN");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .status(AccountStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        return toAccountResponse(savedUser);
    }

    private TokenResponse issueTokenPair(
            User user,
            HttpServletResponse response) {

        String accessToken =
                jwtProvider.generateAccessToken(user);

        String refreshTokenValue =
                jwtProvider.generateRefreshToken(user);

        long expiryMs =
                jwtProvider.getRefreshTokenExpirationMs();

        RefreshToken refreshToken =
                RefreshToken.builder()
                        .token(refreshTokenValue)
                        .expiryDate(
                                LocalDateTime.now()
                                        .plus(Duration.ofMillis(expiryMs)))
                        .user(user)
                        .build();

        refreshTokenRepository.save(refreshToken);

        Cookie cookie =
                new Cookie("refresh_token", refreshTokenValue);

        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge((int) (expiryMs / 1000));

        response.addCookie(cookie);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(
                        jwtProvider.getAccessTokenExpirationMs() / 1000)
                .build();
    }

    /**
     * Đăng nhập bằng email hoặc họ tên.
     */
    private Optional<User> findUserByEmailOrFullName(
            String emailOrFullName) {

        Optional<User> user =
                userRepository.findByEmail(emailOrFullName);

        if (user.isPresent()) {
            return user;
        }

        return userRepository.findByFullName(emailOrFullName);
    }

    private AccountResponse toAccountResponse(User user) {

        return AccountResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    public AccountResponse findAccount(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User with email: "
                                        + email
                                        + " not found"));

        return toAccountResponse(user);
    }

    @Override
    public boolean generateTokenAndSendMailReset(String email) {

        userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Email not found"));

        String resetToken =
                UUID.randomUUID().toString();

        redisTemplate.opsForValue().set(
                "RESET_" + resetToken,
                email,
                15,
                TimeUnit.MINUTES);

        return emailService.sendResetEmail(
                email,
                resetToken);
    }

    @Override
    public boolean resetPassword(
            String token,
            String password) {

        String key = "RESET_" + token;

        String email =
                (String) redisTemplate
                        .opsForValue()
                        .get(key);

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "Token is expired or is incorrect");
        }

        User userEntity =
                userRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Email not found"));

        userEntity.setPassword(
                passwordEncoder.encode(password));

        userRepository.save(userEntity);

        redisTemplate.delete(key);

        return true;
    }
}