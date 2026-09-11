# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-21 AS build

ARG SERVICE_DIR
WORKDIR /workspace

COPY ${SERVICE_DIR}/pom.xml ./pom.xml
RUN mvn -B -ntp dependency:go-offline

COPY ${SERVICE_DIR}/src ./src
RUN mvn -B -ntp package -DskipTests

FROM eclipse-temurin:21-jre

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /usr/sbin/nologin appuser

WORKDIR /app
COPY --from=build /workspace/target/*.jar /app/app.jar

ENV JAVA_OPTS="" \
    SERVER_PORT=8080

EXPOSE 8080
USER appuser

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
