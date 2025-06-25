package com.marcella.backend.nodeHandlers;
import com.marcella.backend.services.DistributedWorkflowCoordinator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/triggers")
@RequiredArgsConstructor
@Slf4j
public class WebhookTriggerController {

    private final DistributedWorkflowCoordinator coordinator;

    @PostMapping("/{workflowId}")
    public ResponseEntity<Map<String, Object>> triggerWorkflow(
            @PathVariable UUID workflowId,
            @RequestBody(required = false) Map<String, Object> payload) {

        try {
            List<String> emptyList = Collections.emptyList();
            UUID executionId = coordinator.startWorkflowExecution(workflowId, payload ,emptyList );

            return ResponseEntity.ok(Map.of(
                    "status", "triggered",
                    "executionId", executionId,
                    "workflowId", workflowId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "status", "failed"
            ));
        }
    }

    @PostMapping("/{workflowId}/{nodeId}")
    public ResponseEntity<Map<String, Object>> resumeAtNode(
            @PathVariable UUID workflowId,
            @PathVariable String nodeId,
            @RequestBody(required = false) Map<String, Object> payload) {

        try {
            coordinator.resumeWorkflowAtNode(workflowId, nodeId, payload);

            return ResponseEntity.ok(Map.of(
                    "status", "resumed",
                    "workflowId", workflowId,
                    "nodeId", nodeId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "status", "failed"
            ));
        }
    }
}