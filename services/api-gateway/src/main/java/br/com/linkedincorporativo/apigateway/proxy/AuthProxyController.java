package br.com.linkedincorporativo.apigateway.proxy;

import static org.springframework.web.bind.annotation.RequestMethod.DELETE;
import static org.springframework.web.bind.annotation.RequestMethod.GET;
import static org.springframework.web.bind.annotation.RequestMethod.POST;
import static org.springframework.web.bind.annotation.RequestMethod.PUT;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthProxyController {

    private final ProxyService proxyService;
    private final String profileServiceUrl;

    public AuthProxyController(ProxyService proxyService, @Value("${services.profile-url}") String profileServiceUrl) {
        this.proxyService = proxyService;
        this.profileServiceUrl = profileServiceUrl;
    }

    @RequestMapping(value = "/**", method = { GET, POST, PUT, DELETE })
    public ResponseEntity<byte[]> proxy(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        try {
            return proxyService.forward(request, body, profileServiceUrl);
        } catch (RuntimeException exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
