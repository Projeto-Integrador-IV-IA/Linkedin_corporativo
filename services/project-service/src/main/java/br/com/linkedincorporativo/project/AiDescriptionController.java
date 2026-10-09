package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.AiDescriptionSession;
import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.AiDescriptionSessionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ai/descriptions/sessions")
public class AiDescriptionController {
    private static final Set<String> CONTEXTS = Set.of("VACANCY", "PROFILE", "PORTFOLIO");
    private static final int MAX_VERSIONS = 3;
    private final AiDescriptionSessionRepository sessions;
    private final LlmProviderClient llm;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Duration cooldown;

    public AiDescriptionController(AiDescriptionSessionRepository sessions, LlmProviderClient llm,
                                   @Value("${llm.cooldown-hours:24}") long cooldownHours) {
        this.sessions = sessions;
        this.llm = llm;
        this.cooldown = Duration.ofHours(Math.max(1, cooldownHours));
    }

    @PostMapping
    public ResponseEntity<?> start(@RequestBody StartRequest request,
                                   @RequestAttribute("currentUser") UserAccount currentUser) throws JsonProcessingException {
        String contextType = normalizeContext(request.contextType());
        authorizeContext(contextType, currentUser);
        String text = validateText(request.text());
        Instant now = Instant.now();
        List<String> cooldownContexts = "VACANCY".equals(contextType)
            ? List.of("VACANCY")
            : List.of("PROFILE", "PORTFOLIO");
        var blocked = sessions.findFirstByUserIdAndContextTypeInAndCooldownUntilAfterOrderByCreatedAtDesc(
            currentUser.getId(), cooldownContexts, now
        );
        if (blocked.isPresent()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "message", "Você já iniciou uma assistência de IA nesta janela de 24 horas.",
                "availableAt", blocked.get().getCooldownUntil().toString()
            ));
        }
        List<String> questions = llm.questions(currentUser.getId(), contextType, text, 0, 5);
        AiDescriptionSession session = new AiDescriptionSession();
        session.setUserId(currentUser.getId());
        session.setContextType(contextType);
        session.setStatus("QUESTIONS");
        session.setVersionCount(0);
        session.setCurrentText(text);
        session.setQuestionsJson(mapper.writeValueAsString(questions));
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        session.setCooldownUntil(now.plus(cooldown));
        return ResponseEntity.status(HttpStatus.CREATED).body(view(sessions.save(session), questions));
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<?> generate(@PathVariable Long id, @RequestBody GenerateRequest request,
                                      @RequestAttribute("currentUser") UserAccount currentUser) {
        AiDescriptionSession session = owned(id, currentUser);
        if (session.getVersionCount() >= MAX_VERSIONS) return limitReached(session);
        String base = request.text() == null || request.text().isBlank() ? session.getCurrentText() : validateText(request.text());
        List<String> answers = request.answers() == null ? List.of() : request.answers().stream()
            .map(AiDescriptionController::validateAnswer).filter(answer -> !answer.isBlank()).limit(5).toList();
        String rewritten = llm.rewrite(currentUser.getId(), session.getContextType(), base, answers, session.getVersionCount() + 1);
        session.setCurrentText(rewritten);
        session.setVersionCount(session.getVersionCount() + 1);
        session.setStatus("REVIEW");
        session.setUpdatedAt(Instant.now());
        sessions.save(session);
        return ResponseEntity.ok(view(session, List.of()));
    }

    @PostMapping("/{id}/continue")
    public ResponseEntity<?> continueWithAi(@PathVariable Long id, @RequestBody ContinueRequest request,
                                            @RequestAttribute("currentUser") UserAccount currentUser) throws JsonProcessingException {
        AiDescriptionSession session = owned(id, currentUser);
        if (session.getVersionCount() >= MAX_VERSIONS) return limitReached(session);
        String base = request.text() == null || request.text().isBlank() ? session.getCurrentText() : validateText(request.text());
        int questionLimit = session.getVersionCount() == 1 ? 3 : 2;
        List<String> questions = llm.questions(currentUser.getId(), session.getContextType(), base, session.getVersionCount(), questionLimit);
        session.setCurrentText(base);
        session.setQuestionsJson(mapper.writeValueAsString(questions));
        session.setStatus("QUESTIONS");
        session.setUpdatedAt(Instant.now());
        sessions.save(session);
        return ResponseEntity.ok(view(session, questions));
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<?> finish(@PathVariable Long id, @RequestBody FinishRequest request,
                                    @RequestAttribute("currentUser") UserAccount currentUser) {
        AiDescriptionSession session = owned(id, currentUser);
        String action = request.action() == null ? "" : request.action().trim().toUpperCase();
        if (!Set.of("ACCEPT", "EDIT").contains(action)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A ação deve ser ACCEPT ou EDIT.");
        String text = request.text() == null || request.text().isBlank() ? session.getCurrentText() : validateText(request.text());
        session.setCurrentText(text);
        session.setStatus("COMPLETED");
        session.setUpdatedAt(Instant.now());
        sessions.save(session);
        return ResponseEntity.ok(view(session, List.of()));
    }

    private AiDescriptionSession owned(Long id, UserAccount user) {
        AiDescriptionSession session = sessions.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sessão de IA não encontrada."));
        if (!session.getUserId().equals(user.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta sessão pertence a outro usuário.");
        return session;
    }

    private ResponseEntity<?> limitReached(AiDescriptionSession session) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "message", "O limite de três reformulações foi atingido. Edite ou aceite o texto atual.",
            "availableAt", session.getCooldownUntil().toString(),
            "versionCount", session.getVersionCount()
        ));
    }

    private Map<String, Object> view(AiDescriptionSession session, List<String> questions) {
        return Map.of(
            "sessionId", session.getId(),
            "contextType", session.getContextType(),
            "status", session.getStatus(),
            "versionCount", session.getVersionCount(),
            "maxVersions", MAX_VERSIONS,
            "text", session.getCurrentText(),
            "questions", questions,
            "canContinue", session.getVersionCount() < MAX_VERSIONS,
            "availableAt", session.getCooldownUntil().toString()
        );
    }

    private static String normalizeContext(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        if (!CONTEXTS.contains(normalized)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contextType deve ser VACANCY, PROFILE ou PORTFOLIO.");
        return normalized;
    }

    private static void authorizeContext(String contextType, UserAccount user) {
        String role = user.getRole() == null ? "" : user.getRole().toUpperCase();
        boolean recruiterContext = "VACANCY".equals(contextType);
        boolean allowed = !recruiterContext || Set.of("RECRUITER", "MANAGER").contains(role);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Somente recrutadores podem usar a IA de vagas.");
        }
    }

    private static String validateText(String value) {
        String text = value == null ? "" : value.trim();
        if (text.length() < 20) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escreva ao menos 20 caracteres antes de pedir ajuda à IA.");
        if (text.length() > 8_000) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "A descrição deve ter no máximo 8.000 caracteres.");
        return text;
    }

    private static String validateAnswer(String value) {
        String answer = value == null ? "" : value.trim();
        if (answer.length() > 2_000) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Cada resposta deve ter no máximo 2.000 caracteres.");
        return answer;
    }

    public record StartRequest(String contextType, String text) {}
    public record GenerateRequest(String text, List<String> answers) {}
    public record ContinueRequest(String text) {}
    public record FinishRequest(String action, String text) {}
}
