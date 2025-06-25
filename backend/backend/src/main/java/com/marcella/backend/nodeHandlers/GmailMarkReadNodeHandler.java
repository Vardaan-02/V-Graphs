package com.marcella.backend.nodeHandlers;

import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ModifyMessageRequest;
import com.google.api.services.gmail.model.Message;
import com.marcella.backend.configurations.GmailConfig;
import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailMarkReadNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "gmailMarkRead".equalsIgnoreCase(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> output = new HashMap<>();

        try {
            Map<String, Object> context = message.getContext();
            Map<String, Object> data = message.getNodeData();

            String googleToken = (String) context.get("googleAccessToken");
            if (googleToken == null || googleToken.isBlank()) {
                throw new IllegalStateException("Missing Google access token for Gmail operation");
            }

            String messageIdsStr = TemplateUtils.substitute((String) data.getOrDefault("messageIds", ""), context);
            Boolean markAsRead = Boolean.valueOf(TemplateUtils.substitute(String.valueOf(data.getOrDefault("markAsRead", "true")), context));

            List<String> messageIds = new ArrayList<>();
            if (messageIdsStr != null && !messageIdsStr.trim().isEmpty()) {
                String[] ids = messageIdsStr.split(",");
                for (String id : ids) {
                    String trimmedId = id.trim();
                    if (!trimmedId.isEmpty()) {
                        messageIds.add(trimmedId);
                    }
                }
            }

            if (messageIds.isEmpty()) {
                Object gmailMessages = context.get("gmail_messages");
                if (gmailMessages instanceof List) {
                    List<?> messages = (List<?>) gmailMessages;
                    for (Object msgObj : messages) {
                        if (msgObj instanceof Map) {
                            Map<?, ?> msgMap = (Map<?, ?>) msgObj;
                            Object id = msgMap.get("id");
                            if (id != null) {
                                messageIds.add(id.toString());
                            }
                        }
                    }
                }
            }

            if (messageIds.isEmpty()) {
                throw new IllegalArgumentException("No message IDs provided. Either specify messageIds or connect to a Gmail Search node.");
            }

            log.info("Marking {} messages as {}: {}", messageIds.size(), markAsRead ? "read" : "unread", messageIds);

            Gmail service = GmailConfig.getGmailService(googleToken);

            List<String> successfullyModified = new ArrayList<>();
            List<String> failedToModify = new ArrayList<>();

            for (String messageId : messageIds) {
                try {
                    ModifyMessageRequest modifyRequest = new ModifyMessageRequest();

                    if (markAsRead) {
                        modifyRequest.setRemoveLabelIds(Collections.singletonList("UNREAD"));
                    } else {
                        modifyRequest.setAddLabelIds(Collections.singletonList("UNREAD"));
                    }

                    Message modifiedMessage = service.users().messages()
                            .modify("me", messageId, modifyRequest)
                            .execute();

                    successfullyModified.add(messageId);
                    log.debug("Successfully marked message {} as {}", messageId, markAsRead ? "read" : "unread");

                } catch (Exception e) {
                    log.warn("Failed to modify message {}: {}", messageId, e.getMessage());
                    failedToModify.add(messageId);
                }
            }

            if (context != null) output.putAll(context);
            output.put("gmail_messages_modified", successfullyModified.size());
            output.put("gmail_successfully_modified", successfullyModified);
            output.put("gmail_failed_to_modify", failedToModify);
            output.put("gmail_marked_as_read", markAsRead);
            output.put("modification_successful", failedToModify.isEmpty());
            output.put("node_type", "gmailMarkRead");
            output.put("executed_at", Instant.now().toString());

            publishCompletionEvent(message, output, "COMPLETED", System.currentTimeMillis() - startTime);
            log.info("Gmail mark read completed: modified {} messages, {} failed",
                    successfullyModified.size(), failedToModify.size());
            return output;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Gmail Mark Read Node Error: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) errorOutput.putAll(message.getContext());
            errorOutput.put("error", e.getMessage());
            errorOutput.put("modification_successful", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "gmailMarkRead");

            publishCompletionEvent(message, errorOutput, "FAILED", duration);
            throw new RuntimeException("Gmail Mark Read Node failed: " + e.getMessage(), e);
        }
    }

    private void publishCompletionEvent(NodeExecutionMessage message, Map<String, Object> output, String status, long duration) {
        NodeCompletionMessage completion = NodeCompletionMessage.builder()
                .executionId(message.getExecutionId())
                .workflowId(message.getWorkflowId())
                .nodeId(message.getNodeId())
                .nodeType(message.getNodeType())
                .status(status)
                .output(output)
                .timestamp(Instant.now())
                .processingTime(duration)
                .build();

        eventProducer.publishNodeCompletion(completion);
        log.info("Published completion event for Gmail Mark Read node: {} with status: {} in {}ms",
                message.getNodeId(), status, duration);
    }
}