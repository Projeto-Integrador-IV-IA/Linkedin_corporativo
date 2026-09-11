package br.com.linkedincorporativo.project;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class ProjectServiceApplication {

    @Value("${spring.application.name}")
    private String serviceName;

    public static void main(String[] args) {
        SpringApplication.run(ProjectServiceApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of("service", serviceName, "status", "UP");
    }

    @GetMapping("/api/projects/ping")
    public Map<String, String> ping() {
        return Map.of("service", serviceName, "message", "pong");
    }
}
