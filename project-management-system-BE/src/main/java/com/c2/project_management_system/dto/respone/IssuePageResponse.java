package com.c2.project_management_system.dto.respone;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IssuePageResponse {

    private List<IssueResponse> content;

    private int page;

    private int size;

    private long totalElements;

    private int totalPages;

    private IssueStatsResponse statistics;
}