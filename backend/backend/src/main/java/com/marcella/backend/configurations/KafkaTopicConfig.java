package com.marcella.backend.configurations;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic springNodesTopic() {
        return TopicBuilder.name("spring-nodes")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic fastApiNodesTopic() {
        return TopicBuilder.name("fastapi-nodes")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic nodeCompletionTopic() {
        return TopicBuilder.name("node-completion")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
