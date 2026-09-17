package com.c2.project_management_system.dto.respone;

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
public class IssueStatsResponse {

    private long total;

    private long newCount;

    private long inProgress;
    
    private long fixed;

    private long critical;
}