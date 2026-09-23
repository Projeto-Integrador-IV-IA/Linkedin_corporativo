package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.ChatMessage;
import br.com.linkedincorporativo.project.domain.Conversation;
import br.com.linkedincorporativo.project.domain.Project;
import br.com.linkedincorporativo.project.domain.RecruiterNote;
import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.ChatMessageRepository;
import br.com.linkedincorporativo.project.repository.ConversationRepository;
import br.com.linkedincorporativo.project.repository.ProjectRepository;
import br.com.linkedincorporativo.project.repository.RecruiterNoteRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    private final ConversationRepository conversations;
    private final ChatMessageRepository messages;
    private final RecruiterNoteRepository notes;
    private final ProjectRepository projects;

    public ChatController(ConversationRepository conversations, ChatMessageRepository messages, RecruiterNoteRepository notes, ProjectRepository projects) {
        this.conversations = conversations;
        this.messages = messages;
        this.notes = notes;
        this.projects = projects;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestAttribute("currentUser") UserAccount user) {
        Map<Long, Conversation> unique = new LinkedHashMap<>();
        conversations.findByRecruiterUserIdOrderByUpdatedAtDesc(user.getId()).forEach(item -> unique.put(item.getId(), item));
        if (user.getProfileId() != null) conversations.findByProfessionalProfileIdOrderByUpdatedAtDesc(user.getProfileId()).forEach(item -> unique.putIfAbsent(item.getId(), item));
        if (user.getEmail() != null) conversations.findByProfessionalEmailIgnoreCaseOrderByUpdatedAtDesc(user.getEmail()).forEach(item -> unique.putIfAbsent(item.getId(), item));
        return unique.values().stream().map(conversation -> conversationView(conversation, user)).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ChatRequest request, @RequestAttribute("currentUser") UserAccount user) {
        Project project = projects.findById(request.projectId()).orElse(null);
        if (project == null || !user.getId().equals(project.getOwnerUserId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você não pode abrir chat neste projeto."));
        Conversation conversation = conversations.findByProjectIdAndRecruiterUserIdAndProfessionalProfileId(request.projectId(), user.getId(), request.professionalProfileId())
            .orElseGet(() -> new Conversation(project.getId(), project.getTitle(), user.getId(), request.professionalProfileId(), request.professionalName(), request.professionalEmail()));
        return ResponseEntity.ok(conversationView(conversations.save(conversation), user));
    }

    @GetMapping("/{id}/messages")
    @Transactional
    public ResponseEntity<?> listMessages(@PathVariable Long id, @RequestAttribute("currentUser") UserAccount user) {
        Conversation conversation = participant(id, user);
        if (conversation == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você não participa desta conversa."));
        markRead(conversation, user);
        return ResponseEntity.ok(messages.findByConversationIdOrderByCreatedAtAsc(id).stream().map(this::messageView).toList());
    }

    @PostMapping("/{id}/messages")
    @Transactional
    public ResponseEntity<?> sendMessage(@PathVariable Long id, @RequestBody MessageRequest request, @RequestAttribute("currentUser") UserAccount user) {
        Conversation conversation = participant(id, user);
        if (conversation == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você não participa desta conversa."));
        if (request.content() == null || request.content().isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "A mensagem não pode ficar vazia."));
        Conversation savedConversation = conversations.save(conversation);
        ChatMessage savedMessage = messages.save(new ChatMessage(savedConversation, user.getId(), request.content().trim()));
        markRead(savedConversation, user);
        return ResponseEntity.ok(messageView(savedMessage));
    }

    @GetMapping("/{id}/note")
    public ResponseEntity<?> getNote(@PathVariable Long id, @RequestAttribute("currentUser") UserAccount user) {
        Conversation conversation = recruiterConversation(id, user);
        if (conversation == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Somente o recrutador pode ver esta nota."));
        return ResponseEntity.ok(notes.findByConversationIdAndRecruiterUserId(id, user.getId()).map(this::noteView).orElse(Map.of("content", "")));
    }

    @PutMapping("/{id}/note")
    public ResponseEntity<?> saveNote(@PathVariable Long id, @RequestBody NoteRequest request, @RequestAttribute("currentUser") UserAccount user) {
        Conversation conversation = recruiterConversation(id, user);
        if (conversation == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Somente o recrutador pode salvar esta nota."));
        RecruiterNote note = notes.findByConversationIdAndRecruiterUserId(id, user.getId()).orElseGet(() -> new RecruiterNote(id, user.getId(), ""));
        note.setContent(request.content() == null ? "" : request.content());
        return ResponseEntity.ok(noteView(notes.save(note)));
    }

    private Conversation participant(Long id, UserAccount user) {
        return conversations.findById(id).filter(conversation -> isParticipant(conversation, user)).orElse(null);
    }

    private Conversation recruiterConversation(Long id, UserAccount user) {
        return conversations.findById(id).filter(conversation -> user.getId().equals(conversation.getRecruiterUserId())).orElse(null);
    }

    private boolean isParticipant(Conversation conversation, UserAccount user) {
        return user.getId().equals(conversation.getRecruiterUserId()) || isProfessional(conversation, user);
    }

    private boolean isProfessional(Conversation conversation, UserAccount user) {
        return (user.getProfileId() != null && user.getProfileId().equals(conversation.getProfessionalProfileId()))
            || (user.getEmail() != null && conversation.getProfessionalEmail() != null && user.getEmail().equalsIgnoreCase(conversation.getProfessionalEmail()));
    }

    private void markRead(Conversation conversation, UserAccount user) {
        Instant now = Instant.now();
        if (user.getId().equals(conversation.getRecruiterUserId())) conversation.setRecruiterReadAt(now);
        else if (isProfessional(conversation, user)) conversation.setProfessionalReadAt(now);
        conversations.save(conversation);
    }

    private Map<String, Object> conversationView(Conversation conversation, UserAccount user) {
        Instant readAt = user.getId().equals(conversation.getRecruiterUserId()) ? conversation.getRecruiterReadAt() : conversation.getProfessionalReadAt();
        long unreadCount = messages.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
            .filter(message -> !user.getId().equals(message.getSenderUserId()))
            .filter(message -> readAt == null || message.getCreatedAt().isAfter(readAt))
            .count();
        return Map.of("id", conversation.getId(), "projectId", conversation.getProjectId(), "projectTitle", conversation.getProjectTitle(),
            "recruiterUserId", conversation.getRecruiterUserId(), "professionalProfileId", conversation.getProfessionalProfileId(),
            "professionalName", conversation.getProfessionalName() == null ? "Profissional" : conversation.getProfessionalName(),
            "professionalEmail", conversation.getProfessionalEmail() == null ? "" : conversation.getProfessionalEmail(),
            "updatedAt", conversation.getUpdatedAt().toString(), "unreadCount", unreadCount);
    }

    private Map<String, Object> messageView(ChatMessage message) {
        return Map.of("id", message.getId(), "conversationId", message.getConversation().getId(), "senderUserId", message.getSenderUserId(),
            "content", message.getContent(), "createdAt", message.getCreatedAt().toString());
    }

    private Map<String, Object> noteView(RecruiterNote note) {
        return Map.of("id", note.getId(), "conversationId", note.getConversationId(), "content", note.getContent() == null ? "" : note.getContent(),
            "updatedAt", note.getUpdatedAt().toString());
    }

    public record ChatRequest(Long projectId, Long professionalProfileId, String professionalName, String professionalEmail) {}
    public record MessageRequest(String content) {}
    public record NoteRequest(String content) {}
}
