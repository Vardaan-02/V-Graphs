package com.marcella.backend.configurations;

import com.marcella.backend.nodeHandlers.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class NodeHandlerConfig {

    private final StartNodeHandler startNodeHandler;
    private final EmailNodeHandler emailNodeHandler;
    private final TransformNodeHandler transformNodeHandler;
    private final WebhookNodeHandler webhookNodeHandler;
    private final DelayNodeHandler delayNodeHandler;
    private final FilterNodeHandler filterNodeHandler;
    private final CalculatorNodeHandler calculatorNodeHandler;
    private final TimeZoneNodeHandler timeZoneNodeHandler;
    private final GoogleCalendarNodeHandler googleCalendarNodeHandler;
    private final HttpRequestNodeHandler httpRequestNodeHandler;

    private final GmailSendNodeHandler gmailSendNodeHandler;
    private final GmailSearchNodeHandler gmailSearchNodeHandler;
    private final GmailMarkReadNodeHandler gmailMarkReadNodeHandler;
    private final GmailCreateDraftNodeHandler gmailCreateDraftNodeHandler;
    private final GmailAddLabelNodeHandler gmailAddLabelNodeHandler;
    private final GmailReplyNodeHandler gmailReplyNodeHandler;

    @Bean
    public List<NodeHandler> nodeHandlers() {
        return List.of(
                startNodeHandler,
                emailNodeHandler,
                transformNodeHandler,
                webhookNodeHandler,
                delayNodeHandler,
                filterNodeHandler,
                calculatorNodeHandler,
                timeZoneNodeHandler,
                googleCalendarNodeHandler,
                httpRequestNodeHandler,
                gmailSendNodeHandler,
                gmailSearchNodeHandler,
                gmailAddLabelNodeHandler,
                gmailReplyNodeHandler,
                gmailCreateDraftNodeHandler,
                gmailMarkReadNodeHandler
        );
    }
}