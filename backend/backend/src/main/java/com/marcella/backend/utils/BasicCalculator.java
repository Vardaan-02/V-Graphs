package com.marcella.backend.utils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class BasicCalculator {

    public static double evaluate(String expression) throws IllegalArgumentException {
        if (expression == null || expression.trim().isEmpty()) {
            throw new IllegalArgumentException("Expression cannot be null or empty");
        }

        String cleanExpression = expression.replaceAll("\\s+", "");
        validateExpression(cleanExpression);

        try {
            ExpressionParser parser = new ExpressionParser(cleanExpression);
            return parser.parseExpression();
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid expression: " + e.getMessage());
        }
    }

    private static void validateExpression(String expression) {
        if (expression.isEmpty()) {
            throw new IllegalArgumentException("Empty expression");
        }

        if (!expression.matches("[0-9+\\-*/.()]+")) {
            throw new IllegalArgumentException("Expression contains invalid characters");
        }

        int parenthesesCount = 0;
        for (char c : expression.toCharArray()) {
            if (c == '(') parenthesesCount++;
            if (c == ')') parenthesesCount--;
            if (parenthesesCount < 0) {
                throw new IllegalArgumentException("Unbalanced parentheses");
            }
        }
        if (parenthesesCount != 0) {
            throw new IllegalArgumentException("Unbalanced parentheses");
        }
    }

    private static class ExpressionParser {
        private final String expression;
        private int position;

        public ExpressionParser(String expression) {
            this.expression = expression;
            this.position = 0;
        }

        public double parseExpression() {
            double result = parseAdditionSubtraction();
            if (position < expression.length()) {
                throw new IllegalArgumentException("Unexpected character at position " + position);
            }
            return result;
        }

        private double parseAdditionSubtraction() {
            double left = parseMultiplicationDivision();

            while (position < expression.length()) {
                char operator = expression.charAt(position);
                if (operator == '+' || operator == '-') {
                    position++;
                    double right = parseMultiplicationDivision();
                    if (operator == '+') {
                        left = left + right;
                    } else {
                        left = left - right;
                    }
                } else {
                    break;
                }
            }
            return left;
        }

        private double parseMultiplicationDivision() {
            double left = parseFactor();

            while (position < expression.length()) {
                char operator = expression.charAt(position);
                if (operator == '*' || operator == '/') {
                    position++;
                    double right = parseFactor();
                    if (operator == '*') {
                        left = left * right;
                    } else {
                        if (right == 0) {
                            throw new IllegalArgumentException("Division by zero");
                        }
                        left = left / right;
                    }
                } else {
                    break;
                }
            }
            return left;
        }

        private double parseFactor() {
            if (position >= expression.length()) {
                throw new IllegalArgumentException("Unexpected end of expression");
            }

            char currentChar = expression.charAt(position);

            if (currentChar == '-') {
                position++;
                return -parseFactor();
            }

            if (currentChar == '+') {
                position++;
                return parseFactor();
            }

            if (currentChar == '(') {
                position++;
                double result = parseAdditionSubtraction();
                if (position >= expression.length() || expression.charAt(position) != ')') {
                    throw new IllegalArgumentException("Missing closing parenthesis");
                }
                position++;
                return result;
            }

            return parseNumber();
        }

        private double parseNumber() {
            int start = position;
            boolean hasDecimalPoint = false;

            if (position >= expression.length() || !isDigitOrDecimal(expression.charAt(position))) {
                throw new IllegalArgumentException("Expected number at position " + position);
            }

            while (position < expression.length()) {
                char currentChar = expression.charAt(position);

                if (Character.isDigit(currentChar)) {
                    position++;
                } else if (currentChar == '.' && !hasDecimalPoint) {
                    hasDecimalPoint = true;
                    position++;
                } else {
                    break;
                }
            }

            String numberStr = expression.substring(start, position);
            try {
                return Double.parseDouble(numberStr);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid number: " + numberStr);
            }
        }

        private boolean isDigitOrDecimal(char c) {
            return Character.isDigit(c) || c == '.';
        }
    }

    public static class CalculationResult {
        private final double result;
        private final String originalExpression;
        private final boolean successful;
        private final String errorMessage;

        private CalculationResult(double result, String originalExpression, boolean successful, String errorMessage) {
            this.result = result;
            this.originalExpression = originalExpression;
            this.successful = successful;
            this.errorMessage = errorMessage;
        }

        public static CalculationResult success(double result, String expression) {
            return new CalculationResult(result, expression, true, null);
        }

        public static CalculationResult failure(String expression, String errorMessage) {
            return new CalculationResult(0, expression, false, errorMessage);
        }

        public double getResult() { return result; }
        public String getOriginalExpression() { return originalExpression; }
        public boolean isSuccessful() { return successful; }
        public String getErrorMessage() { return errorMessage; }
    }

    public static CalculationResult safeEvaluate(String expression) {
        try {
            double result = evaluate(expression);
            return CalculationResult.success(result, expression);
        } catch (Exception e) {
            log.warn("Calculator evaluation failed for expression '{}': {}", expression, e.getMessage());
            return CalculationResult.failure(expression, e.getMessage());
        }
    }
}