package com.marcella.backend.services;

import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final Set<String> FASTAPI_NODE_TYPES = Set.of(
            "text-generation",
            "ai-decision",
            "summarization",
            "question-answer",
            "text-classification",
            "named-entity",
            "translation",
            "content-generation",
            "search-agent",
            "data-analyst-agent"
    );

    private static final Set<String> SPRING_NODE_TYPES = Set.of(
            "start",
            "action",
            "transform",
            "delay",
            "trigger",
            "calculator",
            "currentTime",
            "condition",
            "googleCalendar",
            "httpGet",
            "httpPost",
            "httpPut",
            "httpDelete",
            "gmailSend",
            "gmailSearch",
            "gmailMarkRead",
            "gmailAddLabel",
            "gmailCreateDraft",
            "gmailReply"
    );

    public void publishNodeExecution(NodeExecutionMessage message) {
        String topic = determineTopicByNodeType(message.getNodeType());

        kafkaTemplate.send(topic, message.getNodeId(), message)
                .thenAccept(result -> {
                    log.info("Node execution message sent to topic '{}': nodeId={}, nodeType={}",
                            topic, message.getNodeId(), message.getNodeType());
                })
                .exceptionally(ex -> {
                    log.error("Failed to send node execution message for node: {} type: {}",
                            message.getNodeId(), message.getNodeType(), ex);
                    return null;
                });
    }

    public void publishNodeCompletion(NodeCompletionMessage message) {
        kafkaTemplate.send("node-completion", message.getNodeId(), message);
        log.info("Node completion message sent: {} with status: {}", message.getNodeId(), message.getStatus());
    }

    private String determineTopicByNodeType(String nodeType) {
        String normalizedType = nodeType.toLowerCase();

        if (FASTAPI_NODE_TYPES.contains(normalizedType)) {
            log.debug("Routing node type '{}' to fastapi-nodes topic", nodeType);
            return "fastapi-nodes";
        }

        if (SPRING_NODE_TYPES.contains(normalizedType)) {
            log.debug("Routing node type '{}' to spring-nodes topic", nodeType);
            return "spring-nodes";
        }

        log.warn("Unknown node type '{}', defaulting to spring-nodes topic", nodeType);
        return "spring-nodes";
    }
}