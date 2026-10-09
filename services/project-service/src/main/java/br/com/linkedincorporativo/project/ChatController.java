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
import br.com.linkedincorporativo.project.repository.UserAccountRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    private static final long MAX_ATTACHMENT_SIZE = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "application/pdf", "text/plain", "text/csv", "application/zip",
        "image/png", "image/jpeg", "image/webp",
        "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/aac", "audio/flac",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private final ConversationRepository conversations;
    private final ChatMessageRepository messages;
    private final RecruiterNoteRepository notes;
    private final ProjectRepository projects;
    private final UserAccountRepository users;
    private final Path uploadDirectory;

    public ChatController(ConversationRepository conversations, ChatMessageRepository messages, RecruiterNoteRepository notes, ProjectRepository projects, UserAccountRepository users,
                          @Value("${chat.upload-dir:/app/uploads}") String uploadDir) {
        this.conversations = conversations;
        this.messages = messages;
        this.notes = notes;
        this.projects = projects;
        this.users = users;
        this.uploadDirectory = Path.of(uploadDir).toAbsolutePath().normalize();
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
        return saveMessage(id, request == null ? null : request.content(), null, user);
    }

    @PostMapping(value = "/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> sendMessageWithAttachment(@PathVariable Long id,
                                                       @RequestPart(value = "content", required = false) String content,
                                                       @RequestPart(value = "file", required = false) MultipartFile file,
                                                       @RequestAttribute("currentUser") UserAccount user) {
        return saveMessage(id, content, file, user);
    }

    private ResponseEntity<?> saveMessage(Long id, String content, MultipartFile file, UserAccount user) {
        Conversation conversation = participant(id, user);
        if (conversation == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você não participa desta conversa."));
        boolean hasFile = file != null && !file.isEmpty();
        if ((content == null || content.isBlank()) && !hasFile) return ResponseEntity.badRequest().body(Map.of("message", "Digite uma mensagem ou selecione um arquivo."));
        if (hasFile && file.getSize() > MAX_ATTACHMENT_SIZE) return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of("message", "O arquivo deve ter no máximo 5 MB."));
        String storedPath = null;
        try {
            if (hasFile) storedPath = storeAttachment(file);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Não foi possível armazenar o arquivo."));
        }
        Conversation savedConversation = conversations.save(conversation);
        ChatMessage savedMessage = new ChatMessage(savedConversation, user.getId(), content == null ? "" : content.trim());
        if (hasFile) savedMessage.setAttachment(safeFileName(file.getOriginalFilename()), normalizedContentType(file.getContentType()), file.getSize(), storedPath);
        savedMessage = messages.save(savedMessage);
        markRead(savedConversation, user);
        return ResponseEntity.ok(messageView(savedMessage));
    }

    @GetMapping("/{id}/messages/{messageId}/attachment")
    public ResponseEntity<?> downloadAttachment(@PathVariable Long id, @PathVariable Long messageId, @RequestAttribute("currentUser") UserAccount user) {
        Conversation conversation = participant(id, user);
        if (conversation == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você não participa desta conversa."));
        ChatMessage message = messages.findById(messageId).filter(item -> item.getConversation().getId().equals(id)).orElse(null);
        if (message == null || message.getAttachmentPath() == null) return ResponseEntity.notFound().build();
        Path file = uploadDirectory.resolve(message.getAttachmentPath()).normalize();
        if (!file.startsWith(uploadDirectory) || !Files.isRegularFile(file)) return ResponseEntity.notFound().build();
        Resource resource = new FileSystemResource(file);
        try {
            MediaType mediaType = MediaType.parseMediaType(message.getAttachmentContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : message.getAttachmentContentType());
            return ResponseEntity.ok().contentType(mediaType).header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName(message.getAttachmentName()) + "\"").contentLength(Files.size(file)).body(resource);
        } catch (IOException | IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Não foi possível ler o arquivo."));
        }
    }

    private String storeAttachment(MultipartFile file) throws IOException {
        String contentType = normalizedContentType(file.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) throw new IllegalArgumentException("Tipo de arquivo não permitido.");
        Files.createDirectories(uploadDirectory);
        String extension = extension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + extension;
        Path target = uploadDirectory.resolve(storedName).normalize();
        if (!target.startsWith(uploadDirectory)) throw new IllegalArgumentException("Nome de arquivo inválido.");
        file.transferTo(target);
        return storedName;
    }

    private static String normalizedContentType(String contentType) {
        return contentType == null ? "application/octet-stream" : contentType.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
    }

    private static String extension(String name) {
        String safe = safeFileName(name);
        int dot = safe.lastIndexOf('.');
        return dot >= 0 ? safe.substring(dot).toLowerCase(Locale.ROOT) : "";
    }

    private static String safeFileName(String name) {
        String safe = name == null ? "arquivo" : Path.of(name).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
        return safe.isBlank() ? "arquivo" : safe;
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
        UserAccount recruiter = users.findById(conversation.getRecruiterUserId()).orElse(null);
        String recruiterName = recruiter == null || recruiter.getDisplayName() == null || recruiter.getDisplayName().isBlank() ? "Recrutador" : recruiter.getDisplayName();
        String recruiterProfileId = recruiter == null || recruiter.getProfileId() == null ? "" : recruiter.getProfileId().toString();
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", conversation.getId());
        view.put("projectId", conversation.getProjectId());
        view.put("projectTitle", conversation.getProjectTitle());
        view.put("recruiterUserId", conversation.getRecruiterUserId());
        view.put("recruiterName", recruiterName);
        view.put("recruiterProfileId", recruiterProfileId);
        view.put("professionalProfileId", conversation.getProfessionalProfileId());
        view.put("professionalName", conversation.getProfessionalName() == null ? "Profissional" : conversation.getProfessionalName());
        view.put("professionalEmail", conversation.getProfessionalEmail() == null ? "" : conversation.getProfessionalEmail());
        view.put("updatedAt", conversation.getUpdatedAt().toString());
        view.put("unreadCount", unreadCount);
        return view;
    }

    private Map<String, Object> messageView(ChatMessage message) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", message.getId());
        view.put("conversationId", message.getConversation().getId());
        view.put("senderUserId", message.getSenderUserId());
        view.put("content", message.getContent() == null ? "" : message.getContent());
        view.put("createdAt", message.getCreatedAt().toString());
        if (message.getAttachmentName() != null) {
            view.put("attachment", Map.of("name", message.getAttachmentName(), "contentType", message.getAttachmentContentType(), "size", message.getAttachmentSize()));
        }
        return view;
    }

    private Map<String, Object> noteView(RecruiterNote note) {
        return Map.of("id", note.getId(), "conversationId", note.getConversationId(), "content", note.getContent() == null ? "" : note.getContent(),
            "updatedAt", note.getUpdatedAt().toString());
    }

    public record ChatRequest(Long projectId, Long professionalProfileId, String professionalName, String professionalEmail) {}
    public record MessageRequest(String content) {}
    public record NoteRequest(String content) {}
}
