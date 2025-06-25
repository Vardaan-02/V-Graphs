package com.marcella.backend.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowNode {
    private String id;
    private String type;
    private Map<String, Object> data;
    private String assignedService;
}
