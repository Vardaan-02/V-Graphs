package com.marcella.backend.nodeHandlers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean canHandle(String nodeType) {
        return "trigger".equals(nodeType) || "webhook".equals(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long startTime = System.currentTimeMillis();
        log.info("Executing webhook node: {}", message.getNodeId());

        try {
            Map<String, Object> nodeData = message.getNodeData();
            Map<String, Object> context = message.getContext();

            String rawUrl = (String) nodeData.get("url");
            String url = rawUrl != null ? TemplateUtils.substitute(rawUrl, context) : null;

            String rawMethod = (String) nodeData.getOrDefault("method", "POST");
            String method = TemplateUtils.substitute(rawMethod, context);

            Map<String, String> headers = processHeaders(nodeData.get("headers"), context);

            Map<String, Object> payload = processPayload(nodeData.get("payload"), context);

            Map<String, Object> output = new HashMap<>();
            if (context != null) {
                output.putAll(context);
            }

            if (url != null && !url.trim().isEmpty()) {
                try {
                    ResponseEntity<String> response = makeHttpRequest(url, method, headers, payload);

                    output.put("webhook_called", true);
                    output.put("webhook_url", url);
                    output.put("webhook_method", method);
                    output.put("webhook_status_code", response.getStatusCode().value());
                    output.put("webhook_response_body", response.getBody());
                    output.put("webhook_response_headers", response.getHeaders().toSingleValueMap());

                    if (response.getBody() != null && !response.getBody().trim().isEmpty()) {
                        try {
                            Object parsedResponse = objectMapper.readValue(response.getBody(), Object.class);
                            output.put("webhook_response_json", parsedResponse);

                            if (parsedResponse instanceof Map) {
                                Map<String, Object> responseMap = (Map<String, Object>) parsedResponse;
                                responseMap.forEach((key, value) -> output.put("webhook_" + key, value));
                            }
                        } catch (Exception e) {
                            log.debug("Response body is not valid JSON, keeping as string");
                        }
                    }

                    log.info("Webhook HTTP request successful: {} {} -> {}", method, url, response.getStatusCode());
                } catch (Exception e) {
                    log.warn("Failed to make HTTP request for webhook: {}", e.getMessage());
                    output.put("webhook_called", false);
                    output.put("webhook_error", e.getMessage());
                }
            } else {
                log.info("Webhook triggered without HTTP request");
                output.put("webhook_triggered", true);
            }

            output.put("webhook_url", url);
            output.put("webhook_method", method);
            output.put("webhook_headers", headers);
            output.put("webhook_payload", payload);
            output.put("triggered_at", Instant.now().toString());
            output.put("node_type", "webhook");
            output.put("executed_at", Instant.now().toString());

            long processingTime = System.currentTimeMillis() - startTime;
            publishCompletionEvent(message, output, "COMPLETED", processingTime);

            return output;

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Webhook node failed: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) {
                errorOutput.putAll(message.getContext());
            }
            errorOutput.put("error", e.getMessage());
            errorOutput.put("webhook_called", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "webhook");

            publishCompletionEvent(message, errorOutput, "FAILED", processingTime);
            throw new RuntimeException("Webhook node failed: " + e.getMessage(), e);
        }
    }

    private Map<String, String> processHeaders(Object headersObj, Map<String, Object> context) {
        Map<String, String> processedHeaders = new HashMap<>();

        if (headersObj == null) {
            return processedHeaders;
        }

        try {
            Map<String, Object> headersMap;

            if (headersObj instanceof String) {
                String headersJson = TemplateUtils.substitute((String) headersObj, context);
                if (headersJson.trim().isEmpty() || headersJson.equals("{}")) {
                    return processedHeaders;
                }
                headersMap = objectMapper.readValue(headersJson, new TypeReference<Map<String, Object>>() {});
            } else if (headersObj instanceof Map) {
                headersMap = (Map<String, Object>) headersObj;
            } else {
                log.warn("Headers object is neither String nor Map, ignoring");
                return processedHeaders;
            }

            for (Map.Entry<String, Object> entry : headersMap.entrySet()) {
                String key = TemplateUtils.substitute(entry.getKey(), context);
                String value = TemplateUtils.substitute(String.valueOf(entry.getValue()), context);
                processedHeaders.put(key, value);
            }

        } catch (Exception e) {
            log.error("Failed to process headers: {}", e.getMessage());
        }

        return processedHeaders;
    }

    private Map<String, Object> processPayload(Object payloadObj, Map<String, Object> context) {
        Map<String, Object> processedPayload = new HashMap<>();

        if (payloadObj == null) {
            return processedPayload;
        }

        try {
            if (payloadObj instanceof String) {
                String payloadStr = TemplateUtils.substitute((String) payloadObj, context);
                if (payloadStr.trim().isEmpty() || payloadStr.equals("{}")) {
                    return processedPayload;
                }
                try {
                    return objectMapper.readValue(payloadStr, new TypeReference<Map<String, Object>>() {});
                } catch (Exception e) {
                    processedPayload.put("data", payloadStr);
                    return processedPayload;
                }
            } else if (payloadObj instanceof Map) {
                Map<String, Object> payloadMap = (Map<String, Object>) payloadObj;
                for (Map.Entry<String, Object> entry : payloadMap.entrySet()) {
                    String key = TemplateUtils.substitute(entry.getKey(), context);
                    Object value = entry.getValue();

                    if (value instanceof String) {
                        value = TemplateUtils.substitute((String) value, context);
                    }

                    processedPayload.put(key, value);
                }
            } else {
                processedPayload.put("data", payloadObj);
            }
        } catch (Exception e) {
            log.error("Failed to process payload: {}", e.getMessage());
        }

        return processedPayload;
    }

    private ResponseEntity<String> makeHttpRequest(String url, String method,
                                                   Map<String, String> headers,
                                                   Map<String, Object> payload) {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        if (headers != null && !headers.isEmpty()) {
            headers.forEach(httpHeaders::add);
        }

        HttpEntity<?> entity = payload != null && !payload.isEmpty()
                ? new HttpEntity<>(payload, httpHeaders)
                : new HttpEntity<>(httpHeaders);

        return restTemplate.exchange(
                url,
                HttpMethod.valueOf(method.toUpperCase()),
                entity,
                String.class
        );
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
        log.info("Published completion event for webhook node: {} with status: {} in {}ms",
                message.getNodeId(), status, processingTime);
    }
}