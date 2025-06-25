#!/bin/bash
# setup-infrastructure.sh
# Setup script for workflow infrastructure

set -e

echo "🚀 Setting up Workflow Infrastructure..."

# Create logs directory for application logs (optional)
echo "📁 Creating logs directory..."
mkdir -p logs
chmod -R 755 logs/

# Create Kafka topics for the workflow system
create_topics() {
    echo "📝 Creating Kafka topics..."

    # Wait for Kafka to be ready
    echo "⏳ Waiting for Kafka to be ready..."
    sleep 30

    # Topics based on your Spring Boot configuration
    docker exec workflow-kafka kafka-topics.sh \
        --bootstrap-server localhost:29092 \
        --create --if-not-exists \
        --topic spring-nodes \
        --partitions 3 \
        --replication-factor 1

    docker exec workflow-kafka kafka-topics.sh \
        --bootstrap-server localhost:29092 \
        --create --if-not-exists \
        --topic fastapi-nodes \
        --partitions 3 \
        --replication-factor 1

    docker exec workflow-kafka kafka-topics.sh \
        --bootstrap-server localhost:29092 \
        --create --if-not-exists \
        --topic node-completion \
        --partitions 3 \
        --replication-factor 1

    docker exec workflow-kafka kafka-topics.sh \
        --bootstrap-server localhost:29092 \
        --create --if-not-exists \
        --topic workflow-coordination \
        --partitions 1 \
        --replication-factor 1

    docker exec workflow-kafka kafka-topics.sh \
        --bootstrap-server localhost:29092 \
        --create --if-not-exists \
        --topic workflow-state-updates \
        --partitions 1 \
        --replication-factor 1

    echo "✅ Kafka topics created successfully"
}

# Health check function
health_check() {
    echo "🏥 Running health checks..."

    # Check Kafka
    echo "Checking Kafka..."
    docker exec workflow-kafka kafka-topics.sh --bootstrap-server localhost:29092 --list

    # Check Redis
    echo "Checking Redis..."
    docker exec workflow-redis redis-cli ping

    echo "✅ All services are healthy"
}

# Main execution
case "${1:-start}" in
    start)
        echo "🏁 Starting infrastructure..."
        docker-compose -f docker-compose.infrastructure.yml up -d

        # Wait and create topics
        create_topics

        # Run health check
        health_check

        echo "🎉 Infrastructure is ready!"
        echo ""
        echo "📊 Access URLs:"
        echo "  - Kafka UI: http://localhost:8080"
        echo "  - Redis Commander: http://localhost:8081 (admin/admin123)"
        echo ""
        echo "🔗 Connection Details:"
        echo "  - Kafka Bootstrap Servers: localhost:9092"
        echo "  - Redis URL: redis://localhost:6379"
        ;;

    stop)
        echo "🛑 Stopping infrastructure..."
        docker-compose -f docker-compose.infrastructure.yml down
        ;;

    restart)
        echo "🔄 Restarting infrastructure..."
        docker-compose -f docker-compose.infrastructure.yml down
        docker-compose -f docker-compose.infrastructure.yml up -d
        create_topics
        health_check
        ;;

    clean)
        echo "🧹 Cleaning up infrastructure and data..."
        docker-compose -f docker-compose.infrastructure.yml down -v
        docker volume prune -f
        docker system prune -f
        ;;

    logs)
        echo "📋 Showing infrastructure logs..."
        docker-compose -f docker-compose.infrastructure.yml logs -f
        ;;

    status)
        echo "📊 Infrastructure status..."
        docker-compose -f docker-compose.infrastructure.yml ps
        health_check
        ;;

    topics)
        echo "📝 Listing Kafka topics..."
        docker exec workflow-kafka kafka-topics.sh --bootstrap-server localhost:29092 --list
        ;;

    *)
        echo "Usage: $0 {start|stop|restart|clean|logs|status|topics}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the infrastructure"
        echo "  stop    - Stop the infrastructure"
        echo "  restart - Restart the infrastructure"
        echo "  clean   - Clean up everything (including data)"
        echo "  logs    - Show infrastructure logs"
        echo "  status  - Show status and run health checks"
        echo "  topics  - List Kafka topics"
        exit 1
        ;;
esac