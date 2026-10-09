package br.com.linkedincorporativo.match;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final double interestBoostPoints;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .build();

    public MatchController(
        @Value("${services.profile-url}") String profileUrl,
        @Value("${services.project-url}") String projectUrl,
        @Value("${services.ml-engine-url}") String mlUrl,
        @Value("${matching.interest-boost-points:10}") double interestBoostPoints
    ) {
        this.profileUrl = profileUrl;
        this.projectUrl = projectUrl;
        this.mlUrl = mlUrl;
        this.interestBoostPoints = Math.max(0, interestBoostPoints);
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> recommend(@PathVariable Long projectId) throws JsonProcessingException, IOException, InterruptedException {
        Map<String, Object> project = client.get().uri(projectUrl + "/api/projects/" + projectId)
            .header("X-Internal-Request", "match-orchestrator")
            .retrieve().body(new ParameterizedTypeReference<>() {});
        List<Map<String, Object>> profiles = client.get().uri(profileUrl + "/api/profiles")
            .retrieve().body(new ParameterizedTypeReference<>() {});

        List<Map<String, Object>> candidates = profiles.stream().map(profile -> Map.<String, Object>of(
            "candidate_id", String.valueOf(profile.get("id")),
            "profile_description", profileDescription(profile)
        )).toList();

        Map<String, Object> request = Map.of(
            "candidates", candidates,
            "project_description", stringValue(project.get("description"))
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
        Set<String> interestedProfiles = new HashSet<>();
        for (Map<String, Object> application : listOfMaps(project.get("applications"))) {
            if (!"INTERESSADO".equalsIgnoreCase(stringValue(application.get("status")))) continue;
            String profileId = stringValue(application.get("profileId"));
            if (!profileId.isBlank()) interestedProfiles.add(profileId);
        }
        List<Map<String, Object>> results = new ArrayList<>();
        for (Map<String, Object> raw : listOfMaps(prediction == null ? null : prediction.get("results"))) {
            String candidateId = stringValue(raw.get("candidate_id"));
            double textScore = numberValue(raw.get("score"));
            boolean interested = interestedProfiles.contains(candidateId);
            double appliedBoost = interested ? interestBoostPoints : 0;
            double finalScore = Math.min(100, textScore + appliedBoost);
            Map<String, Object> ranked = new LinkedHashMap<>();
            ranked.put("candidate_id", candidateId);
            ranked.put("score", round(finalScore));
            ranked.put("text_score", round(textScore));
            ranked.put("interest_boost", round(appliedBoost));
            ranked.put("interested", interested);
            results.add(ranked);
        }
        results.sort(Comparator
            .comparingDouble((Map<String, Object> result) -> numberValue(result.get("score"))).reversed()
            .thenComparing(result -> stringValue(result.get("candidate_id"))));
        return ResponseEntity.ok(Map.of("projectId", projectId, "projectTitle", stringValue(project.get("title")),
            "interestBoostPoints", round(interestBoostPoints), "results", results));
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> listOfMaps(Object value) {
        return value instanceof List<?> list ? (List<Map<String, Object>>) (List<?>) list : List.of();
    }
    private static String stringValue(Object value) { return value == null ? "" : String.valueOf(value); }
    private static double numberValue(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        try { return Double.parseDouble(stringValue(value)); }
        catch (NumberFormatException ignored) { return 0; }
    }
    private static double round(double value) { return Math.round(value * 100.0) / 100.0; }
    private static String profileDescription(Map<String, Object> profile) {
        String bio = stringValue(profile.get("bio"));
        String portfolio = listOfMaps(profile.get("portfolioProjects")).stream()
            .map(item -> stringValue(item.get("description")))
            .filter(value -> !value.isBlank())
            .reduce("", (left, right) -> left.isBlank() ? right : left + "\n\n" + right);
        return bio.isBlank() ? portfolio : portfolio.isBlank() ? bio : bio + "\n\n" + portfolio;
    }
}
