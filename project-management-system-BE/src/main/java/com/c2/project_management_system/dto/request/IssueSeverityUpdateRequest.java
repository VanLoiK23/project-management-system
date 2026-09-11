package com.c2.project_management_system.dto.request;

import com.c2.project_management_system.statusEnum.IssueSeverity;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IssueSeverityUpdateRequest {
    @NotNull
    private IssueSeverity severity;
}