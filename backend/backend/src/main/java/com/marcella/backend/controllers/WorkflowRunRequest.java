package com.marcella.backend.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowRunRequest {
    private Map<String, Object> payload;
    private List<String> returnVariables;
    private boolean waitForCompletion = false;
    private long timeoutMs = 300000;
}