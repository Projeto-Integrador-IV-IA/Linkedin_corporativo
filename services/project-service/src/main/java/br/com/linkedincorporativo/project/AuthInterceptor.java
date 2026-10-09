package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.UserAccount;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final AuthService auth;

    public AuthInterceptor(AuthService auth) { this.auth = auth; }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/") || path.startsWith("/actuator/") || "match-orchestrator".equals(request.getHeader("X-Internal-Request"))) {
            return true;
        }
        UserAccount user = auth.authenticate(request.getHeader("Authorization"));
        request.setAttribute("currentUser", user);
        return true;
    }
}
