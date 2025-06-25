package com.marcella.backend.nodeHandlers;

import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DelayNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "delay".equals(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) throws InterruptedException {
        long startTime = System.currentTimeMillis();
        log.info("Executing delay node: {}", message.getNodeId());

        try {
            Map<String, Object> nodeData = message.getNodeData();
            Map<String, Object> context = message.getContext();

            String rawDuration = String.valueOf(nodeData.getOrDefault("duration", "1000"));
            String processedDuration = TemplateUtils.substitute(rawDuration, context);

            Integer duration;
            try {
                duration = Integer.valueOf(processedDuration);
            } catch (NumberFormatException e) {
                log.warn("Invalid duration format '{}', using default 1000ms", processedDuration);
                duration = 1000;
            }

            if (duration < 0) {
                log.warn("Negative duration {} not allowed, using 0", duration);
                duration = 0;
            } else if (duration > 300000) {
                log.warn("Duration {} exceeds maximum 300000ms, capping at 300000", duration);
                duration = 300000;
            }

            log.info("Delaying for {} milliseconds", duration);

            String delayMessage = nodeData.containsKey("message")
                    ? TemplateUtils.substitute((String) nodeData.get("message"), context)
                    : "Delay completed";

            String delayReason = nodeData.containsKey("reason")
                    ? TemplateUtils.substitute((String) nodeData.get("reason"), context)
                    : "Workflow delay";

            Thread.sleep(duration);

            Map<String, Object> output = new HashMap<>();
            if (context != null) {
                output.putAll(context);
            }

            output.put("delay_completed", true);
            output.put("duration_ms", duration);
            output.put("delay_message", delayMessage);
            output.put("delay_reason", delayReason);
            output.put("completed_at", Instant.now().toString());
            output.put("node_type", "delay");
            output.put("executed_at", Instant.now().toString());

            long processingTime = System.currentTimeMillis() - startTime;
            publishCompletionEvent(message, output, "COMPLETED", processingTime);

            log.info("Delay node completed successfully: {} with duration {}ms", message.getNodeId(), duration);
            return output;

        } catch (InterruptedException e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Delay node interrupted: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) {
                errorOutput.putAll(message.getContext());
            }
            errorOutput.put("error", e.getMessage());
            errorOutput.put("delay_completed", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "delay");

            publishCompletionEvent(message, errorOutput, "FAILED", processingTime);
            throw e;
        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Delay node failed: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) {
                errorOutput.putAll(message.getContext());
            }
            errorOutput.put("error", e.getMessage());
            errorOutput.put("delay_completed", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "delay");

            publishCompletionEvent(message, errorOutput, "FAILED", processingTime);
            throw new RuntimeException("Delay node failed: " + e.getMessage(), e);
        }
    }

    private void publishCompletionEvent(NodeExecutionMessage message, Map<String, Object> output, String status, long processingTime) {
        NodeCompletionMessage completionMessage = NodeCompletionMessage.builder()
                .executionId(message.getExecutionId())
                .workflowId(message.getWorkflowId())
                .nodeId(message.getNodeId())
                .nodeType(message.getNodeType())
                .status(status)
                .output(output)
                .timestamp(Instant.now())
                .processingTime(processingTime)
                .build();

        eventProducer.publishNodeCompletion(completionMessage);
        log.info("Published completion event for delay node: {} with status: {} in {}ms",
                message.getNodeId(), status, processingTime);
    }
}