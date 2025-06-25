package com.marcella.backend.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeExecutionMessage {
    private UUID executionId;
    private UUID workflowId;
    private String nodeId;
    private String nodeType;
    private Map<String, Object> nodeData;
    private Map<String, Object> context;
    private List<String> dependencies;
    private Instant timestamp;
    private Priority priority;
    private String googleAccessToken;

    public enum Priority {
        HIGH, NORMAL, LOW
    }
}
