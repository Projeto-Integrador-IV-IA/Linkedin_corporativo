package br.com.linkedincorporativo.apigateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class ApiProxyController {
    private final RestClient client = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String profileUrl;
    private final String projectUrl;
    private final String matchUrl;

    public ApiProxyController(@Value("${services.profile-url}") String profileUrl, @Value("${services.project-url}") String projectUrl, @Value("${services.match-url}") String matchUrl) {
        this.profileUrl = profileUrl; this.projectUrl = projectUrl; this.matchUrl = matchUrl;
    }

    @PostMapping("/auth/register") public ResponseEntity<Object> register(@RequestBody Object body) { return post(projectUrl + "/api/auth/register", body, null); }
    @PostMapping("/auth/login") public ResponseEntity<Object> login(@RequestBody Object body) { return post(projectUrl + "/api/auth/login", body, null); }
    @PostMapping("/auth/password-reset/request") public ResponseEntity<Object> requestPasswordReset(@RequestBody Object body) { return post(projectUrl + "/api/auth/password-reset/request", body, null); }
    @PostMapping("/auth/password-reset/confirm") public ResponseEntity<Object> confirmPasswordReset(@RequestBody Object body) { return post(projectUrl + "/api/auth/password-reset/confirm", body, null); }
    @PostMapping("/auth/change-password") public ResponseEntity<Object> changePassword(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/auth/change-password", body, auth); }
    @GetMapping("/auth/me") public ResponseEntity<Object> me(@RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/auth/me", auth); }
    @PatchMapping("/auth/profile") public ResponseEntity<Object> linkProfile(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return patch(projectUrl + "/api/auth/profile", body, auth); }

    @PostMapping("/ai/descriptions/sessions") public ResponseEntity<Object> startAiDescription(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/ai/descriptions/sessions", body, auth); }
    @PostMapping("/ai/descriptions/sessions/{id}/generate") public ResponseEntity<Object> generateAiDescription(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/ai/descriptions/sessions/" + id + "/generate", body, auth); }
    @PostMapping("/ai/descriptions/sessions/{id}/continue") public ResponseEntity<Object> continueAiDescription(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/ai/descriptions/sessions/" + id + "/continue", body, auth); }
    @PostMapping("/ai/descriptions/sessions/{id}/finish") public ResponseEntity<Object> finishAiDescription(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/ai/descriptions/sessions/" + id + "/finish", body, auth); }

    @GetMapping("/admin/metrics") public ResponseEntity<Object> adminMetrics(@RequestParam(defaultValue = "30") int days, @RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/admin/metrics?days=" + days, auth); }

    @GetMapping("/feed/projects") public ResponseEntity<Object> projectFeed(@RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/feed/projects", auth); }
    @PostMapping("/feed/projects/{id}/interest") public ResponseEntity<Object> expressInterest(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return post(projectUrl + "/api/feed/projects/" + id + "/interest", Map.of(), auth); }
    @DeleteMapping("/feed/projects/{id}/interest") public ResponseEntity<Object> withdrawInterest(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(projectUrl + "/api/feed/projects/" + id + "/interest", auth); }

    @GetMapping("/profiles") public ResponseEntity<Object> profiles(@RequestHeader(value = "Authorization", required = false) String auth) { return get(profileUrl + "/api/profiles", auth); }
    @GetMapping("/profiles/{id}") public ResponseEntity<Object> profile(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return get(profileUrl + "/api/profiles/" + id, auth); }
    @PostMapping("/profiles") public ResponseEntity<Object> createProfile(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(profileUrl + "/api/profiles", body, auth); }
    @PutMapping("/profiles/{id}") public ResponseEntity<Object> updateProfile(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return put(profileUrl + "/api/profiles/" + id, body, auth); }
    @DeleteMapping("/profiles/{id}") public ResponseEntity<Object> deleteProfile(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(profileUrl + "/api/profiles/" + id, auth); }
    @PostMapping("/profiles/{id}/portfolio") public ResponseEntity<Object> addPortfolio(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(profileUrl + "/api/profiles/" + id + "/portfolio", body, auth); }
    @PutMapping("/profiles/{id}/portfolio/{portfolioId}") public ResponseEntity<Object> updatePortfolio(@PathVariable Long id, @PathVariable Long portfolioId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return put(profileUrl + "/api/profiles/" + id + "/portfolio/" + portfolioId, body, auth); }
    @DeleteMapping("/profiles/{id}/portfolio/{portfolioId}") public ResponseEntity<Object> removePortfolio(@PathVariable Long id, @PathVariable Long portfolioId, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(profileUrl + "/api/profiles/" + id + "/portfolio/" + portfolioId, auth); }

    @GetMapping("/projects") public ResponseEntity<Object> projects(@RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/projects", auth); }
    @GetMapping("/projects/{id}") public ResponseEntity<Object> project(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/projects/" + id, auth); }
    @PostMapping("/projects") public ResponseEntity<Object> createProject(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/projects", body, auth); }
    @PutMapping("/projects/{id}") public ResponseEntity<Object> updateProject(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return put(projectUrl + "/api/projects/" + id, body, auth); }
    @PatchMapping("/projects/{id}/status") public ResponseEntity<Object> projectStatus(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return patch(projectUrl + "/api/projects/" + id + "/status", body, auth); }
    @DeleteMapping("/projects/{id}") public ResponseEntity<Object> deleteProject(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(projectUrl + "/api/projects/" + id, auth); }
    @PostMapping("/projects/{id}/applications") public ResponseEntity<Object> apply(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/projects/" + id + "/applications", body, auth); }
    @PatchMapping("/projects/{id}/applications/{applicationId}/status") public ResponseEntity<Object> applicationStatus(@PathVariable Long id, @PathVariable Long applicationId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return patch(projectUrl + "/api/projects/" + id + "/applications/" + applicationId + "/status", body, auth); }
    @GetMapping("/projects/{id}/candidate-decisions") public ResponseEntity<Object> decisions(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/projects/" + id + "/candidate-decisions", auth); }
    @PostMapping("/projects/{id}/candidate-decisions/{profileId}") public ResponseEntity<Object> decision(@PathVariable Long id, @PathVariable Long profileId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/projects/" + id + "/candidate-decisions/" + profileId, body, auth); }

    @GetMapping("/chats") public ResponseEntity<Object> chats(@RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/chats", auth); }
    @PostMapping("/chats") public ResponseEntity<Object> createChat(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/chats", body, auth); }
    @GetMapping("/chats/{id}/messages") public ResponseEntity<Object> messages(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/chats/" + id + "/messages", auth); }
    @PostMapping("/chats/{id}/messages") public ResponseEntity<Object> sendMessage(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/chats/" + id + "/messages", body, auth); }
    @PostMapping(value = "/chats/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> sendMessageWithAttachment(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth,
                                                              @RequestPart(value = "content", required = false) String content,
                                                              @RequestPart(value = "file", required = false) MultipartFile file) {
        return postMultipart(projectUrl + "/api/chats/" + id + "/messages", content, file, auth);
    }
    @GetMapping("/chats/{id}/messages/{messageId}/attachment")
    public ResponseEntity<Object> attachment(@PathVariable Long id, @PathVariable Long messageId, @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            ResponseEntity<byte[]> response = client.get().uri(projectUrl + "/api/chats/" + id + "/messages/" + messageId + "/attachment")
                .headers(headers -> addAuth(headers, auth)).retrieve().toEntity(byte[].class);
            HttpHeaders headers = new HttpHeaders();
            if (response.getHeaders().getContentType() != null) headers.setContentType(response.getHeaders().getContentType());
            if (response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION) != null) headers.set(HttpHeaders.CONTENT_DISPOSITION, response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
            if (response.getHeaders().getContentLength() >= 0) headers.setContentLength(response.getHeaders().getContentLength());
            return new ResponseEntity<>(response.getBody(), headers, response.getStatusCode());
        } catch (RestClientResponseException exception) { return error(exception); }
    }
    @GetMapping("/chats/{id}/note") public ResponseEntity<Object> note(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/chats/" + id + "/note", auth); }
    @PutMapping("/chats/{id}/note") public ResponseEntity<Object> saveNote(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return put(projectUrl + "/api/chats/" + id + "/note", body, auth); }

    @GetMapping("/matches/projects/{id}")
    public ResponseEntity<Object> recommendations(
        @PathVariable Long id,
        @RequestParam(defaultValue = "0") double minScore,
        @RequestParam(defaultValue = "false") boolean interestedOnly,
        @RequestParam(defaultValue = "10") int limit,
        @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        ResponseEntity<Object> access = get(projectUrl + "/api/projects/" + id, auth);
        if (access.getStatusCode().isError()) return access;
        String filters = "?minScore=" + minScore + "&interestedOnly=" + interestedOnly + "&limit=" + limit;
        return get(matchUrl + "/api/matches/projects/" + id + filters, null);
    }

    private ResponseEntity<Object> get(String url, String auth) {
        try { return relay(client.get().uri(url).headers(headers -> addAuth(headers, auth)).retrieve().toEntity(Object.class)); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> post(String url, Object body, String auth) {
        try { return relay(client.post().uri(url).headers(headers -> addAuth(headers, auth)).body(body).retrieve().toEntity(Object.class)); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> postMultipart(String url, String content, MultipartFile file, String auth) {
        MultipartBodyBuilder form = new MultipartBodyBuilder();
        form.part("content", content == null ? "" : content);
        if (file != null && !file.isEmpty()) {
            var part = form.part("file", file.getResource()).filename(file.getOriginalFilename());
            if (file.getContentType() != null) part.contentType(MediaType.parseMediaType(file.getContentType()));
        }
        try { return relay(client.post().uri(url).headers(headers -> addAuth(headers, auth)).contentType(MediaType.MULTIPART_FORM_DATA).body(form.build()).retrieve().toEntity(Object.class)); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> put(String url, Object body, String auth) {
        try { return relay(client.put().uri(url).headers(headers -> addAuth(headers, auth)).body(body).retrieve().toEntity(Object.class)); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> patch(String url, Object body, String auth) {
        try { return relay(client.patch().uri(url).headers(headers -> addAuth(headers, auth)).body(body).retrieve().toEntity(Object.class)); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> delete(String url, String auth) {
        try { return relay(client.delete().uri(url).headers(headers -> addAuth(headers, auth)).retrieve().toEntity(Object.class)); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private static ResponseEntity<Object> relay(ResponseEntity<Object> upstream) {
        return ResponseEntity.status(upstream.getStatusCode()).body(upstream.getBody());
    }
    private static void addAuth(HttpHeaders headers, String auth) { if (auth != null && !auth.isBlank()) headers.set("Authorization", auth); }
    private ResponseEntity<Object> error(RestClientResponseException exception) {
        String message = upstreamMessage(exception.getResponseBodyAsString());
        if (message.isBlank()) message = statusMessage(exception.getStatusCode().value());
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", message));
    }
    private String upstreamMessage(String body) {
        if (body == null || body.isBlank()) return "";
        try {
            JsonNode response = objectMapper.readTree(body);
            String message = text(response.get("message"));
            if (!message.isBlank()) return message;
            String detail = text(response.get("detail"));
            if (!detail.isBlank() && !detail.startsWith("{") && !detail.startsWith("[")) return detail;
        } catch (Exception ignored) {
            String plain = body.trim();
            if (plain.length() <= 240 && !plain.startsWith("<") && !plain.startsWith("{")) return plain;
        }
        return "";
    }
    private static String text(JsonNode value) {
        return value != null && value.isTextual() ? value.asText().trim() : "";
    }
    private static String statusMessage(int status) {
        return switch (status) {
            case 400 -> "Revise os dados informados e tente novamente.";
            case 401 -> "Não foi possível autenticar. Confira suas credenciais ou entre novamente.";
            case 403 -> "Você não tem permissão para realizar esta ação.";
            case 404 -> "Não encontramos o conteúdo solicitado.";
            case 405 -> "Esta operação não está disponível.";
            case 409 -> "Não foi possível concluir porque os dados já existem ou foram alterados.";
            case 413 -> "O arquivo ou conteúdo enviado é maior que o permitido.";
            case 429 -> "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.";
            case 502, 503, 504 -> "Um serviço está temporariamente indisponível. Tente novamente em instantes.";
            default -> status >= 500
                ? "Ocorreu um erro inesperado. Tente novamente em instantes."
                : "Não foi possível concluir a solicitação.";
        };
    }
}
