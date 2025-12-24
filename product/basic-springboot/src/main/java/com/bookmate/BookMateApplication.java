package com.bookmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * BookMate - Aplicación principal
 * Track: BASIC (Prototipo con Spring Boot)
 * 
 * Esta aplicación sirve archivos estáticos (HTML, CSS, JS) y datos JSON
 * manteniendo toda la lógica del frontend desarrollada previamente.
 * 
 * @author Equipo BookMate
 * @version 1.0.0
 */
@SpringBootApplication
public class BookMateApplication {

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("  ____              _    __  __       _          ");
        System.out.println(" | __ )  ___   ___ | | _|  \\/  | __ _| |_ ___   ");
        System.out.println(" |  _ \\ / _ \\ / _ \\| |/ / |\\/| |/ _` | __/ _ \\  ");
        System.out.println(" | |_) | (_) | (_) |   <| |  | | (_| | ||  __/  ");
        System.out.println(" |____/ \\___/ \\___/|_|\\_\\_|  |_|\\__,_|\\__\\___|  ");
        System.out.println("                                                 ");
        System.out.println("         Plataforma de Gestión de Libros        ");
        System.out.println("=================================================");
        System.out.println();
        
        SpringApplication.run(BookMateApplication.class, args);
        
        System.out.println();
        System.out.println("✅ BookMate iniciado correctamente!");
        System.out.println("📖 Accede a: http://localhost:8080");
        System.out.println("🛑 Presiona Ctrl+C para detener el servidor");
        System.out.println();
    }

    /**
     * Configuración CORS para desarrollo
     * Permite peticiones desde cualquier origen (útil para desarrollo)
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}





