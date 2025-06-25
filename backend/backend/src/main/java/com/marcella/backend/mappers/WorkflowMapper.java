package com.marcella.backend.mappers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marcella.backend.entities.Workflows;
import com.marcella.backend.workflow.WorkflowDefinition;
import com.marcella.backend.workflow.WorkflowDto;
import com.marcella.backend.workflow.WorkflowEdge;
import com.marcella.backend.workflow.WorkflowNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowMapper {
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WorkflowDto toDto(Workflows entity) {
        WorkflowDto dto = new WorkflowDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());

        try {
            Map<String, Object> workflowDataMap = objectMapper.readValue(
                    entity.getWorkflowData(), new TypeReference<>() {}
            );
            dto.setWorkflowData(workflowDataMap);
        } catch (Exception e) {
            log.error("Failed to parse workflowData JSON for workflow: {}", entity.getId(), e);
            throw new RuntimeException("Failed to parse workflowData JSON", e);
        }

        dto.setStatus(entity.getStatus());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setVersion(entity.getVersion());
        dto.setOwnerId(entity.getOwner().getId());

        return dto;
    }

    public WorkflowDefinition toWorkflowDefinition(Workflows entity) {
        try {
            Map<String, Object> workflowData = objectMapper.readValue(entity.getWorkflowData(), Map.class);

            List<Map<String, Object>> nodeList = (List<Map<String, Object>>) workflowData.get("nodes");
            List<WorkflowNode> nodes = nodeList.stream()
                    .map(this::convertToWorkflowNode)
                    .collect(Collectors.toList());

            List<Map<String, Object>> edgeList = (List<Map<String, Object>>) workflowData.get("edges");
            List<WorkflowEdge> edges = edgeList != null ?
                    edgeList.stream()
                            .map(this::convertToWorkflowEdge)
                            .collect(Collectors.toList()) :
                    List.of();

            return WorkflowDefinition.builder()
                    .id(entity.getId())
                    .name(entity.getName())
                    .nodes(nodes)
                    .edges(edges)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse workflow definition for workflow: {}", entity.getId(), e);
            throw new RuntimeException("Failed to parse workflow definition", e);
        }
    }

    private WorkflowNode convertToWorkflowNode(Map<String, Object> nodeMap) {
        String nodeType = (String) nodeMap.get("type");
        String assignedService = determineAssignedService(nodeType);

        return WorkflowNode.builder()
                .id((String) nodeMap.get("id"))
                .type(nodeType)
                .data((Map<String, Object>) nodeMap.getOrDefault("data", Map.of()))
                .assignedService(assignedService)
                .build();
    }

    private WorkflowEdge convertToWorkflowEdge(Map<String, Object> edgeMap) {
        return WorkflowEdge.builder()
                .id((String) edgeMap.get("id"))
                .source((String) edgeMap.get("source"))
                .target((String) edgeMap.get("target"))
                .sourceHandle((String) edgeMap.getOrDefault("sourceHandle", "output"))
                .targetHandle((String) edgeMap.getOrDefault("targetHandle", "input"))
                .type((String) edgeMap.getOrDefault("type", "default"))
                .data((Map<String, Object>) edgeMap.getOrDefault("data", Map.of()))
                .build();
    }

    private String determineAssignedService(String nodeType) {
        Set<String> aiNodeTypes = Set.of(
                "ai_decision", "ai_classification", "ai_analysis",
                "llm_prompt", "ai_transform", "sentiment_analysis",
                "text_generation", "data_analysis", "ml_prediction"
        );

        return aiNodeTypes.contains(nodeType.toLowerCase()) ? "fastapi" : "spring";
    }

    public boolean validateWorkflowStructure(WorkflowDefinition workflow) {
        if (workflow.getNodes() == null || workflow.getNodes().isEmpty()) {
            log.warn("Workflow has no nodes: {}", workflow.getId());
            return false;
        }

        Set<String> nodeIds = workflow.getNodes().stream()
                .map(WorkflowNode::getId)
                .collect(Collectors.toSet());

        if (workflow.getEdges() != null) {
            for (WorkflowEdge edge : workflow.getEdges()) {
                if (!nodeIds.contains(edge.getSource()) || !nodeIds.contains(edge.getTarget())) {
                    log.warn("Edge references non-existent node in workflow: {}", workflow.getId());
                    return false;
                }
            }
        }

        log.info("Workflow structure validation passed for: {}", workflow.getId());
        return true;
    }
}
