package com.c2.project_management_system.service.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.MilestoneCreateRequest;
import com.c2.project_management_system.dto.request.MilestoneUpdateRequest;
import com.c2.project_management_system.dto.respone.MilestoneResponse;
import com.c2.project_management_system.entity.Milestone;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.MilestoneRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.service.MilestoneService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Trien khai nghiep vu Module 6 - Quan ly lich trinh (Milestone/Sprint).
 *
 * Business rule bam sat tai lieu:
 * - Them lich trinh: kiem tra khong trung/chong cheo thoi gian voi
 *   lich trinh khac trong CUNG du an.
 * - Day la moc/milestone cap du an, khac voi Deadline cua tung cong viec.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MilestoneServiceImpl implements MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional
    public MilestoneResponse createMilestone(Long currentUserId, MilestoneCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + request.getProjectId()));

        validateDateRange(request.getStartDate(), request.getEndDate());
        checkOverlap(project, request.getStartDate(), request.getEndDate(), null);

        Milestone milestone = Milestone.builder()
                .name(request.getName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .project(project)
                .tasks(resolveTasks(request.getTaskIds()))
                .build();

        Milestone saved = milestoneRepository.save(milestone);
        log.info("Đã tạo lịch trình '{}' (id={}) cho dự án id={} bởi user id={}",
                saved.getName(), saved.getId(), project.getId(), currentUserId);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public MilestoneResponse updateMilestone(Long milestoneId, MilestoneUpdateRequest request) {
        Milestone milestone = getMilestoneOrThrow(milestoneId);

        validateDateRange(request.getStartDate(), request.getEndDate());
        checkOverlap(milestone.getProject(), request.getStartDate(), request.getEndDate(), milestoneId);

        milestone.setName(request.getName());
        milestone.setStartDate(request.getStartDate());
        milestone.setEndDate(request.getEndDate());
        if (request.getTaskIds() != null) {
            milestone.setTasks(resolveTasks(request.getTaskIds()));
        }

        return toResponse(milestoneRepository.save(milestone));
    }

    @Override
    @Transactional
    public void deleteMilestone(Long milestoneId) {
        Milestone milestone = getMilestoneOrThrow(milestoneId);
        milestoneRepository.delete(milestone);
    }

    @Override
    public MilestoneResponse getMilestoneById(Long milestoneId) {
        return toResponse(getMilestoneOrThrow(milestoneId));
    }

    @Override
    public List<MilestoneResponse> getMilestonesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));
        return milestoneRepository.findByProject(project).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void validateDateRange(java.time.LocalDate start, java.time.LocalDate end) {
        if (start.isAfter(end)) {
            throw new InvalidOperationException("Ngày bắt đầu phải trước ngày kết thúc");
        }
    }

    // Kiem tra trung/chong cheo thoi gian voi lich trinh khac trong cung du an
    private void checkOverlap(Project project, java.time.LocalDate start, java.time.LocalDate end, Long excludeId) {
        boolean overlap = milestoneRepository
                .findByProjectAndStartDateLessThanEqualAndEndDateGreaterThanEqual(project, end, start)
                .stream()
                .anyMatch(m -> !m.getId().equals(excludeId));
        if (overlap) {
            throw new InvalidOperationException("Khoảng thời gian bị trùng/chồng chéo với một lịch trình khác trong dự án này");
        }
    }

    private Set<Task> resolveTasks(List<Long> taskIds) {
        Set<Task> tasks = new HashSet<>();
        if (taskIds == null) return tasks;
        for (Long taskId : taskIds) {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc id=" + taskId));
            tasks.add(task);
        }
        return tasks;
    }

    private Milestone getMilestoneOrThrow(Long id) {
        return milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch trình id=" + id));
    }

    private MilestoneResponse toResponse(Milestone m) {
        return MilestoneResponse.builder()
                .id(m.getId())
                .name(m.getName())
                .startDate(m.getStartDate())
                .endDate(m.getEndDate())
                .projectId(m.getProject().getId())
                .projectName(m.getProject().getName())
                .taskIds(m.getTasks().stream().map(Task::getId).collect(Collectors.toList()))
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}