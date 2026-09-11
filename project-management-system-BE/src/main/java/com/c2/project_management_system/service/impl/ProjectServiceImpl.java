package com.c2.project_management_system.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.ProjectCreateRequest;
import com.c2.project_management_system.dto.request.ProjectUpdateRequest;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.ProjectMemberResponse;
import com.c2.project_management_system.dto.respone.ProjectResponse;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.ProjectMember;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.DuplicateResourceException;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.ProjectSpecification;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.ProjectService;
import com.c2.project_management_system.statusEnum.ProjectMemberRole;
import com.c2.project_management_system.statusEnum.ProjectStatus;
import com.c2.project_management_system.statusEnum.TaskStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final UserRepository userRepository;
	private final TaskRepository taskRepository;

	@Override
	@Transactional
	public ProjectResponse createProject(Long currentUserId, ProjectCreateRequest request) {

		validateProjectDates(request.getStartDate(), request.getEndDate());

		if (projectRepository.existsByNameIgnoreCaseAndProjectManager_Id(request.getName(), currentUserId)) {
			throw new DuplicateResourceException("Tên dự án đã tồn tại: " + request.getName());
		}

		User projectManager = getUserOrThrow(currentUserId);

		Project project = Project.builder().name(request.getName().trim()).description(request.getDescription())
				.startDate(request.getStartDate()).endDate(request.getEndDate()).status(ProjectStatus.PLANNING)
				.projectManager(projectManager).build();

		Project savedProject = projectRepository.save(project);

		/*
		 * PM cũng là một ProjectMember.
		 */
		addMemberInternal(savedProject, projectManager, ProjectMemberRole.PM);

		log.info("Tạo dự án '{}' id={} bởi user id={}", savedProject.getName(), savedProject.getId(), currentUserId);

		return toResponse(savedProject);
	}

	@Override
	@Transactional
	public ProjectResponse updateProject(Long projectId, Long currentUserId, ProjectUpdateRequest request,
			boolean isAdmin) {

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án"));

		if (!isAdmin) {
			validateProjectManager(project, currentUserId);
		}

		validateEditableStatus(project);

		validateProjectDates(request.getStartDate(), request.getEndDate());

		if (!project.getName().equalsIgnoreCase(request.getName().trim()) && projectRepository
				.existsByNameIgnoreCaseAndProjectManager_Id(request.getName().trim(), currentUserId)) {
			throw new IllegalArgumentException("Tên dự án đã tồn tại");
		}

		ProjectStatus currentStatus = project.getStatus();
		ProjectStatus newStatus = request.getStatus();

		if (!isAdmin) {
			validateStatusTransition(currentStatus, newStatus);
		}

		project.setName(request.getName().trim());
		project.setDescription(request.getDescription());
		project.setStartDate(request.getStartDate());
		project.setEndDate(request.getEndDate());
		if (newStatus != null) {
			project.setStatus(newStatus);
		}

		Project savedProject = projectRepository.save(project);

		return toResponse(savedProject);
	}

	@Override
	@Transactional
	public ProjectResponse closeProject(Long projectId, Long currentUserId, boolean isAdmin) {

		Project project = getProjectOrThrow(projectId);

		if (!isAdmin) {
			validateProjectManager(project, currentUserId);
		}

		if (project.getStatus() == ProjectStatus.CLOSED) {
			throw new InvalidOperationException("Dự án đã được đóng");
		}

		if (project.getStatus() == ProjectStatus.CANCELLED) {
			throw new InvalidOperationException("Dự án đã bị hủy, không thể đóng");
		}

		long unfinishedTasks = taskRepository.findByProject(project).stream()
				.filter(task -> task.getStatus() != TaskStatus.DONE && task.getStatus() != TaskStatus.CANCELLED)
				.count();

		if (unfinishedTasks > 0 && !isAdmin) {

			throw new InvalidOperationException(
					"Không thể đóng dự án. " + "Dự án còn " + unfinishedTasks + " công việc chưa hoàn thành.");
		}

		/*
		 * Dự án phải hoàn thành trước khi đóng.
		 */
		if (project.getStatus() != ProjectStatus.COMPLETED && !isAdmin) {

			throw new InvalidOperationException("Chỉ có thể đóng dự án ở trạng thái COMPLETED.");
		}

		project.setStatus(ProjectStatus.CLOSED);

		Project savedProject = projectRepository.save(project);

		log.info("Đóng dự án '{}' id={} bởi user id={}", savedProject.getName(), savedProject.getId(), currentUserId);

		return toResponse(savedProject);
	}

	@Override
	@Transactional
	public void deleteProject(Long projectId, Long currentUserId, boolean currentUserIsAdmin) {

		Project project = getProjectOrThrow(projectId);

		/*
		 * Chỉ Admin được quyền xóa vĩnh viễn.
		 */
		if (!currentUserIsAdmin) {
			throw new InvalidOperationException("Chỉ Admin mới có quyền xóa dự án");
		}

		/*
		 * Không cho xóa project đang hoạt động.
		 */
		if (project.getStatus() != ProjectStatus.PLANNING && project.getStatus() != ProjectStatus.CLOSED
				&& project.getStatus() != ProjectStatus.CANCELLED) {

			throw new InvalidOperationException(
					"Chỉ có thể xóa dự án ở trạng thái " + "PLANNING, CLOSED hoặc CANCELLED");
		}

		log.warn("Admin id={} xóa dự án '{}' id={}", currentUserId, project.getName(), project.getId());

		projectRepository.delete(project);
	}

	@Override
	@Transactional(readOnly = true)
	public ProjectResponse getProjectById(Long projectId) {

		return toResponse(getProjectOrThrow(projectId));
	}

	public ProjectResponse getProjectById(Long projectId, Long userId, boolean isAdmin) {

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án"));

		if (!isAdmin && !isProjectMemberOrManager(project, userId)) {
			throw new InvalidOperationException("Bạn không có quyền truy cập dự án này");
		}

		return toResponse(project);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProjectResponse> getAllProjects() {

		return projectRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProjectResponse> getProjectsForUser(Long userId, boolean isAdmin) {

		List<Project> projects;

		if (isAdmin) {
			projects = projectRepository.findAll();
		} else {
			projects = projectRepository.findProjectsForUser(userId);
		}

		return projects.stream().map(this::toResponse).toList();
	}

	private void validateProjectDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {

		if (startDate == null || endDate == null) {
			throw new InvalidOperationException("Ngày bắt đầu và ngày kết thúc không được để trống");
		}

		if (startDate.isAfter(endDate)) {
			throw new InvalidOperationException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
		}
	}

	private void validateEditableStatus(Project project) {

		if (project.getStatus() == ProjectStatus.CLOSED) {

			throw new InvalidOperationException("Dự án đã CLOSED, không thể chỉnh sửa");
		}

		if (project.getStatus() == ProjectStatus.CANCELLED) {

			throw new InvalidOperationException("Dự án đã CANCELLED, không thể chỉnh sửa");
		}
	}

	private void validateProjectManager(Project project, Long currentUserId) {

		if (!project.getProjectManager().getId().equals(currentUserId)) {

			throw new InvalidOperationException(
					"Bạn không có quyền thực hiện thao tác này. " + "Chỉ Project Manager mới được phép.");
		}
	}

	private User getUserOrThrow(Long userId) {

		return userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));
	}

	private Project getProjectOrThrow(Long projectId) {

		return projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));
	}

	private void addMemberInternal(Project project, User user, ProjectMemberRole role) {

		ProjectMember member = ProjectMember.builder().project(project).user(user).projectRole(role).build();

		projectMemberRepository.save(member);
	}

	private ProjectResponse toResponse(Project project) {

		int memberCount = projectMemberRepository.findByProject(project).size();

		return ProjectResponse.builder().id(project.getId()).name(project.getName())
				.description(project.getDescription()).startDate(project.getStartDate()).endDate(project.getEndDate())
				.status(project.getStatus()).projectManagerId(project.getProjectManager().getId())
				.projectManagerEmail(
						project.getProjectManager() != null ? project.getProjectManager().getEmail() : null)
				.projectManagerName(project.getProjectManager().getFullName()).memberCount(memberCount)
				.members(project.getMembers().stream().map(this::toProjectMemberDTO).collect(Collectors.toList()))
				.createdAt(project.getCreatedAt()).updatedAt(project.getUpdatedAt()).build();
	}

	private ProjectMemberResponse toProjectMemberDTO(ProjectMember member) {

		return ProjectMemberResponse.builder().id(member.getId()).projectId(member.getProject().getId())
				.userId(member.getUser().getId()).userFullName(member.getUser().getFullName())
				.userEmail(member.getUser().getEmail()).role(member.getProjectRole()).joinedAt(member.getJoinedAt())
				.build();
	}

	private boolean isProjectMemberOrManager(Project project, Long userId) {

		if (project.getProjectManager() != null && project.getProjectManager().getId().equals(userId)) {
			return true;
		}

		return project.getMembers().stream().anyMatch(member -> member.getUser().getId().equals(userId));
	}

	private void validateStatusTransition(ProjectStatus currentStatus, ProjectStatus newStatus) {

		if (currentStatus == newStatus) {
			return;
		}

		boolean valid = switch (currentStatus) {

		case PLANNING -> newStatus == ProjectStatus.IN_PROGRESS || newStatus == ProjectStatus.CANCELLED;

		case IN_PROGRESS -> newStatus == ProjectStatus.ON_HOLD || newStatus == ProjectStatus.COMPLETED
				|| newStatus == ProjectStatus.CANCELLED;

		case ON_HOLD -> newStatus == ProjectStatus.IN_PROGRESS || newStatus == ProjectStatus.CANCELLED;

		case COMPLETED -> newStatus == ProjectStatus.CLOSED;

		case CLOSED -> false;

		case CANCELLED -> false;
		};

		if (!valid) {
			throw new IllegalStateException("Không thể chuyển trạng thái từ " + currentStatus + " sang " + newStatus);
		}
	}

	@Override
	public PageResponse<ProjectResponse> getAdminProjects(String keyword, ProjectStatus status, Long projectManagerId,
			LocalDate startDateFrom, LocalDate startDateTo, Pageable pageable) {

		if (startDateFrom != null && startDateTo != null && startDateFrom.isAfter(startDateTo)) {

			throw new IllegalArgumentException("Ngày bắt đầu không được lớn hơn ngày kết thúc");
		}

		Specification<Project> specification = Specification.where(ProjectSpecification.keywordContains(keyword));

		specification = specification.and(ProjectSpecification.hasStatus(status));

		specification = specification.and(ProjectSpecification.hasProjectManager(projectManagerId));

		specification = specification.and(ProjectSpecification.startDateFrom(startDateFrom));

		specification = specification.and(ProjectSpecification.startDateTo(startDateTo));

		Page<Project> projectPage = projectRepository.findAll(specification, pageable);

		List<ProjectResponse> content = projectPage.getContent().stream().map(this::toResponse).toList();

		return PageResponse.<ProjectResponse>builder().content(content).page(projectPage.getNumber())
				.size(projectPage.getSize()).totalElements(projectPage.getTotalElements())
				.totalPages(projectPage.getTotalPages()).first(projectPage.isFirst()).last(projectPage.isLast())
				.build();
	}

	@Override
	public PageResponse<ProjectResponse> getMemberProjects(Long userId, int page, int size, String keyword,
			String status, String role, String sortBy, String direction) {

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

		ProjectStatus projectStatus = null;
		if (status != null && !status.isBlank()) {
			try {
				projectStatus = ProjectStatus.valueOf(status.trim().toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Trạng thái dự án không hợp lệ");
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

		Set<String> allowedSortFields = Set.of("name", "startDate", "endDate", "status", "joinedAt");
		if (!allowedSortFields.contains(sortBy)) {
			sortBy = "joinedAt";
		}

		String actualSortField;
		switch (sortBy) {
		case "name" -> actualSortField = "project.name";
		case "startDate" -> actualSortField = "project.startDate";
		case "endDate" -> actualSortField = "project.endDate";
		case "status" -> actualSortField = "project.status";
		case "joinedAt" -> actualSortField = "joinedAt";
		default -> actualSortField = "joinedAt";
		}

		Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
		Sort sort = Sort.by(sortDirection, actualSortField);
		Pageable pageable = PageRequest.of(page, size, sort);

		Page<ProjectMember> projectMemberPage = projectMemberRepository.findMemberProjects(userId, keyword,
				projectStatus, memberRole, pageable);

		List<ProjectResponse> content = projectMemberPage.getContent().stream()
				.map(pm -> this.toResponse(pm.getProject())).toList();

		return PageResponse.<ProjectResponse>builder().content(content).page(projectMemberPage.getNumber())
				.size(projectMemberPage.getSize()).totalElements(projectMemberPage.getTotalElements())
				.totalPages(projectMemberPage.getTotalPages()).first(projectMemberPage.isFirst())
				.last(projectMemberPage.isLast()).build();
	}
}