package com.marcella.backend.services;

import com.marcella.backend.workflow.DependencyGraph;
import com.marcella.backend.workflow.WorkflowDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KahnAlgoService {
    private final RedisTemplate<String, Object> redisTemplate;

    public DependencyGraph buildDependencyGraph(WorkflowDefinition workflow) {
        Map<String, List<String>> incomingEdges = new HashMap<>();
        Map<String, List<String>> outgoingEdges = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();

        workflow.getNodes().forEach(node -> {
            incomingEdges.put(node.getId(), new ArrayList<>());
            outgoingEdges.put(node.getId(), new ArrayList<>());
            inDegree.put(node.getId(), 0);
        });

        workflow.getEdges().forEach(edge -> {
            String source = edge.getSource();
            String target = edge.getTarget();

            outgoingEdges.get(source).add(target);
            incomingEdges.get(target).add(source);
            inDegree.put(target, inDegree.get(target) + 1);
        });

        return DependencyGraph.builder()
                .incomingEdges(incomingEdges)
                .outgoingEdges(outgoingEdges)
                .inDegree(inDegree)
                .completedNodes(new HashSet<>())
                .failedNodes(new HashSet<>())
                .build();
    }

    public List<String> getInitialReadyNodes(DependencyGraph graph) {
        return graph.getInDegree().entrySet().stream()
                .filter(entry -> entry.getValue() == 0)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    public List<String> processNodeCompletion(UUID executionId, String completedNodeId) {
        String dependencyKey = "execution:dependencies:" + executionId;
        DependencyGraph graph = (DependencyGraph) redisTemplate.opsForValue().get(dependencyKey);

        if (graph == null) {
            throw new IllegalStateException("Dependency graph not found for execution: " + executionId);
        }

        graph.getCompletedNodes().add(completedNodeId);

        List<String> newlyReadyNodes = new ArrayList<>();

        List<String> dependentNodes = graph.getOutgoingEdges().get(completedNodeId);
        for (String dependentNode : dependentNodes) {

            int currentInDegree = graph.getInDegree().get(dependentNode);
            graph.getInDegree().put(dependentNode, currentInDegree - 1);

            if (currentInDegree - 1 == 0) {
                newlyReadyNodes.add(dependentNode);
            }
        }

        redisTemplate.opsForValue().set(dependencyKey, graph);

        return newlyReadyNodes;
    }

    public boolean isWorkflowComplete(UUID executionId) {
        String dependencyKey = "execution:dependencies:" + executionId;
        DependencyGraph graph = (DependencyGraph) redisTemplate.opsForValue().get(dependencyKey);

        if (graph == null) return false;

        int totalNodes = graph.getInDegree().size();
        int completedNodes = graph.getCompletedNodes().size();
        int failedNodes = graph.getFailedNodes().size();

        return (completedNodes + failedNodes) == totalNodes;
    }
}

