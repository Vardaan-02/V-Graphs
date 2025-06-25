FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -B

COPY src src

RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

WORKDIR /app

COPY --from=builder --chown=65534:65534 /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

USER 65534

EXPOSE 2706

VOLUME /tmp

ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+ExitOnOutOfMemoryError \
               -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=90s \
            --retries=3 \
    CMD curl -f -s http://localhost:2706/actuator/health || \
        curl -f -s http://localhost:2706/ || \
        exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]