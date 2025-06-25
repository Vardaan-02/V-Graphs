package com.marcella.backend.nodeHandlers;

import com.marcella.backend.services.EmailService;
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
public class EmailNodeHandler implements NodeHandler  {

    private final WorkflowEventProducer eventProducer;
    private final EmailService emailService;

    @Override
    public boolean canHandle(String nodeType) {
        return "action".equals(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long startTime = System.currentTimeMillis();
        log.info("Executing email node: {}", message.getNodeId());

        try {
            Map<String, Object> nodeData = message.getNodeData();
            Map<String, Object> context = message.getContext();

            log.info("Email node context variables: {}", context.keySet());

            String to = TemplateUtils.substitute((String) nodeData.get("to"), context);
            String subject = TemplateUtils.substitute((String) nodeData.get("subject"), context);
            String body = TemplateUtils.substitute((String) nodeData.get("body"), context);

            log.info("Email details - To: {}, Subject: {}", to, subject);
            log.info("Email body preview: {}", body.substring(0, Math.min(100, body.length())) + "...");

            boolean emailSent = emailService.sendEmail(to, subject, body);

            Map<String, Object> output = new HashMap<>();

            if (context != null) {
                output.putAll(context);
            }

            output.put("email_sent", emailSent);
            output.put("recipient", to);
            output.put("subject", subject);
            output.put("sent_at", Instant.now().toString());
            output.put("node_type", "email");
            output.put("node_executed_at", Instant.now().toString());

            long processingTime = System.currentTimeMillis() - startTime;
            publishCompletionEvent(message, output, "COMPLETED", processingTime);

            log.info("Email sent successfully to {} with subject: {}", to, subject);
            return output;

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Email node failed: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) {
                errorOutput.putAll(message.getContext());
            }
            errorOutput.put("error", e.getMessage());
            errorOutput.put("email_sent", false);
            errorOutput.put("failed_at", Instant.now().toString());

            publishCompletionEvent(message, errorOutput, "FAILED", processingTime);
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
        log.info("Published completion event for email node: {} with status: {} in {}ms",
                message.getNodeId(), status, processingTime);
    }
}

