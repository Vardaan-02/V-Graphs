package com.marcella.backend.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marcella.backend.entities.Execution;
import com.marcella.backend.entities.Workflows;
import com.marcella.backend.repositories.ExecutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionService {

    private final ExecutionRepository executionRepository;
    private final ObjectMapper objectMapper;

    public Execution startExecution(Workflows workflow) {
        Execution execution = Execution.builder()
                .workflow(workflow)
                .owner(workflow.getOwner())
                .status("RUNNING")
                .startedAt(Instant.now())
                .build();

        return executionRepository.save(execution);
    }

    public void completeExecution(Execution execution, Map<String, Object> outputData) {
        try {
            execution.setStatus("COMPLETED");
            execution.setOutputData(objectMapper.writeValueAsString(outputData));
            execution.setCompletedAt(Instant.now());
            executionRepository.save(execution);
        } catch (Exception e) {
            log.error("Failed to serialize output data", e);
            failExecution(execution, "Serialization failed: " + e.getMessage());
        }
    }

    public void failExecution(Execution execution, String errorMessage) {
        execution.setStatus("FAILED");
        execution.setError(errorMessage);
        execution.setCompletedAt(Instant.now());
        executionRepository.save(execution);
    }
}
