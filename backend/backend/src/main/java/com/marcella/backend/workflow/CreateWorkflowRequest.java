package com.marcella.backend.workflow;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateWorkflowRequest {
    @NotBlank
    private String name;

    private String description;

    @NotNull
    private Map<String, Object> workflowData;
}