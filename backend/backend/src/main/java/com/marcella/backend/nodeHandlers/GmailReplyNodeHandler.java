package com.marcella.backend.nodeHandlers;

import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.MessagePartHeader;
import com.marcella.backend.configurations.GmailConfig;
import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailReplyNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "gmailReply".equalsIgnoreCase(nodeType);
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

            String messageId = TemplateUtils.substitute((String) data.getOrDefault("messageId", ""), context);
            String replyBody = TemplateUtils.substitute((String) data.getOrDefault("replyBody", ""), context);
            String contentType = TemplateUtils.substitute((String) data.getOrDefault("contentType", "text/plain"), context);
            Boolean replyAll = Boolean.valueOf(TemplateUtils.substitute(String.valueOf(data.getOrDefault("replyAll", "false")), context));
            Boolean sendDraft = Boolean.valueOf(TemplateUtils.substitute(String.valueOf(data.getOrDefault("sendDraft", "true")), context));

            if (messageId == null || messageId.trim().isEmpty()) {
                Object gmailMessages = context.get("gmail_messages");
                if (gmailMessages instanceof List) {
                    List<?> messages = (List<?>) gmailMessages;
                    if (!messages.isEmpty()) {
                        Object firstMsg = messages.get(0);
                        if (firstMsg instanceof Map) {
                            Map<?, ?> msgMap = (Map<?, ?>) firstMsg;
                            Object id = msgMap.get("id");
                            if (id != null) {
                                messageId = id.toString();
                            }
                        }
                    }
                }
            }

            if (messageId == null || messageId.trim().isEmpty()) {
                throw new IllegalArgumentException("No message ID provided. Either specify messageId or connect to a Gmail Search node.");
            }

            if (replyBody == null || replyBody.trim().isEmpty()) {
                throw new IllegalArgumentException("Reply body is required");
            }

            log.info("Creating Gmail reply: messageId={}, replyAll={}, sendDraft={}", messageId, replyAll, sendDraft);

            Gmail service = GmailConfig.getGmailService(googleToken);

            Message originalMessage = service.users().messages().get("me", messageId).execute();

            Map<String, String> originalHeaders = extractHeaders(originalMessage);

            MimeMessage replyEmail = createReplyEmail(originalHeaders, replyBody, contentType, replyAll);

            Message gmailReplyMessage = createMessageWithEmail(replyEmail);
            gmailReplyMessage.setThreadId(originalMessage.getThreadId());

            Message sentMessage;
            if (sendDraft) {
                sentMessage = service.users().messages().send("me", gmailReplyMessage).execute();
                log.info("Reply sent successfully: messageId={}", sentMessage.getId());
            } else {
                com.google.api.services.gmail.model.Draft draft = new com.google.api.services.gmail.model.Draft();
                draft.setMessage(gmailReplyMessage);
                com.google.api.services.gmail.model.Draft createdDraft = service.users().drafts().create("me", draft).execute();
                sentMessage = createdDraft.getMessage();
                log.info("Reply draft created successfully: draftId={}", createdDraft.getId());
            }

            if (context != null) output.putAll(context);
            output.put("gmail_reply_message_id", sentMessage.getId());
            output.put("gmail_reply_thread_id", sentMessage.getThreadId());
            output.put("gmail_original_message_id", messageId);
            output.put("gmail_reply_all", replyAll);
            output.put("gmail_sent_as_draft", !sendDraft);
            output.put("reply_successful", true);
            output.put("node_type", "gmailReply");
            output.put("executed_at", Instant.now().toString());

            publishCompletionEvent(message, output, "COMPLETED", System.currentTimeMillis() - startTime);

            String action = sendDraft ? "sent" : "created as draft";
            log.info("Gmail reply {} successfully: reply ID={}", action, sentMessage.getId());
            return output;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Gmail Reply Node Error: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) errorOutput.putAll(message.getContext());
            errorOutput.put("error", e.getMessage());
            errorOutput.put("reply_successful", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "gmailReply");

            publishCompletionEvent(message, errorOutput, "FAILED", duration);
            throw new RuntimeException("Gmail Reply Node failed: " + e.getMessage(), e);
        }
    }

    private Map<String, String> extractHeaders(Message message) {
        Map<String, String> headers = new HashMap<>();

        if (message.getPayload() != null && message.getPayload().getHeaders() != null) {
            for (MessagePartHeader header : message.getPayload().getHeaders()) {
                headers.put(header.getName().toLowerCase(), header.getValue());
            }
        }

        return headers;
    }

    private MimeMessage createReplyEmail(Map<String, String> originalHeaders, String replyBody,
                                         String contentType, boolean replyAll) throws MessagingException {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);

        MimeMessage replyEmail = new MimeMessage(session);

        String originalFrom = originalHeaders.get("from");
        String originalTo = originalHeaders.get("to");
        String originalCc = originalHeaders.get("cc");

        if (originalFrom != null) {
            replyEmail.setRecipients(jakarta.mail.Message.RecipientType.TO, InternetAddress.parse(originalFrom));
        }

        if (replyAll) {
            if (originalTo != null) {
                replyEmail.setRecipients(jakarta.mail.Message.RecipientType.CC, InternetAddress.parse(originalTo));
            }
            if (originalCc != null) {
                InternetAddress[] existingCc = (InternetAddress[]) replyEmail.getRecipients(jakarta.mail.Message.RecipientType.CC);
                InternetAddress[] originalCcAddresses = InternetAddress.parse(originalCc);

                List<InternetAddress> allCc = new ArrayList<>();
                if (existingCc != null) {
                    allCc.addAll(Arrays.asList(existingCc));
                }
                allCc.addAll(Arrays.asList(originalCcAddresses));

                replyEmail.setRecipients(jakarta.mail.Message.RecipientType.CC,
                        allCc.toArray(new InternetAddress[0]));
            }
        }

        String originalSubject = originalHeaders.get("subject");
        String replySubject = originalSubject;
        if (originalSubject != null && !originalSubject.toLowerCase().startsWith("re:")) {
            replySubject = "Re: " + originalSubject;
        }
        replyEmail.setSubject(replySubject);

        String messageId = originalHeaders.get("message-id");
        String references = originalHeaders.get("references");

        if (messageId != null) {
            replyEmail.setHeader("In-Reply-To", messageId);

            String newReferences = messageId;
            if (references != null && !references.trim().isEmpty()) {
                newReferences = references + " " + messageId;
            }
            replyEmail.setHeader("References", newReferences);
        }

        if ("text/html".equalsIgnoreCase(contentType)) {
            replyEmail.setContent(replyBody, "text/html; charset=utf-8");
        } else {
            replyEmail.setText(replyBody);
        }

        return replyEmail;
    }

    private Message createMessageWithEmail(MimeMessage emailContent) throws MessagingException, IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        emailContent.writeTo(buffer);
        byte[] bytes = buffer.toByteArray();
        String encodedEmail = Base64.getUrlEncoder().encodeToString(bytes);
        Message message = new Message();
        message.setRaw(encodedEmail);
        return message;
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
        log.info("Published completion event for Gmail Reply node: {} with status: {} in {}ms",
                message.getNodeId(), status, duration);
    }
}