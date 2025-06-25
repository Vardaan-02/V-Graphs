package com.marcella.backend.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeCompletionMessage {
    private UUID executionId;
    private UUID workflowId;
    private String nodeId;
    private String nodeType;
    private String status;
    private Map<String, Object> output;
    private String error;
    private Instant timestamp;
    private long processingTime;
    private String service = "spring";
}
