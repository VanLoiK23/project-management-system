package com.c2.project_management_system.dto.request;

import com.c2.project_management_system.statusEnum.ProjectMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberUpdateRoleRequest {

    @NotNull(message = "Vui lòng chọn vai trò mới")
    private ProjectMemberRole role;
}
