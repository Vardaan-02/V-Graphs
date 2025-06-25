package com.marcella.backend.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowEdge {
    private String id;
    private String source;
    private String target;
    private String sourceHandle;
    private String targetHandle;
    private String type;
    private Map<String, Object> data;
}