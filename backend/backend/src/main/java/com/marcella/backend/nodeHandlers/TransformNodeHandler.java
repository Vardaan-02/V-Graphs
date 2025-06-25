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
public class TransformNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "transform".equals(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long startTime = System.currentTimeMillis();
        log.info("Executing transform node: {}", message.getNodeId());

        try {
            Map<String, Object> nodeData = message.getNodeData();
            Map<String, Object> context = message.getContext();
            Map<String, Object> output = new HashMap<>();

            Map<String, Object> mapping = (Map<String, Object>) nodeData.get("mapping");
            if (mapping != null) {
                for (Map.Entry<String, Object> entry : mapping.entrySet()) {
                    String targetKey = entry.getKey();
                    String sourceKey = TemplateUtils.substitute(String.valueOf(entry.getValue()), context);

                    if (context != null && context.containsKey(sourceKey)) {
                        Object value = context.get(sourceKey);
                        output.put(targetKey, value);
                        log.info("Mapped {} -> {}: {}", sourceKey, targetKey, value);
                    } else {
                        log.warn("Source key '{}' not found in context for mapping to '{}'", sourceKey, targetKey);
                    }
                }
            }

            if (context != null) {
                output.putAll(context);
            }

            output.put("transformed_at", Instant.now().toString());
            output.put("node_type", "transform");
            output.put("node_executed_at", Instant.now().toString());

            long processingTime = System.currentTimeMillis() - startTime;
            publishCompletionEvent(message, output, "COMPLETED", processingTime);
            return output;

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Transform node failed: {}", message.getNodeId(), e);
            publishCompletionEvent(message, Map.of("error", e.getMessage()), "FAILED", processingTime);
            throw e;
        }
    }

    private void publishCompletionEvent(NodeExecutionMessage message, Map<String, Object> output,
                                        String status, long processingTime) {
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
        log.info("Published completion event for transform node: {} with status: {} in {}ms",
                message.getNodeId(), status, processingTime);
    }
}
