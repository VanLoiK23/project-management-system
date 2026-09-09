package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.ProgressReport;
import com.c2.project_management_system.entity.Project;

@Repository
public interface ProgressReportRepository extends JpaRepository<ProgressReport, Long> {

    List<ProgressReport> findByProjectOrderByCreatedAtDesc(Project project);
}
