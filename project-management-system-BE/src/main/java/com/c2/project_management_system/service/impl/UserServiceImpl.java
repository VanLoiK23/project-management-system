package com.c2.project_management_system.service.impl;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.RegisterRequest;
import com.c2.project_management_system.dto.request.UserRoleUpdateRequest;
import com.c2.project_management_system.dto.request.UserUpdateRequest;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.UserResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.UserService;
import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional(readOnly = true)
	public List<UserResponse> searchUsers(String q) {

		String keyword = q == null ? "" : q.trim();

		return userRepository.searchUsers(keyword).stream().map(this::toResponse).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<UserResponse> getUsers(String keyword, String role, String status, Pageable pageable) {

		AccountRole accountRole = null;
		AccountStatus accountStatus = null;

		if (role != null && !role.isBlank()) {
			try {
				accountRole = AccountRole.valueOf(role.trim().toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Vai trò không hợp lệ");
			}
		}

		if (status != null && !status.isBlank()) {
			try {
				accountStatus = AccountStatus.valueOf(status.trim().toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Trạng thái không hợp lệ");
			}
		}

		Page<User> page = userRepository.findUsersByFilters(keyword, accountRole, accountStatus, pageable);

		return toPageResponse(page);
	}

	@Override
	@Transactional(readOnly = true)
	public UserResponse getUserById(Long userId) {

		User user = findUser(userId);

		return toResponse(user);
	}

	@Override
	public UserResponse createUser(RegisterRequest request) {

		String email = normalizeEmail(request.getEmail());

		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new IllegalArgumentException("Email đã tồn tại");
		}

		User user = User.builder().fullName(request.getFullName().trim()).email(email)
				.password(passwordEncoder.encode(request.getPassword())).role(request.getRole())
				.status(AccountStatus.ACTIVE).build();

		User savedUser = userRepository.save(user);

		return toResponse(savedUser);
	}

	@Override
	public UserResponse updateUser(Long userId, UserUpdateRequest request) {

		User user = findUser(userId);

		String email = normalizeEmail(request.getEmail());

		if (!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmailIgnoreCase(email)) {

			throw new IllegalArgumentException("Email đã tồn tại");
		}

		user.setFullName(request.getFullName().trim());
		user.setEmail(email);

		if (request.getPassword() != null && !request.getPassword().isBlank()) {

			user.setPassword(passwordEncoder.encode(request.getPassword()));
		}

		return toResponse(userRepository.save(user));
	}

	@Override
	public void deleteUser(Long userId, Long currentUserId) {

		User user = findUser(userId);

		if (userId.equals(currentUserId)) {
			throw new IllegalArgumentException("Không thể xóa tài khoản đang đăng nhập");
		}

		if (!user.getManagedProjects().isEmpty()) {
			throw new IllegalArgumentException("Không thể xóa tài khoản vì người dùng đang quản lý dự án");
		}

		if (!user.getProjectMemberships().isEmpty()) {
			throw new IllegalArgumentException("Không thể xóa tài khoản vì người dùng đang là thành viên dự án");
		}

		if (!user.getAssignedTasks().isEmpty()) {
			throw new IllegalArgumentException("Không thể xóa tài khoản vì người dùng đang được phân công công việc");
		}

		if (!user.getReportedIssues().isEmpty() || !user.getAssignedIssues().isEmpty()) {

			throw new IllegalArgumentException("Không thể xóa tài khoản vì người dùng còn vấn đề/lỗi liên quan");
		}

		userRepository.delete(user);
	}

	@Override
	public UserResponse updateStatus(Long userId, AccountStatus status, Long currentUserId) {

		User user = findUser(userId);

		AccountStatus newStatus = status;

		if (userId.equals(currentUserId) && newStatus == AccountStatus.LOCKED) {

			throw new IllegalArgumentException("Không thể tự khóa tài khoản đang đăng nhập");
		}

		if (user.getStatus() == newStatus) {
			return toResponse(user);
		}

		user.setStatus(newStatus);

		return toResponse(userRepository.save(user));
	}

	@Override
	public UserResponse updateRole(Long userId, UserRoleUpdateRequest request, Long currentUserId) {

		User user = findUser(userId);

		AccountRole newRole = request.getRole();

		if (userId.equals(currentUserId) && user.getRole() == AccountRole.ADMIN && newRole != AccountRole.ADMIN) {

			throw new IllegalArgumentException("Không thể tự hạ quyền Admin của chính mình");
		}

		if (user.getRole() == AccountRole.ADMIN && newRole != AccountRole.ADMIN) {

			long adminCount = userRepository.countByRoleAndStatus(AccountRole.ADMIN, AccountStatus.ACTIVE);

			if (adminCount <= 1) {
				throw new IllegalArgumentException(
						"Không thể hạ quyền vì hệ thống phải có ít nhất một Admin đang hoạt động");
			}
		}

		user.setRole(newRole);

		return toResponse(userRepository.save(user));
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<UserResponse> searchUsers(String keyword, Pageable pageable) {

		if (keyword == null || keyword.isBlank()) {

			Page<User> page = userRepository.findAll(pageable);

			return toPageResponse(page);
		}

		Page<User> page = userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword.trim(),
				keyword.trim(), pageable);

		return toPageResponse(page);
	}

	private User findUser(Long userId) {

		return userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + userId));
	}

	private String normalizeEmail(String email) {

		return email.trim().toLowerCase(Locale.ROOT);
	}

	private UserResponse toResponse(User user) {

		return UserResponse.builder().id(user.getId()).fullName(user.getFullName()).email(user.getEmail())
				.role(user.getRole()).status(user.getStatus()).createdAt(user.getCreatedAt())
				.updatedAt(user.getUpdatedAt()).build();
	}

	private PageResponse<UserResponse> toPageResponse(Page<User> page) {

		return PageResponse.<UserResponse>builder().content(page.getContent().stream().map(this::toResponse).toList())
				.page(page.getNumber()).size(page.getSize()).totalElements(page.getTotalElements())
				.totalPages(page.getTotalPages()).first(page.isFirst()).last(page.isLast()).build();
	}

	@Override
	public List<UserResponse> findUserByRole(AccountRole role) {

		List<User> users = userRepository.findByRole(role);

		return users.stream().map(this::toResponse).collect(Collectors.toList());
	}

}
