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
public class TaskStatisticsResponse {

    private long total;
    
    private long completed;
    
    private long todo;

    private long notStarted;

    private long inProgress;

    private long pending;

    private long done;

    private long cancelled;

    private long unfinished;
    
    private double totalProgress;
}