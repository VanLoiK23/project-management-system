package com.c2.project_management_system.service.impl;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.ProjectMemberAddRequest;
import com.c2.project_management_system.dto.request.ProjectMemberUpdateRoleRequest;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.ProjectMemberResponse;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.ProjectMember;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.DuplicateResourceException;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.ProjectMemberService;
import com.c2.project_management_system.statusEnum.AccountStatus;
import com.c2.project_management_system.statusEnum.ProjectMemberRole;
import com.c2.project_management_system.statusEnum.ProjectStatus;
import com.c2.project_management_system.statusEnum.TaskStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectMemberServiceImpl implements ProjectMemberService {

	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final UserRepository userRepository;
	private final TaskRepository taskRepository;

	@Override
	@Transactional
	public ProjectMemberResponse addMember(Long projectId, ProjectMemberAddRequest request) {

		Project project = getProjectOrThrow(projectId);

		validateProjectEditable(project);

		User user = userRepository.findById(request.getUserId()).orElseThrow(
				() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + request.getUserId()));

		if (projectMemberRepository.existsByProjectAndUser(project, user)) {

			throw new DuplicateResourceException(
					"Người dùng '" + user.getFullName() + "' đã là thành viên của dự án này");
		}

		if (request.getRole() == ProjectMemberRole.PM) {

			throw new InvalidOperationException(
					"Không thể thêm thành viên với vai trò PM. " + "Project Manager được xác định khi tạo dự án.");
		}

		ProjectMember member = ProjectMember.builder().project(project).user(user).projectRole(request.getRole())
				.build();

		ProjectMember saved = projectMemberRepository.save(member);

		log.info("Thêm '{}' vào project '{}' với role {}", user.getEmail(), project.getName(), request.getRole());

		return toResponse(saved);
	}

	@Override
	@Transactional
	public ProjectMemberResponse updateMemberRole(Long projectId, Long userId, ProjectMemberUpdateRoleRequest request) {

		Project project = getProjectOrThrow(projectId);

		validateProjectEditable(project);

		ProjectMember member = getMemberOrThrow(projectId, userId);

		if (member.getProjectRole() == ProjectMemberRole.PM) {

			throw new InvalidOperationException("Không thể thay đổi vai trò của Project Manager");
		}

		if (request.getRole() == ProjectMemberRole.PM) {

			throw new InvalidOperationException("Không thể chuyển thành viên thành PM");
		}

		member.setProjectRole(request.getRole());

		ProjectMember saved = projectMemberRepository.save(member);

		return toResponse(saved);
	}

	@Override
	@Transactional
	public void removeMember(Long projectId, Long userId) {

		Project project = getProjectOrThrow(projectId);

		validateProjectEditable(project);

		ProjectMember member = getMemberOrThrow(projectId, userId);

		if (member.getProjectRole() == ProjectMemberRole.PM) {

			throw new InvalidOperationException("Không thể xóa Project Manager khỏi dự án");
		}

		long ongoingTasks = taskRepository.findByProject(project).stream()
				.filter(task -> isAssignedTo(task, member.getUser()))
				.filter(task -> task.getStatus() != TaskStatus.DONE && task.getStatus() != TaskStatus.CANCELLED)
				.count();

		if (ongoingTasks > 0) {

			throw new InvalidOperationException("Thành viên '" + member.getUser().getFullName() + "' còn "
					+ ongoingTasks + " công việc chưa hoàn thành. " + "Vui lòng bàn giao hoặc hoàn thành "
					+ "công việc trước khi xóa.");
		}

		projectMemberRepository.delete(member);

		log.info("Xóa '{}' khỏi project id={}", member.getUser().getEmail(), projectId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProjectMemberResponse> getMembers(Long projectId) {

		Project project = getProjectOrThrow(projectId);

		return projectMemberRepository.findByProject(project).stream().map(this::toResponse)
				.collect(Collectors.toList());
	}

	@Override
	public PageResponse<ProjectMemberResponse> getMembersPagination(Long projectId, int page, int size, String keyword,
			String role, String status, String sortBy, String direction, Long currentUserId, boolean isAdmin) {

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dự án"));

		boolean isProjectManager = project.getProjectManager() != null
				&& project.getProjectManager().getId().equals(currentUserId);

		boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, (currentUserId));

		if (!isAdmin && !isProjectManager && !isMember) {
			throw new IllegalArgumentException("Bạn không có quyền xem thành viên của dự án này");
		}

		if (page < 0) {
			page = 0;
		}

		if (size <= 0) {
			size = 10;
		}

		if (size > 100) {
			size = 100;
		}

		if (keyword != null) {
			keyword = keyword.trim();

			if (keyword.isBlank()) {
				keyword = null;
			}
		}

		ProjectMemberRole memberRole = null;

		if (role != null && !role.isBlank()) {

			try {
				memberRole = ProjectMemberRole.valueOf(role.trim().toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Vai trò thành viên không hợp lệ");
			}
		}

		AccountStatus accountStatus = null;

		if (status != null && !status.isBlank()) {

			try {
				accountStatus = AccountStatus.valueOf(status.trim().toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Trạng thái tài khoản không hợp lệ");
			}
		}

		Set<String> allowedSortFields = Set.of("joinedAt", "fullName", "email", "role");

		if (!allowedSortFields.contains(sortBy)) {
			sortBy = "joinedAt";
		}

		String actualSortField;

		switch (sortBy) {

		case "fullName" -> actualSortField = "user.fullName";

		case "email" -> actualSortField = "user.email";

		case "role" -> actualSortField = "role";

		case "joinedAt" -> actualSortField = "joinedAt";

		default -> actualSortField = "joinedAt";
		}

		Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

		Sort sort = Sort.by(sortDirection, actualSortField);

		Pageable pageable = PageRequest.of(page, size, sort);

		Page<ProjectMember> memberPage = projectMemberRepository.searchMembers(projectId, keyword, memberRole,
				accountStatus, pageable);

		List<ProjectMemberResponse> content = memberPage.getContent().stream().map(this::toResponse).toList();

		return PageResponse.<ProjectMemberResponse>builder().content(content).page(memberPage.getNumber())
				.size(memberPage.getSize()).totalElements(memberPage.getTotalElements())
				.totalPages(memberPage.getTotalPages()).first(memberPage.isFirst()).last(memberPage.isLast()).build();
	}

	private void validateProjectEditable(Project project) {

		if (project.getStatus() == ProjectStatus.CLOSED) {

			throw new InvalidOperationException("Dự án đã CLOSED, không thể thay đổi thành viên");
		}

		if (project.getStatus() == ProjectStatus.CANCELLED) {

			throw new InvalidOperationException("Dự án đã CANCELLED, không thể thay đổi thành viên");
		}
	}

	private boolean isAssignedTo(Task task, User user) {

		return task.getAssignees() != null && task.getAssignees().contains(user);
	}

	private Project getProjectOrThrow(Long projectId) {

		return projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));
	}

	private ProjectMember getMemberOrThrow(Long projectId, Long userId) {

		Project project = getProjectOrThrow(projectId);

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

		return projectMemberRepository.findByProjectAndUser(project, user)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Người dùng '" + user.getFullName() + "' không phải thành viên " + "của dự án này"));
	}

	private ProjectMemberResponse toResponse(ProjectMember member) {

		return ProjectMemberResponse.builder().id(member.getId()).projectId(member.getProject().getId())
				.userId(member.getUser().getId()).userFullName(member.getUser().getFullName())
				.userEmail(member.getUser().getEmail()).role(member.getProjectRole()).joinedAt(member.getJoinedAt())
				.userStatus(member.getUser().getStatus()).build();
	}

	private Pageable createProjectPageable(int page, int size, String sortBy, String direction) {

		String sortField = switch (sortBy) {
		case "name" -> "project.name";
		case "startDate" -> "project.startDate";
		case "endDate" -> "project.endDate";
		case "status" -> "project.status";
		case "createdAt" -> "project.createdAt";
		default -> "project.createdAt";
		};

		Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

		return PageRequest.of(page, Math.min(size, 50), Sort.by(sortDirection, sortField));
	}
}