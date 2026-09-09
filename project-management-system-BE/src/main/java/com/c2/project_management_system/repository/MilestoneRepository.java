package com.c2.project_management_system.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Milestone;
import com.c2.project_management_system.entity.Project;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByProject(Project project);

    // Ho tro kiem tra trung / chong cheo thoi gian voi lich trinh khac trong cung du an
    List<Milestone> findByProjectAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Project project, LocalDate end, LocalDate start);
}
