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
@RequestMapping("/api/projects")
public class ProjectProxyController {

    private final ProxyService proxyService;
    private final String projectServiceUrl;

    public ProjectProxyController(ProxyService proxyService,
            @Value("${services.project-url}") String projectServiceUrl) {
        this.proxyService = proxyService;
        this.projectServiceUrl = projectServiceUrl;
    }

    @RequestMapping(value = { "", "/**" }, method = { GET, POST, PUT, DELETE })
    public ResponseEntity<byte[]> proxy(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        try {
            return proxyService.forward(request, body, projectServiceUrl);
        } catch (RuntimeException exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
