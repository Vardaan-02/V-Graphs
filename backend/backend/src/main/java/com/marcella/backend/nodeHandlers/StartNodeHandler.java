package com.marcella.backend.nodeHandlers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StartNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Duration API_KEY_TTL = Duration.ofHours(1);

    @Override
    public boolean canHandle(String nodeType) {
        return "start".equals(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long startTime = System.currentTimeMillis();
        log.info("Start node executed for workflow: {} node: {}", message.getWorkflowId(), message.getNodeId());

        try {
            Map<String, Object> output = new HashMap<>();

            if (message.getNodeData() != null && message.getNodeData().containsKey("context")) {
                Object contextObj = message.getNodeData().get("context");

                if (contextObj instanceof String strContext) {
                    if (!strContext.trim().isEmpty()) {
                        try {
                            Map<String, Object> parsed = objectMapper.readValue(strContext, new TypeReference<>() {});
                            output.putAll(parsed);
                            log.info("Parsed stringified context with {} keys", parsed.size());

                            checkAndStoreOpenAIKey(parsed, message.getExecutionId().toString());
                        }
                        catch (Exception parseEx) {
                            log.warn("Failed to parse context string in nodeData: {}", strContext, parseEx);
                        }
                    }
                    else {
                        log.warn("Context string is empty or null, skipping parse");
                    }
                }
                else if (contextObj instanceof Map<?, ?> mapContext) {
                    output.putAll((Map<String, Object>) mapContext);
                    log.info("Loaded context map with {} keys", mapContext.size());

                    checkAndStoreOpenAIKey((Map<String, Object>) mapContext, message.getExecutionId().toString());
                }
                else {
                    log.warn("Unexpected context type: {}", contextObj.getClass().getName());
                }
            }

            if (message.getContext() != null) {
                output.putAll(message.getContext());


                checkAndStoreOpenAIKey(message.getContext(), message.getExecutionId().toString());
            }

            output.put("node_executed_at", Instant.now().toString());
            output.put("node_type", "start");
            output.put("execution_id", message.getExecutionId().toString());
            output.put("started_by", "workflow_coordinator");

            long processingTime = System.currentTimeMillis() - startTime;

            publishCompletionEvent(message, output, "COMPLETED", processingTime);

            return output;

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Start node failed: {}", message.getNodeId(), e);
            publishCompletionEvent(message, Map.of("error", e.getMessage()), "FAILED", processingTime);
            throw e;
        }
    }

    private void checkAndStoreOpenAIKey(Map<String, Object> context, String executionId) {
        if (context == null || context.isEmpty()) {
            return;
        }

        try {
            Object openaiValue = context.get("openai");

            if (openaiValue != null) {
                String apiKey = null;

                if (openaiValue instanceof String) {
                    apiKey = (String) openaiValue;
                } else if (openaiValue instanceof Map<?, ?> openaiMap) {

                    Object apiKeyValue = openaiMap.get("api_key");
                    if (apiKeyValue instanceof String) {
                        apiKey = (String) apiKeyValue;
                    }
                }

                if (apiKey != null && !apiKey.trim().isEmpty()) {

                    String redisKey = "execution:" + executionId + ":openai_api_key";

                    redisTemplate.opsForValue().set(redisKey, apiKey, API_KEY_TTL);

                    log.info("✅ Stored OpenAI API key in Redis for execution: {} (key: {})",
                            executionId, redisKey);


                    redisTemplate.opsForValue().set("openai_api_key", apiKey, API_KEY_TTL);
                    log.info("✅ Updated global OpenAI API key in Redis");

                } else {
                    log.warn("⚠️ OpenAI key found but value is empty or null");
                }
            }
        } catch (Exception e) {
            log.error("❌ Failed to store OpenAI API key in Redis for execution: {}", executionId, e);

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
        log.info("Published completion event for node: {} with status: {} in {}ms",
                message.getNodeId(), status, processingTime);
    }
}