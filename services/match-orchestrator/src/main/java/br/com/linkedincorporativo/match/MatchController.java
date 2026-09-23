package br.com.linkedincorporativo.match;

import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/matches")
public class MatchController {
    private final RestClient client = RestClient.create();
    private final String profileUrl;
    private final String projectUrl;
    private final String mlUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .build();

    public MatchController(
        @Value("${services.profile-url}") String profileUrl,
        @Value("${services.project-url}") String projectUrl,
        @Value("${services.ml-engine-url}") String mlUrl
    ) {
        this.profileUrl = profileUrl;
        this.projectUrl = projectUrl;
        this.mlUrl = mlUrl;
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> recommend(@PathVariable Long projectId) throws JsonProcessingException, IOException, InterruptedException {
        Map<String, Object> project = client.get().uri(projectUrl + "/api/projects/" + projectId)
            .header("X-Internal-Request", "match-orchestrator")
            .retrieve().body(new ParameterizedTypeReference<>() {});
        List<Map<String, Object>> profiles = client.get().uri(profileUrl + "/api/profiles")
            .retrieve().body(new ParameterizedTypeReference<>() {});

        List<Map<String, Object>> requiredSkills = listOfMaps(project.get("requiredSkills"));
        List<String> required = requiredSkills.stream().map(skill -> stringValue(skill.get("skillName"))).toList();
        List<Map<String, Object>> candidates = profiles.stream().map(profile -> Map.<String, Object>of(
            "candidate_id", String.valueOf(profile.get("id")),
            "skills", listOfMaps(profile.get("skills")).stream().map(skill -> stringValue(skill.get("skillName"))).toList(),
            "profession", stringValue(profile.get("profession")),
            "years_experience", numberValue(profile.get("yearsOfExperience"))
        )).toList();

        Map<String, Object> request = Map.of(
            "candidates", candidates,
            "required_skills", required,
            "required_title", stringValue(project.get("title"))
        );
        byte[] requestBody = objectMapper.writeValueAsString(request).getBytes(StandardCharsets.UTF_8);
        HttpRequest mlRequest = HttpRequest.newBuilder(URI.create(mlUrl + "/predict"))
            .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .header("Accept", MediaType.APPLICATION_JSON_VALUE)
            .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
            .build();
        HttpResponse<String> mlResponse = httpClient.send(mlRequest, HttpResponse.BodyHandlers.ofString());
        if (mlResponse.statusCode() >= 400) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY, mlResponse.body());
        }
        Map<String, Object> prediction = objectMapper.readValue(mlResponse.body(), new TypeReference<>() {});
        return ResponseEntity.ok(Map.of("projectId", projectId, "projectTitle", stringValue(project.get("title")),
            "results", prediction == null ? List.of() : prediction.getOrDefault("results", List.of())));
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> listOfMaps(Object value) {
        return value instanceof List<?> list ? (List<Map<String, Object>>) (List<?>) list : List.of();
    }
    private static String stringValue(Object value) { return value == null ? "" : String.valueOf(value); }
    private static int numberValue(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }
}
