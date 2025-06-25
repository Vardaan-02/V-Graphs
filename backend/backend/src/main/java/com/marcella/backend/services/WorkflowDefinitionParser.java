package com.marcella.backend.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marcella.backend.entities.Workflows;
import com.marcella.backend.mappers.WorkflowMapper;
import com.marcella.backend.workflow.WorkflowDefinition;
import com.marcella.backend.workflow.WorkflowEdge;
import com.marcella.backend.workflow.WorkflowNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowDefinitionParser {

    private final WorkflowMapper workflowMapper;

    public WorkflowDefinition parseWorkflowDefinition(Workflows workflow) {
        try {
            WorkflowDefinition definition = workflowMapper.toWorkflowDefinition(workflow);

            if (!workflowMapper.validateWorkflowStructure(definition)) {
                throw new IllegalArgumentException("Invalid workflow structure");
            }

            log.info("Successfully parsed workflow definition: {} with {} nodes, {} edges",
                    definition.getId(),
                    definition.getNodes().size(),
                    definition.getEdges().size());

            return definition;

        } catch (Exception e) {
            log.error("Failed to parse workflow definition for workflow: {}", workflow.getId(), e);
            throw new RuntimeException("Failed to parse workflow definition", e);
        }
    }
}