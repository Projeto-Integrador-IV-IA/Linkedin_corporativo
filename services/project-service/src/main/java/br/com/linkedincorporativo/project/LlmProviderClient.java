package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.LlmUsageRecord;
import br.com.linkedincorporativo.project.repository.LlmUsageRecordRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LlmProviderClient {
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final LlmUsageRecordRepository usageRecords;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String geminiBaseUrl;
    private final String nvidiaBaseUrl;

    public LlmProviderClient(
        LlmUsageRecordRepository usageRecords,
        @Value("${llm.provider:gemini}") String provider,
        @Value("${llm.api-key:}") String apiKey,
        @Value("${llm.model:gemini-3.5-flash-lite}") String model,
        @Value("${llm.gemini-base-url:https://generativelanguage.googleapis.com/v1beta}") String geminiBaseUrl,
        @Value("${llm.nvidia-base-url:https://integrate.api.nvidia.com/v1}") String nvidiaBaseUrl
    ) {
        this.usageRecords = usageRecords;
        this.provider = provider.trim().toLowerCase();
        this.apiKey = apiKey.trim();
        this.model = model.trim();
        this.geminiBaseUrl = stripTrailingSlash(geminiBaseUrl);
        this.nvidiaBaseUrl = stripTrailingSlash(nvidiaBaseUrl);
    }

    public List<String> questions(Long userId, String contextType, String description, int versionCount, int maximum) {
        String prompt = """
            Você é um assistente de redação profissional em português do Brasil.
            Analise a descrição abaixo para o contexto %s. Faça no máximo %d perguntas curtas e objetivas,
            somente sobre informações realmente ausentes. Esta é a rodada após %d reformulação(ões), então não repita
            perguntas já respondidas. Responda APENAS JSON válido no formato {\"questions\":[\"...\"]}.

            DESCRIÇÃO:
            %s
            """.formatted(contextLabel(contextType), maximum, versionCount, description);

        Supplier<ProviderResponse> request = "mock".equals(provider)
            ? () -> mockResponse(prompt, mapper.valueToTree(Map.of("questions", mockQuestions(contextType, maximum))).toString())
            : () -> request(prompt, true, maximum);

        return tracked(userId, contextType, "QUESTIONS", request, response -> {
            Map<String, Object> parsed = parseJson(response.text());
            Object value = parsed.get("questions");
            if (!(value instanceof List<?> list)) throw invalidProviderResponse();
            return list.stream().map(String::valueOf).map(String::trim).filter(item -> !item.isBlank())
                .map(item -> item.length() > 300 ? item.substring(0, 300) : item).limit(maximum).toList();
        });
    }

    public String rewrite(Long userId, String contextType, String description, List<String> answers, int nextVersion) {
        String prompt = """
            Você é um assistente de redação profissional em português do Brasil.
            Reescreva a descrição do contexto %s de forma clara, objetiva, inclusiva e fiel aos fatos informados.
            Não invente tecnologias, resultados, experiência, salário ou responsabilidades. Organize em parágrafos curtos,
            preserve detalhes relevantes e entregue somente o texto final. Esta é a versão %d de no máximo 3.

            TEXTO ATUAL:
            %s

            RESPOSTAS COMPLEMENTARES:
            %s
            """.formatted(contextLabel(contextType), nextVersion, description, String.join("\n", answers));

        Supplier<ProviderResponse> request = "mock".equals(provider)
            ? () -> {
                String details = answers.stream().filter(answer -> answer != null && !answer.isBlank())
                    .reduce("", (left, right) -> left + " " + right.trim());
                return mockResponse(prompt, (description.trim() + details).trim());
            }
            : () -> request(prompt, false, 0);

        return tracked(userId, contextType, "REWRITE", request, response -> {
            String generated = response.text().trim();
            if (generated.isBlank()) throw invalidProviderResponse();
            return generated.length() > 12_000 ? generated.substring(0, 12_000) : generated;
        });
    }

    private ProviderResponse request(String prompt, boolean jsonOutput, int maximumItems) {
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Configure LLM_API_KEY para usar o assistente de IA.");
        }
        try {
            return switch (provider) {
                case "gemini" -> callGemini(prompt, jsonOutput, maximumItems);
                case "nvidia" -> callNvidia(prompt, jsonOutput);
                default -> throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "LLM_PROVIDER deve ser gemini, nvidia ou mock.");
            };
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O provedor de IA retornou uma resposta inválida.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "A chamada ao provedor de IA foi interrompida.");
        }
    }

    private ProviderResponse callGemini(String prompt, boolean jsonOutput, int maximumItems) throws IOException, InterruptedException {
        String url = geminiBaseUrl + "/models/" + encode(model) + ":generateContent?key=" + encode(apiKey);
        Map<String, Object> generationConfig = jsonOutput
            ? Map.of(
                "temperature", 0.2,
                "maxOutputTokens", 2048,
                "responseMimeType", "application/json",
                "responseJsonSchema", Map.of(
                    "type", "object",
                    "properties", Map.of("questions", Map.of(
                        "type", "array",
                        "items", Map.of("type", "string"),
                        "maxItems", maximumItems
                    )),
                    "required", List.of("questions"),
                    "additionalProperties", false
                )
            )
            : Map.of("temperature", 0.2, "maxOutputTokens", 2048);
        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
            "generationConfig", generationConfig
        );
        JsonNode json = send(url, body, null);
        JsonNode text = json.at("/candidates/0/content/parts/0/text");
        if (!text.isTextual()) throw invalidProviderResponse();
        JsonNode usage = json.path("usageMetadata");
        return new ProviderResponse(
            text.asText(),
            usage.path("promptTokenCount").asLong(0),
            usage.path("candidatesTokenCount").asLong(0),
            usage.path("cachedContentTokenCount").asLong(0),
            usage.path("thoughtsTokenCount").asLong(0),
            usage.path("totalTokenCount").asLong(0)
        );
    }

    private ProviderResponse callNvidia(String prompt, boolean jsonOutput) throws IOException, InterruptedException {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        body.put("temperature", 0.2);
        body.put("top_p", 0.9);
        body.put("max_tokens", 2048);
        body.put("stream", false);
        if (jsonOutput) body.put("response_format", Map.of("type", "json_object"));
        JsonNode json = send(nvidiaBaseUrl + "/chat/completions", body, "Bearer " + apiKey);
        JsonNode text = json.at("/choices/0/message/content");
        if (!text.isTextual()) throw invalidProviderResponse();
        JsonNode usage = json.path("usage");
        return new ProviderResponse(
            text.asText(),
            usage.path("prompt_tokens").asLong(0),
            usage.path("completion_tokens").asLong(0),
            usage.at("/prompt_tokens_details/cached_tokens").asLong(0),
            usage.at("/completion_tokens_details/reasoning_tokens").asLong(0),
            usage.path("total_tokens").asLong(0)
        );
    }

    private JsonNode send(String url, Map<String, Object> body, String authorization) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(45))
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body), StandardCharsets.UTF_8));
        if (authorization != null) builder.header("Authorization", authorization);
        HttpResponse<String> response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O provedor de IA está indisponível (HTTP " + response.statusCode() + ").");
        }
        return mapper.readTree(response.body());
    }

    private <T> T tracked(Long userId, String contextType, String requestType,
                          Supplier<ProviderResponse> request, Function<ProviderResponse, T> transform) {
        long startedAt = System.nanoTime();
        ProviderResponse response = ProviderResponse.empty();
        try {
            response = request.get();
            T result = transform.apply(response);
            saveUsage(userId, contextType, requestType, response, true, 200, startedAt);
            return result;
        } catch (RuntimeException exception) {
            int statusCode = exception instanceof ResponseStatusException statusException
                ? statusException.getStatusCode().value()
                : 500;
            saveUsage(userId, contextType, requestType, response, false, statusCode, startedAt);
            throw exception;
        }
    }

    private void saveUsage(Long userId, String contextType, String requestType, ProviderResponse response,
                           boolean successful, int statusCode, long startedAt) {
        try {
            long total = response.totalTokens() > 0
                ? response.totalTokens()
                : response.inputTokens() + response.outputTokens() + response.reasoningTokens();
            LlmUsageRecord record = new LlmUsageRecord();
            record.setUserId(userId);
            record.setContextType(contextType);
            record.setRequestType(requestType);
            record.setProvider(provider);
            record.setModel(model);
            record.setInputTokens(response.inputTokens());
            record.setOutputTokens(response.outputTokens());
            record.setCachedContextTokens(response.cachedContextTokens());
            record.setReasoningTokens(response.reasoningTokens());
            record.setTotalTokens(total);
            record.setLatencyMs(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt));
            record.setSuccessful(successful);
            record.setStatusCode(statusCode);
            record.setCreatedAt(Instant.now());
            usageRecords.save(record);
        } catch (RuntimeException ignored) {
            // Falhas de telemetria nunca devem impedir o uso do assistente.
        }
    }

    private ProviderResponse mockResponse(String prompt, String output) {
        long input = estimateTokens(prompt);
        long response = estimateTokens(output);
        return new ProviderResponse(output, input, response, 0, 0, input + response);
    }

    private static long estimateTokens(String value) {
        return Math.max(1, (long) Math.ceil((value == null ? 0 : value.length()) / 4.0));
    }

    private Map<String, Object> parseJson(String value) {
        String clean = value.trim();
        if (clean.startsWith("```")) {
            clean = clean.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
        }
        int objectStart = clean.indexOf('{');
        int objectEnd = clean.lastIndexOf('}');
        if (objectStart >= 0 && objectEnd > objectStart) clean = clean.substring(objectStart, objectEnd + 1);
        try {
            return mapper.readValue(clean, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw invalidProviderResponse();
        }
    }

    private static List<String> mockQuestions(String contextType, int maximum) {
        List<String> questions = switch (contextType) {
            case "VACANCY" -> List.of("Qual é o principal objetivo da vaga?", "Quais entregas são esperadas?", "Quais requisitos são indispensáveis?", "Como será a rotina ou modalidade de trabalho?", "Como o sucesso será avaliado?");
            case "PROFILE" -> List.of("Qual é sua especialidade principal?", "Que resultados profissionais você alcançou?", "Em quais tipos de problema você tem mais experiência?", "Que diferencial deseja destacar?", "Qual é seu objetivo profissional atual?");
            default -> List.of("Qual problema o projeto resolveu?", "Qual foi sua responsabilidade?", "Que resultado mensurável foi alcançado?", "Que decisões técnicas você tomou?", "Quem foi beneficiado pelo projeto?");
        };
        return questions.stream().limit(maximum).toList();
    }

    private static String contextLabel(String value) {
        return switch (value) {
            case "VACANCY" -> "vaga ou projeto do recrutador";
            case "PROFILE" -> "descrição geral do perfil profissional";
            case "PORTFOLIO" -> "projeto do portfólio profissional";
            default -> value;
        };
    }

    private static ResponseStatusException invalidProviderResponse() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O provedor de IA retornou uma resposta fora do formato esperado.");
    }

    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private static String stripTrailingSlash(String value) { return value.endsWith("/") ? value.substring(0, value.length() - 1) : value; }

    private record ProviderResponse(String text, long inputTokens, long outputTokens,
                                    long cachedContextTokens, long reasoningTokens, long totalTokens) {
        private static ProviderResponse empty() { return new ProviderResponse("", 0, 0, 0, 0, 0); }
    }
}
