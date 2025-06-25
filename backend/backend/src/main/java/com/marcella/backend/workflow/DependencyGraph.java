package com.marcella.backend.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependencyGraph {
    private Map<String, List<String>> incomingEdges;
    private Map<String, List<String>> outgoingEdges;
    private Map<String, Integer> inDegree;
    private Set<String> completedNodes;
    private Set<String> failedNodes;
}
