package com.c2.project_management_system.config;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.c2.project_management_system.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtProvider {

	@Value("${app.jwt.secret}")
	private String jwtSecret;

	@Value("${app.jwt.expire}")
	private long accessTokenExpirationMs;

	@Value("${app.jwt.refresh-expire}")
	private long refreshTokenExpirationMs;

	public long getRefreshTokenExpirationMs() {
		return refreshTokenExpirationMs;
	}

	public long getAccessTokenExpirationMs() {
		return accessTokenExpirationMs;
	}

	private SecretKey getSigningKey() {
		return Keys.hmacShaKeyFor(jwtSecret.getBytes());
	}

	public String generateAccessToken(User user) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + accessTokenExpirationMs);

		return Jwts.builder().subject(user.getEmail()).claim("userId", user.getId())
				.claim("role", user.getRole().name()).issuedAt(now).expiration(expiry).signWith(getSigningKey())
				.compact();
	}

	public String generateRefreshToken(User user) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + refreshTokenExpirationMs);

		return Jwts.builder().subject(user.getEmail()).claim("userId", user.getId()).issuedAt(now).expiration(expiry)
				.signWith(getSigningKey()).compact();
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
			return true;
		} catch (ExpiredJwtException ex) {
			log.warn("JWT het han: {}", ex.getMessage());
		} catch (MalformedJwtException ex) {
			log.warn("JWT khong dung dinh dang: {}", ex.getMessage());
		} catch (UnsupportedJwtException ex) {
			log.warn("JWT khong duoc ho tro: {}", ex.getMessage());
		} catch (SignatureException ex) {
			log.warn("Chu ky JWT khong hop le: {}", ex.getMessage());
		} catch (IllegalArgumentException ex) {
			log.warn("JWT rong hoac null: {}", ex.getMessage());
		}
		return false;
	}

	public Claims getClaims(String token) {
		return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
	}

	public String getEmailFromToken(String token) {
		return getClaims(token).getSubject();
	}

	public Long getUserIdFromToken(String token) {
		return getClaims(token).get("userId", Long.class);
	}

}
