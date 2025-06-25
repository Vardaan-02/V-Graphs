package com.marcella.backend.nodeHandlers;

import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ListMessagesResponse;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailSearchNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "gmailSearch".equalsIgnoreCase(nodeType);
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

            String query = TemplateUtils.substitute((String) data.getOrDefault("query", "is:unread"), context);
            Integer maxResults = Integer.valueOf(TemplateUtils.substitute(String.valueOf(data.getOrDefault("maxResults", "10")), context));
            Boolean includeSpamTrash = Boolean.valueOf(TemplateUtils.substitute(String.valueOf(data.getOrDefault("includeSpamTrash", "false")), context));

            log.info("Searching Gmail: query={}, maxResults={}", query, maxResults);

            Gmail service = GmailConfig.getGmailService(googleToken);

            Gmail.Users.Messages.List request = service.users().messages().list("me")
                    .setQ(query)
                    .setMaxResults(Long.valueOf(maxResults));

            if (!includeSpamTrash) {
                request.setIncludeSpamTrash(false);
            }

            ListMessagesResponse response = request.execute();
            List<Message> messages = response.getMessages();

            List<Map<String, Object>> messageDetails = new ArrayList<>();
            if (messages != null) {
                for (Message msg : messages.stream().limit(maxResults).collect(Collectors.toList())) {
                    try {
                        Message fullMessage = service.users().messages().get("me", msg.getId()).execute();
                        Map<String, Object> msgData = new HashMap<>();
                        msgData.put("id", fullMessage.getId());
                        msgData.put("threadId", fullMessage.getThreadId());
                        msgData.put("snippet", fullMessage.getSnippet());
                        msgData.put("historyId", fullMessage.getHistoryId());
                        msgData.put("internalDate", fullMessage.getInternalDate());

                        if (fullMessage.getPayload() != null && fullMessage.getPayload().getHeaders() != null) {
                            Map<String, String> headers = new HashMap<>();
                            fullMessage.getPayload().getHeaders().forEach(header ->
                                    headers.put(header.getName(), header.getValue()));
                            msgData.put("headers", headers);
                        }

                        messageDetails.add(msgData);
                    } catch (Exception e) {
                        log.warn("Failed to get message details for ID: {}", msg.getId(), e);
                    }
                }
            }

            if (context != null) output.putAll(context);
            output.put("gmail_messages", messageDetails);
            output.put("gmail_message_count", messageDetails.size());
            output.put("gmail_query", query);
            output.put("search_successful", true);
            output.put("node_type", "gmailSearch");
            output.put("executed_at", Instant.now().toString());

            publishCompletionEvent(message, output, "COMPLETED", System.currentTimeMillis() - startTime);
            log.info("Gmail search completed: found {} messages", messageDetails.size());
            log.info("{}", messageDetails.stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(System.lineSeparator())));
            return output;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Gmail Search Node Error: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) errorOutput.putAll(message.getContext());
            errorOutput.put("error", e.getMessage());
            errorOutput.put("search_successful", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "gmailSearch");

            publishCompletionEvent(message, errorOutput, "FAILED", duration);
            throw new RuntimeException("Gmail Search Node failed: " + e.getMessage(), e);
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
        log.info("Published completion event for Gmail Search node: {} with status: {} in {}ms",
                message.getNodeId(), status, duration);
    }
}