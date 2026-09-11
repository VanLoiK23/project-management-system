package com.c2.project_management_system.controller;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.RegisterRequest;
import com.c2.project_management_system.dto.request.UserRoleUpdateRequest;
import com.c2.project_management_system.dto.request.UserUpdateRequest;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.UserResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.UserService;
import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController("userResController")
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
	private final UserService userService;

	@GetMapping("/search")
	public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam(required = false, defaultValue = "") String q) {

		return ResponseEntity.ok(userService.searchUsers(q));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/pm")
	public ResponseEntity<List<UserResponse>> getAllPM(Authentication authentication) {
		requireAdmin(authentication);

		return ResponseEntity.ok(userService.findUserByRole(AccountRole.PM));
	}

	@GetMapping
	public ResponseEntity<PageResponse<UserResponse>> getUsers(Authentication authentication,

			@RequestParam(required = false) String keyword,

			@RequestParam(required = false) String role,

			@RequestParam(required = false) String status,

			@RequestParam(defaultValue = "0") int page,

			@RequestParam(defaultValue = "10") int size,

			@RequestParam(defaultValue = "createdAt") String sortBy,

			@RequestParam(defaultValue = "desc") String direction) {

		requireAdmin(authentication);

		if (page < 0) {
			page = 0;
		}

		if (size < 1 || size > 100) {
			size = 10;
		}

		String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

		Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

		return ResponseEntity.ok(userService.getUsers(cleanKeyword, role, status, pageable));
	}

	@GetMapping("/{userId}")
	public ResponseEntity<UserResponse> getUserById(Authentication authentication, @PathVariable Long userId) {

		requireAdmin(authentication);

		return ResponseEntity.ok(userService.getUserById(userId));
	}

//	@GetMapping("/search")
//	public ResponseEntity<PageResponse<UserResponse>> searchUsers(Authentication authentication,
//
//			@RequestParam(required = false) String q,
//
//			@RequestParam(defaultValue = "0") int page,
//
//			@RequestParam(defaultValue = "10") int size) {
//
//		requireAdmin(authentication);
//
//		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "fullName"));
//
//		return ResponseEntity.ok(userService.searchUsers(q, pageable));
//	}

	@PostMapping
	public ResponseEntity<UserResponse> createUser(Authentication authentication,
			@Valid @RequestBody RegisterRequest request) {

		requireAdmin(authentication);

		UserResponse response = userService.createUser(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("/{userId}")
	public ResponseEntity<UserResponse> updateUser(Authentication authentication, @PathVariable Long userId,
			@Valid @RequestBody UserUpdateRequest request) {

		requireAdmin(authentication);

		return ResponseEntity.ok(userService.updateUser(userId, request));
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<MessageResponse> deleteUser(Authentication authentication, @PathVariable Long userId) {

		requireAdmin(authentication);

		Long currentUserId = currentUser(authentication).getId();

		userService.deleteUser(userId, currentUserId);

		return ResponseEntity.ok(MessageResponse.builder().message("Xóa tài khoản thành công").build());
	}

	@PostMapping("/{userId}/lock")
	public ResponseEntity<UserResponse> lockAccount(Authentication authentication, @PathVariable Long userId) {

		requireAdmin(authentication);

		Long currentUserId = currentUser(authentication).getId();

		return ResponseEntity.ok(userService.updateStatus(userId, AccountStatus.LOCKED, currentUserId));
	}

	@PostMapping("/{userId}/unlock")
	public ResponseEntity<UserResponse> unLockAccount(Authentication authentication, @PathVariable Long userId) {

		requireAdmin(authentication);

		Long currentUserId = currentUser(authentication).getId();

		return ResponseEntity.ok(userService.updateStatus(userId, AccountStatus.ACTIVE, currentUserId));
	}

	@PutMapping("/{userId}/role")
	public ResponseEntity<UserResponse> updateRole(Authentication authentication, @PathVariable Long userId,
			@Valid @RequestBody UserRoleUpdateRequest request) {

		requireAdmin(authentication);

		Long currentUserId = currentUser(authentication).getId();

		return ResponseEntity.ok(userService.updateRole(userId, request, currentUserId));
	}

	private User currentUser(Authentication authentication) {

		return (User) authentication.getPrincipal();
	}

	private void requireAdmin(Authentication authentication) {

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch(authority -> authority.equals("ROLE_ADMIN"));

		if (!isAdmin) {
			throw new org.springframework.security.access.AccessDeniedException(
					"Bạn không có quyền thực hiện thao tác này");
		}
	}
}
