package com.c2.project_management_system.service;

import java.util.List;

import org.springframework.data.domain.Pageable;

import com.c2.project_management_system.dto.request.RegisterRequest;
import com.c2.project_management_system.dto.request.UserRoleUpdateRequest;
import com.c2.project_management_system.dto.request.UserStatusUpdateRequest;
import com.c2.project_management_system.dto.request.UserUpdateRequest;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.UserResponse;
import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

public interface UserService {
	List<UserResponse> searchUsers(String q);
	
	List<UserResponse> findUserByRole(AccountRole role);

	PageResponse<UserResponse> getUsers(String keyword, String role, String status, Pageable pageable);

	UserResponse getUserById(Long userId);

	UserResponse createUser(RegisterRequest request);

	UserResponse updateUser(Long userId, UserUpdateRequest request);

	void deleteUser(Long userId, Long currentUserId);

	UserResponse updateStatus(Long userId, AccountStatus status, Long currentUserId);

	UserResponse updateRole(Long userId, UserRoleUpdateRequest request, Long currentUserId);

	PageResponse<UserResponse> searchUsers(String keyword, Pageable pageable);
}
