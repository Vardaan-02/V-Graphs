package com.marcella.backend.nodeHandlers;

import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ModifyMessageRequest;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.Label;
import com.google.api.services.gmail.model.ListLabelsResponse;
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
public class GmailAddLabelNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "gmailAddLabel".equalsIgnoreCase(nodeType);
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
            String labelsToAddStr = TemplateUtils.substitute((String) data.getOrDefault("labelsToAdd", ""), context);
            String labelsToRemoveStr = TemplateUtils.substitute((String) data.getOrDefault("labelsToRemove", ""), context);

            List<String> messageIds = parseCommaSeparatedString(messageIdsStr);

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

            List<String> labelsToAdd = parseCommaSeparatedString(labelsToAddStr);
            List<String> labelsToRemove = parseCommaSeparatedString(labelsToRemoveStr);

            if (labelsToAdd.isEmpty() && labelsToRemove.isEmpty()) {
                throw new IllegalArgumentException("No labels specified. Provide either labelsToAdd or labelsToRemove.");
            }

            log.info("Modifying labels for {} messages. Adding: {}, Removing: {}",
                    messageIds.size(), labelsToAdd, labelsToRemove);

            Gmail service = GmailConfig.getGmailService(googleToken);

            Map<String, String> labelNameToId = getLabelNameToIdMap(service);

            List<String> labelIdsToAdd = new ArrayList<>();
            List<String> labelIdsToRemove = new ArrayList<>();

            for (String labelName : labelsToAdd) {
                String labelId = labelNameToId.get(labelName.toUpperCase());
                if (labelId != null) {
                    labelIdsToAdd.add(labelId);
                } else {
                    log.warn("Label '{}' not found, skipping", labelName);
                }
            }

            for (String labelName : labelsToRemove) {
                String labelId = labelNameToId.get(labelName.toUpperCase());
                if (labelId != null) {
                    labelIdsToRemove.add(labelId);
                } else {
                    log.warn("Label '{}' not found, skipping", labelName);
                }
            }

            List<String> successfullyModified = new ArrayList<>();
            List<String> failedToModify = new ArrayList<>();

            for (String messageId : messageIds) {
                try {
                    ModifyMessageRequest modifyRequest = new ModifyMessageRequest();

                    if (!labelIdsToAdd.isEmpty()) {
                        modifyRequest.setAddLabelIds(labelIdsToAdd);
                    }

                    if (!labelIdsToRemove.isEmpty()) {
                        modifyRequest.setRemoveLabelIds(labelIdsToRemove);
                    }

                    Message modifiedMessage = service.users().messages()
                            .modify("me", messageId, modifyRequest)
                            .execute();

                    successfullyModified.add(messageId);
                    log.debug("Successfully modified labels for message {}", messageId);

                } catch (Exception e) {
                    log.warn("Failed to modify labels for message {}: {}", messageId, e.getMessage());
                    failedToModify.add(messageId);
                }
            }

            if (context != null) output.putAll(context);
            output.put("gmail_messages_modified", successfullyModified.size());
            output.put("gmail_successfully_modified", successfullyModified);
            output.put("gmail_failed_to_modify", failedToModify);
            output.put("gmail_labels_added", labelsToAdd);
            output.put("gmail_labels_removed", labelsToRemove);
            output.put("label_modification_successful", failedToModify.isEmpty());
            output.put("node_type", "gmailAddLabel");
            output.put("executed_at", Instant.now().toString());

            publishCompletionEvent(message, output, "COMPLETED", System.currentTimeMillis() - startTime);
            log.info("Gmail label modification completed: modified {} messages, {} failed",
                    successfullyModified.size(), failedToModify.size());
            return output;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Gmail Add Label Node Error: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) errorOutput.putAll(message.getContext());
            errorOutput.put("error", e.getMessage());
            errorOutput.put("label_modification_successful", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "gmailAddLabel");

            publishCompletionEvent(message, errorOutput, "FAILED", duration);
            throw new RuntimeException("Gmail Add Label Node failed: " + e.getMessage(), e);
        }
    }

    private List<String> parseCommaSeparatedString(String input) {
        List<String> result = new ArrayList<>();
        if (input != null && !input.trim().isEmpty()) {
            String[] items = input.split(",");
            for (String item : items) {
                String trimmed = item.trim();
                if (!trimmed.isEmpty()) {
                    result.add(trimmed);
                }
            }
        }
        return result;
    }

    private Map<String, String> getLabelNameToIdMap(Gmail service) throws Exception {
        Map<String, String> labelMap = new HashMap<>();

        ListLabelsResponse labelsResponse = service.users().labels().list("me").execute();
        List<Label> labels = labelsResponse.getLabels();

        if (labels != null) {
            for (Label label : labels) {
                labelMap.put(label.getName().toUpperCase(), label.getId());
            }
        }

        return labelMap;
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
        log.info("Published completion event for Gmail Add Label node: {} with status: {} in {}ms",
                message.getNodeId(), status, duration);
    }
}