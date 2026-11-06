package br.com.linkedincorporativo.project;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException exception) {
        return response(exception.getStatusCode(), message(exception.getReason(), exception.getStatusCode()));
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentNotValidException.class,
        MissingServletRequestParameterException.class,
        MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<Map<String, String>> handleInvalidRequest(Exception exception) {
        return response(HttpStatus.BAD_REQUEST, "Os dados enviados são inválidos. Revise os campos e tente novamente.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleLargeUpload(MaxUploadSizeExceededException exception) {
        return response(HttpStatus.PAYLOAD_TOO_LARGE, "O arquivo enviado é maior que o limite permitido.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleConflict(DataIntegrityViolationException exception) {
        return response(HttpStatus.CONFLICT, "Não foi possível salvar porque estes dados já estão em uso.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException exception) {
        return response(HttpStatus.METHOD_NOT_ALLOWED, "Esta operação não está disponível para o endereço informado.");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoResourceFoundException exception) {
        return response(HttpStatus.NOT_FOUND, "Não encontramos o conteúdo solicitado.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception exception) {
        LOGGER.error("Erro inesperado ao processar a requisição", exception);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Ocorreu um erro inesperado. Tente novamente em instantes.");
    }

    private static ResponseEntity<Map<String, String>> response(HttpStatusCode status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private static String message(String reason, HttpStatusCode status) {
        if (reason != null && !reason.isBlank()) return reason;
        return switch (status.value()) {
            case 400 -> "Revise os dados informados e tente novamente.";
            case 401 -> "Não foi possível autenticar. Confira suas credenciais ou entre novamente.";
            case 403 -> "Você não tem permissão para realizar esta ação.";
            case 404 -> "Não encontramos o conteúdo solicitado.";
            case 409 -> "Não foi possível concluir porque os dados já existem ou foram alterados.";
            case 429 -> "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.";
            case 502, 503, 504 -> "Um serviço está temporariamente indisponível. Tente novamente em instantes.";
            default -> "Não foi possível concluir a solicitação.";
        };
    }
}
