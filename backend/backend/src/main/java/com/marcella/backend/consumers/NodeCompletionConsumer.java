package com.marcella.backend.consumers;

import com.marcella.backend.services.DistributedWorkflowCoordinator;
import com.marcella.backend.workflow.NodeCompletionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NodeCompletionConsumer {

    private final DistributedWorkflowCoordinator workflowCoordinator;

    @KafkaListener(
            topics = "node-completion",
            groupId = "workflow-coordinator",
            containerFactory = "nodeCompletionListenerFactory"
    )
    public void handleNodeCompletion(
            @Payload NodeCompletionMessage message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {

        try {
            log.info("Node completion received: {} with status: {} from topic: {} partition: {} offset: {}",
                    message.getNodeId(), message.getStatus(), topic, partition, offset);

            workflowCoordinator.handleNodeCompletion(message);

            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Error processing node completion: {} - will acknowledge to avoid reprocessing",
                    message.getNodeId(), e);

            acknowledgment.acknowledge();
        }
    }
}