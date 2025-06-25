package com.marcella.backend.nodeHandlers;

import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import com.marcella.backend.nodeHandlers.NodeHandler;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaticNodeExecutor {

    private final List<NodeHandler> nodeHandlers;
    private final WorkflowEventProducer eventProducer;
    @PostConstruct
    public void printHandlers() {
        System.out.println( nodeHandlers.stream()
                .map(h -> h.getClass().getSimpleName())
                .toList());
    }
    @KafkaListener(
            topics = "spring-nodes",
            groupId = "spring-node-executor",
            containerFactory = "nodeExecutionListenerFactory"
    )
    public void executeNode(
            @Payload NodeExecutionMessage message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {

        long startTime = System.currentTimeMillis();
        String nodeId = message.getNodeId();
        String nodeType = message.getNodeType();

        log.info("Executing node: {} of type: {} from topic: {} partition: {} offset: {}",
                nodeId, nodeType, topic, partition, offset);

        try {
            Optional<NodeHandler> handler = findHandler(nodeType);

            if (handler.isEmpty()) {
                String error = "No handler found for node type: " + nodeType;
                log.error(error);
                publishFailureEvent(message, error, startTime);
                acknowledgment.acknowledge();
                return;
            }

            Map<String, Object> output = handler.get().execute(message);

            long processingTime = System.currentTimeMillis() - startTime;
            log.info("Node execution completed: {} in {}ms", nodeId, processingTime);

            acknowledgment.acknowledge();

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Node execution failed: {} after {}ms", nodeId, processingTime, e);
            publishFailureEvent(message, e.getMessage(), startTime);

            acknowledgment.acknowledge();
        }
    }

    private Optional<NodeHandler> findHandler(String nodeType) {
        return nodeHandlers.stream()
                .filter(handler -> handler.canHandle(nodeType))
                .findFirst();
    }

    private void publishFailureEvent(NodeExecutionMessage message, String error, long startTime) {
        try {
            long processingTime = System.currentTimeMillis() - startTime;

            NodeCompletionMessage failureMessage = NodeCompletionMessage.builder()
                    .executionId(message.getExecutionId())
                    .workflowId(message.getWorkflowId())
                    .nodeId(message.getNodeId())
                    .nodeType(message.getNodeType())
                    .status("FAILED")
                    .error(error)
                    .output(Map.of(
                            "error", error,
                            "failed_at", Instant.now().toString(),
                            "node_type", message.getNodeType()
                    ))
                    .timestamp(Instant.now())
                    .processingTime(processingTime)
                    .build();

            eventProducer.publishNodeCompletion(failureMessage);
            log.info("Published failure event for node: {}", message.getNodeId());

        } catch (Exception publishError) {
            log.error("Failed to publish failure event for node: {}", message.getNodeId(), publishError);
        }
    }
}