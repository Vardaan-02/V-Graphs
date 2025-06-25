package com.marcella.backend.utils;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class TemplateUtils {

    private static final Pattern pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}");

    public static String substitute(String template, Map<String, Object> context) {
        if (template == null || context == null) {
            log.warn("Template or context is null - template: {}, context: {}", template, context != null);
            return template;
        }

        String result = template;
        Matcher matcher = pattern.matcher(template);

        while (matcher.find()) {
            String placeholder = matcher.group(0);
            String variableName = matcher.group(1);
            Object value = context.get(variableName);

            if (value != null) {
                result = result.replace(placeholder, String.valueOf(value));
                log.debug("Substituted {} -> {}", placeholder, value);
            } else {
                log.warn("No value found for template variable: {}. Available: {}", variableName, context.keySet());
            }
        }

        return result;
    }
}
