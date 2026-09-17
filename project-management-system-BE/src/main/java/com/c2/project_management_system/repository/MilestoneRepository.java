package com.c2.project_management_system.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Milestone;
import com.c2.project_management_system.entity.Project;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByProjectOrderByStartDateAsc(Project project);

    List<Milestone> findByProjectIdOrderByStartDateAsc(Long projectId);

    boolean existsByProjectIdAndNameIgnoreCase(
            Long projectId,
            String name
    );

    boolean existsByProjectIdAndNameIgnoreCaseAndIdNot(
            Long projectId,
            String name,
            Long milestoneId
    );

    @Query("""
        SELECT m
        FROM Milestone m
        JOIN m.tasks t
        WHERE t.id = :taskId
    """)
    List<Milestone> findByTaskId(@Param("taskId") Long taskId);

    @Query("""
        SELECT DISTINCT m
        FROM Milestone m
        JOIN m.tasks t
        WHERE t.id = :taskId
    """)
    List<Milestone> findDistinctByTaskId(@Param("taskId") Long taskId);

    @Query("""
        SELECT m
        FROM Milestone m
        WHERE m.project.id = :projectId
          AND m.startDate <= :endDate
          AND m.endDate >= :startDate
          AND (:milestoneId IS NULL OR m.id <> :milestoneId)
    """)
    List<Milestone> findOverlappingMilestones(
            @Param("projectId") Long projectId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("milestoneId") Long milestoneId
    );
}