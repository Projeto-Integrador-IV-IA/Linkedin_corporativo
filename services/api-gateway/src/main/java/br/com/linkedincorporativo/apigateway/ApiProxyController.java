package br.com.linkedincorporativo.apigateway;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiProxyController {
    private final RestClient client = RestClient.create();
    private final String profileUrl;
    private final String projectUrl;
    private final String matchUrl;

    public ApiProxyController(@Value("${services.profile-url}") String profileUrl, @Value("${services.project-url}") String projectUrl, @Value("${services.match-url}") String matchUrl) {
        this.profileUrl = profileUrl; this.projectUrl = projectUrl; this.matchUrl = matchUrl;
    }

    @PostMapping("/auth/register") public ResponseEntity<Object> register(@RequestBody Object body) { return post(projectUrl + "/api/auth/register", body, null); }
    @PostMapping("/auth/login") public ResponseEntity<Object> login(@RequestBody Object body) { return post(projectUrl + "/api/auth/login", body, null); }
    @GetMapping("/auth/me") public ResponseEntity<Object> me(@RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/auth/me", auth); }
    @PatchMapping("/auth/profile") public ResponseEntity<Object> linkProfile(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return patch(projectUrl + "/api/auth/profile", body, auth); }

    @GetMapping("/profiles") public ResponseEntity<Object> profiles(@RequestHeader(value = "Authorization", required = false) String auth) { return get(profileUrl + "/api/profiles", auth); }
    @GetMapping("/profiles/{id}") public ResponseEntity<Object> profile(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return get(profileUrl + "/api/profiles/" + id, auth); }
    @PostMapping("/profiles") public ResponseEntity<Object> createProfile(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(profileUrl + "/api/profiles", body, auth); }
    @PutMapping("/profiles/{id}") public ResponseEntity<Object> updateProfile(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return put(profileUrl + "/api/profiles/" + id, body, auth); }
    @DeleteMapping("/profiles/{id}") public ResponseEntity<Object> deleteProfile(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(profileUrl + "/api/profiles/" + id, auth); }
    @GetMapping("/skills") public ResponseEntity<Object> skills(@RequestHeader(value = "Authorization", required = false) String auth) { return get(profileUrl + "/api/skills", auth); }
    @PostMapping("/skills") public ResponseEntity<Object> createSkill(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(profileUrl + "/api/skills", body, auth); }
    @DeleteMapping("/skills/{id}") public ResponseEntity<Object> deleteSkill(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(profileUrl + "/api/skills/" + id, auth); }
    @PostMapping("/profiles/{id}/skills") public ResponseEntity<Object> addSkill(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(profileUrl + "/api/profiles/" + id + "/skills", body, auth); }
    @DeleteMapping("/profiles/{id}/skills/{skillId}") public ResponseEntity<Object> removeSkill(@PathVariable Long id, @PathVariable Long skillId, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(profileUrl + "/api/profiles/" + id + "/skills/" + skillId, auth); }
    @PostMapping("/profiles/{id}/portfolio") public ResponseEntity<Object> addPortfolio(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(profileUrl + "/api/profiles/" + id + "/portfolio", body, auth); }
    @PutMapping("/profiles/{id}/portfolio/{portfolioId}") public ResponseEntity<Object> updatePortfolio(@PathVariable Long id, @PathVariable Long portfolioId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return put(profileUrl + "/api/profiles/" + id + "/portfolio/" + portfolioId, body, auth); }
    @DeleteMapping("/profiles/{id}/portfolio/{portfolioId}") public ResponseEntity<Object> removePortfolio(@PathVariable Long id, @PathVariable Long portfolioId, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(profileUrl + "/api/profiles/" + id + "/portfolio/" + portfolioId, auth); }

    @GetMapping("/projects") public ResponseEntity<Object> projects(@RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/projects", auth); }
    @GetMapping("/projects/{id}") public ResponseEntity<Object> project(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return get(projectUrl + "/api/projects/" + id, auth); }
    @PostMapping("/projects") public ResponseEntity<Object> createProject(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/projects", body, auth); }
    @PutMapping("/projects/{id}") public ResponseEntity<Object> updateProject(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return put(projectUrl + "/api/projects/" + id, body, auth); }
    @PatchMapping("/projects/{id}/status") public ResponseEntity<Object> projectStatus(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return patch(projectUrl + "/api/projects/" + id + "/status", body, auth); }
    @DeleteMapping("/projects/{id}") public ResponseEntity<Object> deleteProject(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(projectUrl + "/api/projects/" + id, auth); }
    @PostMapping("/projects/{id}/required-skills") public ResponseEntity<Object> addRequiredSkill(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Object body) { return post(projectUrl + "/api/projects/" + id + "/required-skills", body, auth); }
    @DeleteMapping("/projects/{id}/required-skills/{skillId}") public ResponseEntity<Object> removeRequiredSkill(@PathVariable Long id, @PathVariable Long skillId, @RequestHeader(value = "Authorization", required = false) String auth) { return delete(projectUrl + "/api/projects/" + id + "/required-skills/" + skillId, auth); }
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
    public ResponseEntity<Object> recommendations(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) {
        ResponseEntity<Object> access = get(projectUrl + "/api/projects/" + id, auth);
        if (access.getStatusCode().isError()) return access;
        return get(matchUrl + "/api/matches/projects/" + id, null);
    }

    private ResponseEntity<Object> get(String url, String auth) {
        try { return client.get().uri(url).headers(headers -> addAuth(headers, auth)).retrieve().toEntity(Object.class); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> post(String url, Object body, String auth) {
        try { return client.post().uri(url).headers(headers -> addAuth(headers, auth)).body(body).retrieve().toEntity(Object.class); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> postMultipart(String url, String content, MultipartFile file, String auth) {
        MultipartBodyBuilder form = new MultipartBodyBuilder();
        form.part("content", content == null ? "" : content);
        if (file != null && !file.isEmpty()) {
            var part = form.part("file", file.getResource()).filename(file.getOriginalFilename());
            if (file.getContentType() != null) part.contentType(MediaType.parseMediaType(file.getContentType()));
        }
        try { return client.post().uri(url).headers(headers -> addAuth(headers, auth)).contentType(MediaType.MULTIPART_FORM_DATA).body(form.build()).retrieve().toEntity(Object.class); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> put(String url, Object body, String auth) {
        try { return client.put().uri(url).headers(headers -> addAuth(headers, auth)).body(body).retrieve().toEntity(Object.class); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> patch(String url, Object body, String auth) {
        try { return client.patch().uri(url).headers(headers -> addAuth(headers, auth)).body(body).retrieve().toEntity(Object.class); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private ResponseEntity<Object> delete(String url, String auth) {
        try { return client.delete().uri(url).headers(headers -> addAuth(headers, auth)).retrieve().toEntity(Object.class); }
        catch (RestClientResponseException exception) { return error(exception); }
    }
    private static void addAuth(HttpHeaders headers, String auth) { if (auth != null && !auth.isBlank()) headers.set("Authorization", auth); }
    private ResponseEntity<Object> error(RestClientResponseException exception) { return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", exception.getResponseBodyAsString())); }
}
