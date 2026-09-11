package com.c2.project_management_system.config;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.statusEnum.AccountStatus;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final String HEADER_NAME = "Authorization";
	private static final String TOKEN_PREFIX = "Bearer ";

	private final JwtProvider jwtProvider;
	private final UserRepository userRepository;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		try {
			String token = resolveToken(request);

			if (StringUtils.hasText(token) && !token.equals("undefined") && !token.equals("null")
					&& jwtProvider.validateToken(token)) {
				String email = jwtProvider.getEmailFromToken(token);

				if (SecurityContextHolder.getContext().getAuthentication() == null) {
					Optional<User> userOpt = userRepository.findByEmail(email);

					if (userOpt.isPresent()) {
						User user = userOpt.get();

						if (user.getStatus() == AccountStatus.ACTIVE) {
							List<SimpleGrantedAuthority> authorities = List
									.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

							UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
									user, null, authorities);
							authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

							SecurityContextHolder.getContext().setAuthentication(authentication);
						} else {
							log.warn("Tai khoan {} da bi khoa, tu choi xac thuc.", email);
						}
					}
				}
			}
		} catch (Exception ex) {
			log.error("Khong the thiet lap xac thuc nguoi dung: {}", ex.getMessage());
		}

		filterChain.doFilter(request, response);
	}

	private String resolveToken(HttpServletRequest request) {
		String bearerToken = request.getHeader(HEADER_NAME);
		if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
			return bearerToken.substring(TOKEN_PREFIX.length()); // just select substring after Bearer
		}
		return null;
	}
}
