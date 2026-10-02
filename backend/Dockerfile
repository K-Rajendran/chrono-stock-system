# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY pom.xml .

# Download dependencies first (layer caching)
RUN apk add --no-cache maven && mvn dependency:go-offline -q

COPY src ./src

# Build without running tests (tests run in CI)
RUN mvn clean package -DskipTests -q

# ──────────────────────────────────────────────
# Stage 2: Runtime
# ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S afino && adduser -S afino -G afino
USER afino

COPY --from=builder /app/target/afino-backend.jar app.jar

USER afino

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:10000/actuator/health || exit 1

EXPOSE 10000

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
