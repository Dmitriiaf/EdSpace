FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/demo-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080

# Создаём непривилегированного пользователя
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
# Даём права на папку app
RUN chown -R appuser:appgroup /app
# Переключаемся на пользователя
USER appuser

ENTRYPOINT ["java", "-jar", "app.jar"]