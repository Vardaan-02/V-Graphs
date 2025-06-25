package com.marcella.backend.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marcella.backend.entities.Users;
import com.marcella.backend.entities.Workflows;
import com.marcella.backend.mappers.WorkflowMapper;
import com.marcella.backend.repositories.UserRepository;
import com.marcella.backend.repositories.WorkflowRepository;
import com.marcella.backend.workflow.CreateWorkflowRequest;
import com.marcella.backend.workflow.WorkflowDto;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WorkflowDto createWorkflow(CreateWorkflowRequest request, UUID userId) {

        validateWorkflowStructure(request.getWorkflowData());

        String workflowDataJson;
        try {
            workflowDataJson = objectMapper.writeValueAsString(request.getWorkflowData());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize workflowData", e);
        }

        Users owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Workflows workflow = Workflows.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .status("DRAFT")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .workflowData(workflowDataJson)
                .version(0L)
                .build();

        workflow = workflowRepository.save(workflow);

        log.info("Created workflow: {} for user: {}", workflow.getId(), userId);
        return workflowMapper.toDto(workflow);
    }

    public Page<WorkflowDto> getWorkflows(UUID userId, String search, Pageable pageable) {
        Page<Workflows> page;

        if (search != null && !search.trim().isEmpty()) {

            page = workflowRepository.findByOwnerIdAndIsActiveTrue(userId, pageable);
        }
        else {
            page = workflowRepository.findByOwnerIdAndIsActiveTrue(userId, pageable);
        }

        return page.map(workflowMapper::toDto);
    }

    public WorkflowDto getWorkflow(UUID workflowId, UUID userId) {
        Workflows workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        if (!workflow.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return workflowMapper.toDto(workflow);
    }

    public WorkflowDto updateWorkflow(UUID workflowId, CreateWorkflowRequest request, UUID userId) {
        Workflows workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        if (!workflow.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        validateWorkflowStructure(request.getWorkflowData());

        try {
            String workflowDataJson = objectMapper.writeValueAsString(request.getWorkflowData());

            workflow.setName(request.getName());
            workflow.setDescription(request.getDescription());
            workflow.setWorkflowData(workflowDataJson);
            workflow.setVersion(workflow.getVersion() + 1);

            workflow = workflowRepository.save(workflow);

            log.info("Updated workflow: {} to version: {}", workflowId, workflow.getVersion());
            return workflowMapper.toDto(workflow);

        } catch (Exception e) {
            throw new RuntimeException("Failed to update workflow", e);
        }
    }

    public void deleteWorkflow(UUID workflowId, UUID userId) {
        Workflows workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        if (!workflow.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        workflow.setActive(false);
        workflowRepository.save(workflow);

        log.info("Deleted workflow: {} for user: {}", workflowId, userId);
    }

    public WorkflowDto duplicateWorkflow(UUID workflowId, UUID userId, String newName) {
        WorkflowDto originalWorkflow = getWorkflow(workflowId, userId);

        CreateWorkflowRequest duplicateRequest = CreateWorkflowRequest.builder()
                .name(newName != null ? newName : originalWorkflow.getName() + " (Copy)")
                .description(originalWorkflow.getDescription())
                .workflowData(originalWorkflow.getWorkflowData())
                .build();

        return createWorkflow(duplicateRequest, userId);
    }

    private void validateWorkflowStructure(Map<String, Object> workflowData) {
        if (workflowData == null) {
            throw new IllegalArgumentException("Workflow data cannot be null");
        }

        List<Map<String, Object>> nodes = (List<Map<String, Object>>) workflowData.get("nodes");
        List<Map<String, Object>> edges = (List<Map<String, Object>>) workflowData.get("edges");

        if (nodes == null || nodes.isEmpty()) {
            throw new IllegalArgumentException("Workflow must contain at least one node");
        }

        for (Map<String, Object> node : nodes) {
            if (!node.containsKey("id") || !node.containsKey("type")) {
                throw new IllegalArgumentException("All nodes must have 'id' and 'type' fields");
            }
        }

        if (edges != null) {
            Set<String> nodeIds = nodes.stream()
                    .map(node -> (String) node.get("id"))
                    .collect(Collectors.toSet());

            for (Map<String, Object> edge : edges) {
                String source = (String) edge.get("source");
                String target = (String) edge.get("target");

                if (!nodeIds.contains(source) || !nodeIds.contains(target)) {
                    throw new IllegalArgumentException("Edge references non-existent node");
                }
            }
        }

        log.info("Workflow validation passed: {} nodes, {} edges",
                nodes.size(), edges != null ? edges.size() : 0);
    }
}
