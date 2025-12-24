# product/basic-springboot/Dockerfile

# Etapa 1: Construcción (Build)
# Usamos una imagen de Maven que sí existe
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Compilar el .jar saltando los tests para ir rápido
RUN mvn clean package -DskipTests

# Etapa 2: Ejecución (Run)
# CAMBIO AQUÍ: Usamos Eclipse Temurin en lugar de OpenJDK (que ya no existe)
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
# Copiar el .jar generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]