package com.marcella.backend.sidebar;

import com.marcella.backend.entities.Execution;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class SidebarStatsResponse {
    private long draftWorkflows;
    private long activeWorkflows;
    private long failedExecutions;
    private long recentRuns;
}
