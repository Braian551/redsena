FROM maven:3.9.16-eclipse-temurin-21 AS build

WORKDIR /build
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
RUN ./mvnw -B -DskipTests dependency:go-offline
COPY src src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN apk add --no-cache curl
RUN addgroup -S redsena && adduser -S redsena -G redsena
WORKDIR /app
COPY --from=build /build/target/demo-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir -p /app/uploads && chown -R redsena:redsena /app
USER redsena

ENV UPLOAD_PATH=/app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
