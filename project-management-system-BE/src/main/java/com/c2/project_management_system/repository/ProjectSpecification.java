package com.c2.project_management_system.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.domain.Specification;

import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.statusEnum.ProjectStatus;

public class ProjectSpecification {

    private ProjectSpecification() {
    }

    public static Specification<Project> keywordContains(
            String keyword) {

        return (root, query, cb) -> {

            if (keyword == null || keyword.isBlank()) {
                return null;
            }

            String value =
                    "%" + keyword.trim().toLowerCase() + "%";

            return cb.or(
                    cb.like(
                            cb.lower(root.get("name")),
                            value
                    ),
                    cb.like(
                            cb.lower(root.get("description")),
                            value
                    )
            );
        };
    }

    public static Specification<Project> hasStatus(
            ProjectStatus status) {

        return (root, query, cb) -> {

            if (status == null) {
                return null;
            }

            return cb.equal(
                    root.get("status"),
                    status
            );
        };
    }

    public static Specification<Project> hasProjectManager(
            Long projectManagerId) {

        return (root, query, cb) -> {

            if (projectManagerId == null) {
                return null;
            }

            return cb.equal(
                    root.get("projectManager").get("id"),
                    projectManagerId
            );
        };
    }

    public static Specification<Project> startDateFrom(
            LocalDate date) {

        return (root, query, cb) -> {

            if (date == null) {
                return null;
            }

            return cb.greaterThanOrEqualTo(
                    root.get("startDate"),
                    date
            );
        };
    }

    public static Specification<Project> startDateTo(
            LocalDate date) {

        return (root, query, cb) -> {

            if (date == null) {
                return null;
            }

            return cb.lessThanOrEqualTo(
                    root.get("endDate"),
                    date
            );
        };
    }

}