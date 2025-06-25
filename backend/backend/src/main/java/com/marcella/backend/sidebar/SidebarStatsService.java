package com.marcella.backend.sidebar;

import com.marcella.backend.entities.Execution;
import com.marcella.backend.repositories.ExecutionRepository;
import com.marcella.backend.repositories.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SidebarStatsService {

    private final WorkflowRepository workflowRepository;
    private final ExecutionRepository executionRepository;

    public SidebarStatsResponse getStats(UUID userId) {
        long draftWorkflows = workflowRepository.countByOwner_IdAndStatusIgnoreCase(userId, "DRAFT");
        long activeWorkflows = workflowRepository.countByOwner_IdAndStatusIgnoreCase(userId, "ACTIVE");
        long failedExecutions = executionRepository.countByOwner_IdAndStatusIgnoreCase(userId, "FAILED");

        long recentRuns = executionRepository.countByOwner_Id(userId);

        return SidebarStatsResponse.builder()
                .draftWorkflows(draftWorkflows)
                .activeWorkflows(activeWorkflows)
                .failedExecutions(failedExecutions)
                .recentRuns(recentRuns)
                .build();
    }
}
