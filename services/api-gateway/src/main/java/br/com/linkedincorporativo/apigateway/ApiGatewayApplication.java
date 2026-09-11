package br.com.linkedincorporativo.apigateway;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@SpringBootApplication
@RestController
public class ApiGatewayApplication {

    private final RestClient restClient = RestClient.create();

    @Value("${spring.application.name}")
    private String serviceName;

    @Value("${services.profile-url}")
    private String profileServiceUrl;

    @Value("${services.project-url}")
    private String projectServiceUrl;

    @Value("${services.match-url}")
    private String matchOrchestratorUrl;

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of("service", serviceName, "status", "UP");
    }

    @GetMapping("/health/dependencies")
    public Map<String, String> dependencyHealth() {
        Map<String, String> health = new LinkedHashMap<>();
        health.put("profile-service", check(profileServiceUrl + "/actuator/health"));
        health.put("project-service", check(projectServiceUrl + "/actuator/health"));
        health.put("match-orchestrator", check(matchOrchestratorUrl + "/actuator/health"));
        return health;
    }

    private String check(String url) {
        try {
            ResponseEntity<String> response = restClient.get().uri(url).retrieve().toEntity(String.class);
            return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
        } catch (RuntimeException exception) {
            return "DOWN";
        }
    }
}
