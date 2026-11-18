package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.AiDescriptionSession;
import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.AiDescriptionSessionRepository;
import br.com.linkedincorporativo.project.repository.UserAccountRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/llm-limits")
public class AdminLlmLimitController {
    private static final Duration WINDOW = Duration.ofHours(24);
    private final UserAccountRepository users;
    private final AiDescriptionSessionRepository sessions;

    public AdminLlmLimitController(UserAccountRepository users, AiDescriptionSessionRepository sessions) {
        this.users = users;
        this.sessions = sessions;
    }

    @GetMapping
    public List<AccountLimit> list(@RequestAttribute("currentUser") UserAccount currentUser) {
        requireAdmin(currentUser);
        Instant now = Instant.now();
        return users.findAll(Sort.by("email")).stream()
            .filter(user -> !"ADMIN".equalsIgnoreCase(user.getRole()))
            .map(user -> view(user, now))
            .toList();
    }

    @PatchMapping("/{id}")
    @Transactional
    public AccountLimit update(@PathVariable Long id, @RequestBody LimitRequest request,
                               @RequestAttribute("currentUser") UserAccount currentUser) {
        requireAdmin(currentUser);
        Integer limit = request == null ? null : request.sessionsPer24Hours();
        if (limit != null && (limit < 0 || limit > 100)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Defina um limite entre 0 e 100 sessões por 24 horas.");
        }
        UserAccount user = users.findByIdForUpdate(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta não encontrada."));
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A conta administrativa não usa o assistente de IA.");
        }
        user.setLlmSessionsPer24Hours(limit);
        return view(users.save(user), Instant.now());
    }

    private AccountLimit view(UserAccount user, Instant now) {
        List<AiDescriptionSession> recent = sessions.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(
            user.getId(), now.minus(WINDOW)
        );
        Instant nextAvailableAt = recent.isEmpty() ? null : recent.get(0).getCreatedAt().plus(WINDOW);
        return new AccountLimit(user.getId(), user.getEmail(), user.getDisplayName(),
            user.getLlmSessionsPer24Hours(), recent.size(), nextAvailableAt);
    }

    private static void requireAdmin(UserAccount user) {
        if (user == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Somente administradores podem alterar limites de IA.");
        }
    }

    public record LimitRequest(Integer sessionsPer24Hours) {}
    public record AccountLimit(Long id, String email, String displayName, Integer sessionsPer24Hours,
                               int usedLast24Hours, Instant nextAvailableAt) {}
}
