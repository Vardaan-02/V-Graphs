package com.marcella.backend.nodeHandlers;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.marcella.backend.configurations.GoogleCalendarConfig;
import com.marcella.backend.services.WorkflowEventProducer;
import com.marcella.backend.utils.TemplateUtils;
import com.marcella.backend.workflow.NodeCompletionMessage;
import com.marcella.backend.workflow.NodeExecutionMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarNodeHandler implements NodeHandler {

    private final WorkflowEventProducer eventProducer;

    @Override
    public boolean canHandle(String nodeType) {
        return "googleCalendar".equalsIgnoreCase(nodeType);
    }

    @Override
    public Map<String, Object> execute(NodeExecutionMessage message) {
        long startTimeMillis = System.currentTimeMillis();
        Map<String, Object> output = new HashMap<>();

        try {
            Map<String, Object> context = message.getContext();
            Map<String, Object> data = message.getNodeData();

            String googleToken = (String) context.get("googleAccessToken");
            if (googleToken == null || googleToken.isBlank()) {
                throw new IllegalStateException("Missing Google access token");
            }

            String userEmail = context.getOrDefault("user_email", "unknown").toString();
            log.info("Google Calendar event being created by user: {}", userEmail);

            String rawSummary = (String) data.get("summary");
            String rawDescription = (String) data.get("description");
            String rawLocation = (String) data.get("location");
            String rawStartTime = (String) data.get("startTime");
            String rawEndTime = (String) data.get("endTime");
            String rawCalendarId = (String) data.getOrDefault("calendarId", "primary");

            String summary = TemplateUtils.substitute(rawSummary, context);
            String description = rawDescription != null ? TemplateUtils.substitute(rawDescription, context) : null;
            String location = rawLocation != null ? TemplateUtils.substitute(rawLocation, context) : null;
            String substitutedStartTime = TemplateUtils.substitute(rawStartTime, context);
            String substitutedEndTime = TemplateUtils.substitute(rawEndTime, context);
            String calendarId = TemplateUtils.substitute(rawCalendarId, context);

            String isoStartTime = convertToISO8601UTC(substitutedStartTime);
            String isoEndTime = convertToISO8601UTC(substitutedEndTime);

            if (summary == null || summary.isBlank()) throw new IllegalArgumentException("Event summary is required");
            if (isoStartTime == null || isoStartTime.isBlank()) throw new IllegalArgumentException("Start time is required");
            if (isoEndTime == null || isoEndTime.isBlank()) throw new IllegalArgumentException("End time is required");

            log.info("Creating calendar event: {} from {} to {} in calendar: {}", summary, isoStartTime, isoEndTime, calendarId);

            Calendar service = GoogleCalendarConfig.getCalendarService(googleToken);

            Event event = new Event()
                    .setSummary(summary)
                    .setStart(new EventDateTime().setDateTime(new DateTime(isoStartTime)))
                    .setEnd(new EventDateTime().setDateTime(new DateTime(isoEndTime)));

            if (description != null && !description.isBlank()) event.setDescription(description);
            if (location != null && !location.isBlank()) event.setLocation(location);

            Object attendeesObj = data.get("attendees");
            if (attendeesObj != null) {
                String attendeesStr = TemplateUtils.substitute(String.valueOf(attendeesObj), context);
                if (!attendeesStr.isBlank()) {
                    log.info("Event attendees: {}", attendeesStr);
                }
            }

            Event createdEvent = service.events().insert(calendarId, event).execute();

            if (context != null) output.putAll(context);
            output.put("calendar_event_summary", summary);
            output.put("calendar_event_id", createdEvent.getId());
            output.put("calendar_event_link", createdEvent.getHtmlLink());
            output.put("calendar_event_start", isoStartTime);
            output.put("calendar_event_end", isoEndTime);
            output.put("calendar_id", calendarId);
            output.put("event_created", true);
            output.put("node_type", "googleCalendar");
            output.put("executed_at", Instant.now().toString());

            if (description != null) output.put("calendar_event_description", description);
            if (location != null) output.put("calendar_event_location", location);

            publishCompletionEvent(message, output, "COMPLETED", System.currentTimeMillis() - startTimeMillis);
            log.info("Successfully created event: {} with ID: {}", summary, createdEvent.getId());
            return output;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTimeMillis;
            log.error("Google Calendar Node Error for node: {}", message.getNodeId(), e);

            Map<String, Object> errorOutput = new HashMap<>();
            if (message.getContext() != null) errorOutput.putAll(message.getContext());
            errorOutput.put("error", e.getMessage());
            errorOutput.put("calendar_operation_failed", true);
            errorOutput.put("failed_at", Instant.now().toString());
            errorOutput.put("node_type", "googleCalendar");
            errorOutput.put("event_created", false);

            publishCompletionEvent(message, errorOutput, "FAILED", duration);
            throw new RuntimeException("Google Calendar Node failed: " + e.getMessage(), e);
        }
    }

    private String convertToISO8601UTC(String input) throws Exception {
        SimpleDateFormat inputFormat = new SimpleDateFormat("dd MMMM yyyy, h:mm a", Locale.ENGLISH);
        inputFormat.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

        Date date = inputFormat.parse(input);

        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
        isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        return isoFormat.format(date);
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
        log.info("Published completion event for Google Calendar node: {} with status: {} in {}ms",
                message.getNodeId(), status, duration);
    }
}
