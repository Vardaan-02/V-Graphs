package com.marcella.backend.nodeHandlers;

import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
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
public class GmailSendNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "gmailSend".equalsIgnoreCase(nodeType);
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

            String to = TemplateUtils.substitute((String) data.get("to"), context);
            String subject = TemplateUtils.substitute((String) data.get("subject"), context);
            String body = TemplateUtils.substitute((String) data.get("body"), context);
            String cc = TemplateUtils.substitute((String) data.getOrDefault("cc", ""), context);
            String bcc = TemplateUtils.substitute((String) data.getOrDefault("bcc", ""), context);

            log.info("Sending Gmail: to={}, subject={}", to, subject);

            Gmail service = GmailConfig.getGmailService(googleToken);

            MimeMessage email = createEmail(to, cc, bcc, subject, body);
            Message message1 = createMessageWithEmail(email);

            message1 = service.users().messages().send("me", message1).execute();

            if (context != null) output.putAll(context);
            output.put("gmail_message_id", message1.getId());
            output.put("gmail_sent", true);
            output.put("gmail_to", to);
            output.put("gmail_subject", subject);
            output.put("sent_at", Instant.now().toString());
            output.put("node_type", "gmailSend");
            output.put("executed_at", Instant.now().toString());

            publishCompletionEvent(message, output, "COMPLETED", System.currentTimeMillis() - startTime);
            log.info("Gmail sent successfully: messageId={}", message1.getId());
            return output;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Gmail Send Node Error: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) errorOutput.putAll(message.getContext());
            errorOutput.put("error", e.getMessage());
            errorOutput.put("gmail_sent", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "gmailSend");

            publishCompletionEvent(message, errorOutput, "FAILED", duration);
            throw new RuntimeException("Gmail Send Node failed: " + e.getMessage(), e);
        }
    }

    private MimeMessage createEmail(String to, String cc, String bcc, String subject, String bodyText)
            throws MessagingException {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);

        MimeMessage email = new MimeMessage(session);
        email.setFrom(new InternetAddress("me"));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));

        if (cc != null && !cc.trim().isEmpty()) {
            for (String ccAddress : cc.split(",")) {
                if (!ccAddress.trim().isEmpty()) {
                    email.addRecipient(jakarta.mail.Message.RecipientType.CC, new InternetAddress(ccAddress.trim()));
                }
            }
        }

        if (bcc != null && !bcc.trim().isEmpty()) {
            for (String bccAddress : bcc.split(",")) {
                if (!bccAddress.trim().isEmpty()) {
                    email.addRecipient(jakarta.mail.Message.RecipientType.BCC, new InternetAddress(bccAddress.trim()));
                }
            }
        }

        email.setSubject(subject);
        email.setText(bodyText);
        return email;
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
        log.info("Published completion event for Gmail Send node: {} with status: {} in {}ms",
                message.getNodeId(), status, duration);
    }
}