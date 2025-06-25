package com.marcella.backend.nodeHandlers;

import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FilterNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "condition".equalsIgnoreCase(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) throws InterruptedException {
        long startTime = System.currentTimeMillis();
        log.info("Executing filter/condition node: {}", message.getNodeId());

        try {
            Map<String, Object> nodeData = message.getNodeData();
            Map<String, Object> context = message.getContext();

            Map<String, Object> condition = (Map<String, Object>) nodeData.get("condition");
            if (condition == null) {
                log.warn("No condition specified in filter node: {}, defaulting to true", message.getNodeId());
                return executeWithDefaultResult(message, context, true, startTime);
            }

            String field = TemplateUtils.substitute((String) condition.get("field"), context);
            String operator = TemplateUtils.substitute((String) condition.get("operator"), context);
            String expectedValueRaw = TemplateUtils.substitute(String.valueOf(condition.get("value")), context);

            if (field == null || operator == null) {
                log.warn("Invalid condition configuration in node: {} - missing field or operator", message.getNodeId());
                return executeWithDefaultResult(message, context, false, startTime);
            }

            Object actualValue = context.get(field);
            Object expectedValue = expectedValueRaw;

            boolean conditionResult = evaluateCondition(actualValue, operator, expectedValue);

            log.info("Filter evaluation for node {}: {} {} {} = {}",
                    message.getNodeId(), actualValue, operator, expectedValue, conditionResult);

            Map<String, Object> output = buildConditionOutput(context, conditionResult, actualValue, operator, expectedValue);

            long processingTime = System.currentTimeMillis() - startTime;
            publishCompletionEvent(message, output, "COMPLETED", processingTime);

            return output;

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Filter node failed: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = Map.of(
                    "error", e.getMessage(),
                    "condition_result", false,
                    "failed_at", Instant.now().toString()
            );

            publishCompletionEvent(message, errorOutput, "FAILED", processingTime);
            throw e;
        }
    }

    private Map<String, Object> executeWithDefaultResult(NodeExecutionMessage message,
                                                         Map<String, Object> context,
                                                         boolean defaultResult,
                                                         long startTime) {
        Map<String, Object> output = buildConditionOutput(context, defaultResult, null, "default", null);
        long processingTime = System.currentTimeMillis() - startTime;
        publishCompletionEvent(message, output, "COMPLETED", processingTime);
        return output;
    }

    private Map<String, Object> buildConditionOutput(Map<String, Object> context,
                                                     boolean conditionResult,
                                                     Object actualValue,
                                                     String operator,
                                                     Object expectedValue) {
        Map<String, Object> output = new HashMap<>();
        if (context != null) {
            output.putAll(context);
        }

        output.put("condition_result", conditionResult);
        output.put("condition_passed", conditionResult);
        output.put("evaluated_at", Instant.now().toString());
        output.put("node_type", "filter");

        Map<String, Object> evaluationDetails = new HashMap<>();
        evaluationDetails.put("actual_value", actualValue);
        evaluationDetails.put("operator", operator);
        evaluationDetails.put("expected_value", expectedValue);
        evaluationDetails.put("result", conditionResult);
        output.put("evaluation_details", evaluationDetails);

        output.put("branch", String.valueOf(conditionResult));
        output.put("condition_branch", String.valueOf(conditionResult));

        return output;
    }

    private boolean evaluateCondition(Object actual, String operator, Object expected) {
        if (actual == null || operator == null || expected == null) {
            log.warn("Null values in condition: actual={}, operator={}, expected={}", actual, operator, expected);
            return false;
        }

        try {
            double actualNum = Double.parseDouble(actual.toString());
            double expectedNum = Double.parseDouble(expected.toString());

            return switch (operator.toLowerCase()) {
                case ">", "gt", "greater_than" -> actualNum > expectedNum;
                case "<", "lt", "less_than" -> actualNum < expectedNum;
                case ">=", "gte", "greater_than_or_equal" -> actualNum >= expectedNum;
                case "<=", "lte", "less_than_or_equal" -> actualNum <= expectedNum;
                case "==", "eq", "equals" -> actualNum == expectedNum;
                case "!=", "neq", "not_equals" -> actualNum != expectedNum;
                default -> {
                    log.warn("Unknown numeric operator: {}", operator);
                    yield false;
                }
            };
        } catch (NumberFormatException e) {
            String actualStr = actual.toString();
            String expectedStr = expected.toString();

            return switch (operator.toLowerCase()) {
                case "==", "eq", "equals" -> actualStr.equals(expectedStr);
                case "!=", "neq", "not_equals" -> !actualStr.equals(expectedStr);
                case "contains" -> actualStr.contains(expectedStr);
                case "not_contains" -> !actualStr.contains(expectedStr);
                case "starts_with" -> actualStr.startsWith(expectedStr);
                case "ends_with" -> actualStr.endsWith(expectedStr);
                case "matches", "regex" -> actualStr.matches(expectedStr);
                case "equals_ignore_case" -> actualStr.equalsIgnoreCase(expectedStr);
                case "is_empty" -> actualStr.isEmpty();
                case "is_not_empty" -> !actualStr.isEmpty();
                default -> {
                    log.warn("Unknown string operator: {}", operator);
                    yield false;
                }
            };
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
        log.info("Published completion event for filter node: {} with status: {} and condition result: {} in {}ms",
                message.getNodeId(), status, output.get("condition_result"), processingTime);
    }
}
