# Этап 1: Сборка приложения с помощью Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Копируем исходный код
COPY src ./src
# Собираем проект, пропуская тесты для ускорения
RUN mvn clean package -DskipTests

# Этап 2: Создание финального образа для запуска
# Используем Eclipse Temurin (актуальный образ OpenJDK)
FROM eclipse-temurin:17-jre
WORKDIR /app
# Копируем собранный JAR-файл из предыдущего этапа
COPY --from=build /app/target/*.jar app.jar
# Открываем порт 8080, на котором будет работать приложение
EXPOSE 8080
# Команда для запуска приложения
ENTRYPOINT ["java", "-jar", "app.jar"]