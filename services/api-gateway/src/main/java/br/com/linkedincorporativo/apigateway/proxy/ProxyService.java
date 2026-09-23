package br.com.linkedincorporativo.apigateway.proxy;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class ProxyService {

    private static final Set<String> HOP_BY_HOP_HEADERS = Set.of(
            "host", "content-length", "connection", "transfer-encoding");

    private final RestClient restClient = RestClient.create();

    public ResponseEntity<byte[]> forward(HttpServletRequest request, byte[] body, String targetBaseUrl) {
        String path = request.getRequestURI();
        String query = request.getQueryString();
        String targetUrl = targetBaseUrl + path + (query != null ? "?" + query : "");

        HttpHeaders headers = new HttpHeaders();
        List<String> headerNames = java.util.Collections.list(request.getHeaderNames());
        for (String headerName : headerNames) {
            if (!HOP_BY_HOP_HEADERS.contains(headerName.toLowerCase(Locale.ROOT))) {
                headers.addAll(headerName, java.util.Collections.list(request.getHeaders(headerName)));
            }
        }

        return restClient.method(HttpMethod.valueOf(request.getMethod()))
                .uri(targetUrl)
                .headers(httpHeaders -> httpHeaders.addAll(headers))
                .body(body != null ? body : new byte[0])
                .exchange((clientRequest, clientResponse) -> ResponseEntity
                        .status(clientResponse.getStatusCode())
                        .headers(clientResponse.getHeaders())
                        .body(clientResponse.bodyTo(byte[].class)));
    }
}
