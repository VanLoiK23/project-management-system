package com.c2.project_management_system.dto.respone;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MilestoneResponse {

	private Long id;

	private String name;

	private LocalDate startDate;

	private LocalDate endDate;

	private Integer progressPercent;

	private String status;

	private Long projectId;

	private String projectName;

	private int taskCount;

	private int completedTaskCount;

	private List<Long> taskIds;

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;
}