package com.marcella.backend.services;

import com.marcella.backend.entities.Execution;
import com.marcella.backend.entities.Workflows;
import com.marcella.backend.repositories.ExecutionRepository;
import com.marcella.backend.repositories.WorkflowRepository;
import com.marcella.backend.workflow.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DistributedWorkflowCoordinator {
    private final WorkflowRepository workflowRepository;
    private final ExecutionContextService contextService;
    private final KahnAlgoService kahnService;
    private final WorkflowEventProducer eventProducer;
    private final ExecutionService executionService;
    private final WorkflowDefinitionParser workflowDefinitionParser;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ExecutionRepository executionRepository;
    private final ReturnHandlerService returnHandler;
    private void initializeExecutionContext(UUID executionId, WorkflowDefinition workflowDef,
                                            Map<String, Object> payload) {

        ExecutionContext context = ExecutionContext.builder()
                .executionId(executionId)
                .workflowId(workflowDef.getId())
                .status(ExecutionContext.ExecutionStatus.RUNNING)
                .startTime(Instant.now())
                .globalVariables(new HashMap<>())
                .nodeOutputs(new HashMap<>())
                .build();

        if (payload != null && !payload.isEmpty()) {
            context.getGlobalVariables().putAll(payload);
            context.getGlobalVariables().put("payload_received", true);
            context.getGlobalVariables().put("payload_timestamp", Instant.now().toString());

            Object token = payload.get("googleAccessToken");
            if (token instanceof String && !((String) token).isBlank()) {
                context.getGlobalVariables().put("googleAccessToken", token);
                log.info("Google access token added to execution context");
            }
            log.info("Added {} payload variables to execution context", payload.size());
        }

        context.getGlobalVariables().put("execution_id", executionId.toString());
        context.getGlobalVariables().put("workflow_id", workflowDef.getId().toString());
        context.getGlobalVariables().put("workflow_name", workflowDef.getName());
        context.getGlobalVariables().put("execution_started_at", Instant.now().toString());

        contextService.storeContext(executionId, context);

        log.info("Initialized execution context for: {} with {} variables",
                executionId, context.getGlobalVariables().size());
    }

    public UUID startWorkflowExecution(UUID workflowId, Map<String, Object> payload,List<String> returnVariables) {
        log.info("Starting workflow execution: {} with payload: {} and return variables: {}",
                workflowId, payload != null ? "provided" : "none", returnVariables);

        Workflows workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found: " + workflowId));

        Execution execution = executionService.startExecution(workflow);
        UUID executionId = execution.getId();

        try {
            WorkflowDefinition workflowDef = workflowDefinitionParser.parseWorkflowDefinition(workflow);

            if (returnVariables != null && !returnVariables.isEmpty()) {
                returnHandler.storeReturnVariables(executionId, returnVariables);
                log.info("📋 Stored {} return variables for execution: {}", returnVariables.size(), executionId);
            }

            initializeExecutionContext(executionId, workflowDef, payload);

            DependencyGraph dependencyGraph = kahnService.buildDependencyGraph(workflowDef);
            contextService.storeDependencyGraph(executionId, dependencyGraph);

            List<String> readyNodes = kahnService.getInitialReadyNodes(dependencyGraph);

            if (readyNodes.isEmpty()) {
                throw new RuntimeException("No ready nodes found - workflow may have circular dependencies");
            }

            contextService.addReadyNodes(executionId, readyNodes);

            routeNodesToServices(executionId, readyNodes, workflowDef);

            log.info("Workflow execution started successfully: {} with {} initial ready nodes",
                    executionId, readyNodes.size());

            return executionId;

        } catch (Exception e) {
            log.error("Failed to start workflow execution: {}", workflowId, e);
            executionService.failExecution(execution, e.getMessage());

            if (returnVariables != null && !returnVariables.isEmpty()) {
                returnHandler.clearReturnVariables(executionId);
            }

            throw new RuntimeException("Failed to start workflow execution: " + e.getMessage(), e);
        }
    }

    private UUID findActiveExecution(UUID workflowId) {
        try {

            List<Execution> activeExecutions = executionRepository
                    .findByWorkflowIdAndStatus(workflowId, "RUNNING");

            if (!activeExecutions.isEmpty()) {
                return activeExecutions.get(0).getId();
            }

            return null;
        } catch (Exception e) {
            log.warn("Error finding active execution for workflow: {}", workflowId, e);
            return null;
        }
    }

    private void startWorkflowAtSpecificNode(UUID workflowId, String nodeId, Map<String, Object> payload) {
        log.info("Starting new workflow execution at specific node: {} for workflow: {}", nodeId, workflowId);

        Workflows workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found: " + workflowId));

        Execution execution = executionService.startExecution(workflow);
        UUID executionId = execution.getId();

        try {
            WorkflowDefinition workflowDef = workflowDefinitionParser.parseWorkflowDefinition(workflow);

            boolean nodeExists = workflowDef.getNodes().stream()
                    .anyMatch(node -> node.getId().equals(nodeId));

            if (!nodeExists) {
                throw new RuntimeException("Target node not found in workflow: " + nodeId);
            }

            initializeExecutionContext(executionId, workflowDef, payload);

            DependencyGraph dependencyGraph = kahnService.buildDependencyGraph(workflowDef);
            contextService.storeDependencyGraph(executionId, dependencyGraph);

            contextService.addReadyNodes(executionId, List.of(nodeId));

            routeNodesToServices(executionId, List.of(nodeId), workflowDef);

            log.info("Started new workflow execution: {} at node: {}", executionId, nodeId);

        } catch (Exception e) {
            log.error("Failed to start workflow at specific node: {} for workflow: {}", nodeId, workflowId, e);
            executionService.failExecution(execution, e.getMessage());
            throw new RuntimeException("Failed to start workflow at node: " + e.getMessage(), e);
        }
    }

    public void resumeWorkflowAtNode(UUID workflowId, String nodeId, Map<String, Object> payload) {
        log.info("Resuming workflow: {} at node: {} with payload: {}",
                workflowId, nodeId, payload != null ? "provided" : "none");

        try {
            UUID executionId = findActiveExecution(workflowId);

            if (executionId != null) {
                resumeExistingExecution(executionId, nodeId, payload);
            } else {
                startWorkflowAtSpecificNode(workflowId, nodeId, payload);
            }

        } catch (Exception e) {
            log.error("Failed to resume workflow: {} at node: {}", workflowId, nodeId, e);
            throw new RuntimeException("Failed to resume workflow at node: " + e.getMessage(), e);
        }
    }
    private void resumeExistingExecution(UUID executionId, String nodeId, Map<String, Object> payload) {
        log.info("Resuming existing execution: {} at node: {}", executionId, nodeId);

        ExecutionContext context = contextService.getContext(executionId);
        if (context == null) {
            throw new RuntimeException("Execution context not found: " + executionId);
        }

        if (payload != null && !payload.isEmpty()) {
            context.getGlobalVariables().putAll(payload);
            context.getGlobalVariables().put("webhook_resumed_at", Instant.now().toString());
            context.getGlobalVariables().put("webhook_resume_node", nodeId);
            contextService.updateContext(executionId, context);
            log.info("Updated execution context with {} new payload variables", payload.size());
        }

        Workflows workflow = workflowRepository.findById(context.getWorkflowId())
                .orElseThrow(() -> new RuntimeException("Workflow not found: " + context.getWorkflowId()));

        WorkflowDefinition workflowDef = workflowDefinitionParser.parseWorkflowDefinition(workflow);

        boolean nodeExists = workflowDef.getNodes().stream()
                .anyMatch(node -> node.getId().equals(nodeId));

        if (!nodeExists) {
            throw new RuntimeException("Node not found in workflow: " + nodeId);
        }

        contextService.addReadyNodes(executionId, List.of(nodeId));

        routeNodesToServices(executionId, List.of(nodeId), workflowDef);

        log.info("Successfully resumed execution at node: {}", nodeId);
    }

    private void routeNodesToServices(UUID executionId, List<String> nodeIds, WorkflowDefinition workflow) {
        Map<String, WorkflowNode> nodeMap = workflow.getNodes().stream()
                .collect(Collectors.toMap(WorkflowNode::getId, Function.identity()));

        for (String nodeId : nodeIds) {
            WorkflowNode node = nodeMap.get(nodeId);
            if (node != null) {
                routeNodeToService(executionId, workflow.getId(), node);
            }
        }
    }

    private void routeNodeToService(UUID executionId, UUID workflowId, WorkflowNode node) {
        ExecutionContext context = contextService.getContext(executionId);

        Map<String, Object> nodeContext = buildNodeContext(executionId, node.getId(), context);

        String googleToken = null;
        if (nodeContext.containsKey("googleAccessToken")) {
            Object tokenObj = nodeContext.get("googleAccessToken");
            if (tokenObj instanceof String) {
                googleToken = (String) tokenObj;
            }
        }
        NodeExecutionMessage message = NodeExecutionMessage.builder()
                .executionId(executionId)
                .workflowId(workflowId)
                .nodeId(node.getId())
                .nodeType(node.getType())
                .nodeData(node.getData())
                .context(nodeContext)
                .dependencies(getDependencies(executionId, node.getId()))
                .timestamp(Instant.now())
                .googleAccessToken(googleToken)
                .priority(NodeExecutionMessage.Priority.NORMAL)
                .build();

        eventProducer.publishNodeExecution(message);
    }

    private Map<String, Object> buildNodeContext(UUID executionId, String nodeId, ExecutionContext context) {
        Map<String, Object> nodeContext = new HashMap<>();

        List<String> dependencies = getDependencies(executionId, nodeId);

        for (String depNodeId : dependencies) {
            Map<String, Object> depOutput = context.getNodeOutputs().get(depNodeId);
            if (depOutput != null) {
                nodeContext.putAll(depOutput);

                nodeContext.put(depNodeId + "_output", depOutput);
            }
        }

        if (context.getGlobalVariables() != null) {
            nodeContext.putAll(context.getGlobalVariables());
        }

        return nodeContext;
    }

    private List<String> getDependencies(UUID executionId, String nodeId) {
        String dependencyKey = "execution:dependencies:" + executionId;
        DependencyGraph graph = (DependencyGraph) redisTemplate.opsForValue().get(dependencyKey);

        if (graph != null) {
            return graph.getIncomingEdges().getOrDefault(nodeId, new ArrayList<>());
        }

        return new ArrayList<>();
    }

    public void handleNodeCompletion(NodeCompletionMessage completionMessage) {
        UUID executionId = completionMessage.getExecutionId();
        String completedNodeId = completionMessage.getNodeId();

        log.info("Processing completion for node: {} in execution: {}", completedNodeId, executionId);

        try {
            if (completionMessage.getOutput() != null && !completionMessage.getOutput().isEmpty()) {
                contextService.updateNodeOutput(executionId, completedNodeId, completionMessage.getOutput());

                trackReturnVariablesFromOutput(executionId, completionMessage.getOutput());

                log.info("Updated context with output from node: {}", completedNodeId);
            }

            List<String> newlyReadyNodes = kahnService.processNodeCompletion(executionId, completedNodeId);

            if (!newlyReadyNodes.isEmpty()) {
                log.info("Ready nodes after completion: {}", newlyReadyNodes);

                contextService.addReadyNodes(executionId, newlyReadyNodes);

                ExecutionContext context = contextService.getContext(executionId);
                Workflows workflow = workflowRepository.findById(context.getWorkflowId())
                        .orElseThrow(() -> new RuntimeException("Workflow not found"));

                WorkflowDefinition workflowDef = workflowDefinitionParser.parseWorkflowDefinition(workflow);

                routeNodesToServices(executionId, newlyReadyNodes, workflowDef);
            } else {
                log.info("No new ready nodes after completing: {}", completedNodeId);

                if (kahnService.isWorkflowComplete(executionId)) {
                    completeWorkflowExecution(executionId);
                }
            }

        } catch (Exception e) {
            log.error("Failed to process node completion: {} for execution: {}", completedNodeId, executionId, e);

            Execution execution = executionRepository.findById(executionId)
                    .orElse(null);
            if (execution != null) {
                executionService.failExecution(execution, "Node completion processing failed: " + e.getMessage());

                returnHandler.clearReturnVariables(executionId);
            }
        }
    }

    private void completeWorkflowExecution(UUID executionId) {
        log.info("Workflow execution completed: {}", executionId);

        try {
            Execution execution = executionRepository.findById(executionId)
                    .orElseThrow(() -> new RuntimeException("Execution not found: " + executionId));

            ExecutionContext context = contextService.getContext(executionId);

            Map<String, Object> finalOutput;
            List<String> returnVariables = returnHandler.getReturnVariables(executionId);

            if (!returnVariables.isEmpty()) {
                finalOutput = returnHandler.extractReturnVariables(executionId);
                log.info("📤 Workflow completed with {} return variables", finalOutput.size());
            } else {
                finalOutput = null;
                log.info("📤 Workflow completed with all {} variables",0);
            }

            executionService.completeExecution(execution, finalOutput);



            log.info("Workflow execution successfully completed : {}", executionId);

        } catch (Exception e) {
            log.error("Failed to complete workflow execution: {}", executionId, e);

            try {
                returnHandler.clearReturnVariables(executionId);
            } catch (Exception cleanupError) {
                log.warn("Failed to cleanup return variables for execution: {}", executionId, cleanupError);
            }
        }
    }
    private void trackReturnVariablesFromOutput(UUID executionId, Map<String, Object> output) {
        log.info("00 output: {}", output);
        if (output == null || output.isEmpty()) {
            return;
        }
        List<String> returnVariables = returnHandler.getReturnVariables(executionId);
        log.info("return varibale {}",returnVariables);
        if (returnVariables.isEmpty()) {
            return;
        }

        for (String returnVar : returnVariables) {
                log.debug("🎯 Tracked return variable: {} = {}", returnVar, output.get(returnVar));
        }
    }
}
