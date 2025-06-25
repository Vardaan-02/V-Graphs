package com.marcella.backend.nodeHandlers;

import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeZoneNodeHandler implements NodeHandler{
    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "currentTime".equals(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long start = System.currentTimeMillis();
        log.info("[CurrentTime] node={} executing", message.getNodeId());
        try {
            Map<String, Object> data = message.getNodeData();
            Map<String, Object> ctx = message.getContext();

            String tz = data.containsKey("timeZone")
                    ? TemplateUtils.substitute((String) data.get("timeZone"), ctx)
                    : "UTC";
            ZonedDateTime now = ZonedDateTime.now(ZoneId.of(tz));
            String formatted = now.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

            log.info("[CurrentTime] node={} → Resolved time: {} in timeZone: {}", message.getNodeId(), formatted, tz);

            Map<String, Object> out = new HashMap<>();
            if (ctx != null) out.putAll(ctx);
            out.put("current_time", formatted);
            out.put("time_zone", tz);
            out.put("node_type", "currentTime");
            out.put("executed_at", Instant.now().toString());

            publishCompletion(message, out, "COMPLETED", System.currentTimeMillis() - start);
            return out;
        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - start;
            log.error("Calculator node failed: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) {
                errorOutput.putAll(message.getContext());
            }
            errorOutput.put("error", e.getMessage());
            errorOutput.put("expression", message.getNodeData().get("expression"));
            errorOutput.put("result", null);
            errorOutput.put("failed_at", Instant.now().toString());

            publishCompletion(message, errorOutput, "FAILED", processingTime);
            throw new RuntimeException("Error evaluating expression", e);
        }
    }

    private void publishCompletion(NodeExecutionMessage msg, Map<String, Object> out, String status, long elapsed) {
        NodeCompletionMessage completion = NodeCompletionMessage.builder()
                .executionId(msg.getExecutionId())
                .workflowId(msg.getWorkflowId())
                .nodeId(msg.getNodeId())
                .nodeType(msg.getNodeType())
                .status(status)
                .output(out)
                .timestamp(Instant.now())
                .processingTime(elapsed)
                .build();
        eventProducer.publishNodeCompletion(completion);
    }
}
