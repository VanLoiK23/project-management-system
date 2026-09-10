package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentVersionResponse {
    private Long id;
    private Integer versionNumber;
    private String filePath;
    private String fileName;
    private String changeDescription;
    private Long documentId;
    private Long editedById;
    private String editedByName;
    private LocalDateTime createdAt;
}