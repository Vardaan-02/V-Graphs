package com.marcella.backend.nodeHandlers;

import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.BasicCalculator;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalculatorNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return Objects.equals(nodeType, "calculator");
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long startTime = System.currentTimeMillis();
        log.info("Executing calculator node: {}", message.getNodeId());

        try {
            Map<String, Object> nodeData = message.getNodeData();
            Map<String, Object> context = message.getContext();

            log.info("Calculator node context variables: {}", context.keySet());

            String rawExpression = (String) nodeData.get("expression");
            if (rawExpression == null || rawExpression.trim().isEmpty()) {
                throw new IllegalArgumentException("No expression provided");
            }

            String expression = TemplateUtils.substitute(rawExpression, context);
            log.info("Evaluating expression: '{}'", expression);

            BasicCalculator.CalculationResult calculationResult = BasicCalculator.safeEvaluate(expression);

            Map<String, Object> output = new HashMap<>(context);

            if (calculationResult.isSuccessful()) {
                double result = calculationResult.getResult();

                output.put("expression", expression);
                output.put("original_expression", rawExpression);
                output.put("result", result);
                output.put("calculation_successful", true);
                output.put("node_type", "calculator");
                output.put("executed_at", Instant.now().toString());

                long processingTime = System.currentTimeMillis() - startTime;
                publishCompletionEvent(message, output, "COMPLETED", processingTime);

                log.info("Expression '{}' evaluated successfully: {}", expression, result);
                return output;

            } else {
                throw new RuntimeException("Calculation failed: " + calculationResult.getErrorMessage());
            }

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Calculator node failed: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) {
                errorOutput.putAll(message.getContext());
            }

            errorOutput.put("error", e.getMessage());
            errorOutput.put("expression", message.getNodeData().get("expression"));
            errorOutput.put("result", null);
            errorOutput.put("calculation_successful", false);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "calculator");

            publishCompletionEvent(message, errorOutput, "FAILED", processingTime);
            throw new RuntimeException("Error evaluating expression: " + e.getMessage(), e);
        }
    }

    private void publishCompletionEvent(NodeExecutionMessage message,
                                        Map<String, Object> output,
                                        String status,
                                        long processingTime) {
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
        log.info("Published completion event for calculator node: {} with status: {} in {}ms",
                message.getNodeId(), status, processingTime);
    }
}