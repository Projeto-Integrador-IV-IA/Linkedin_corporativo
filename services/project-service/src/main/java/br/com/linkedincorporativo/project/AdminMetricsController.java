package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.UserAccount;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/metrics")
public class AdminMetricsController {
    private final AdminMetricsService metrics;

    public AdminMetricsController(AdminMetricsService metrics) { this.metrics = metrics; }

    @GetMapping
    public AdminMetricsService.Dashboard dashboard(
        @RequestParam(defaultValue = "30") int days,
        @RequestAttribute("currentUser") UserAccount currentUser
    ) {
        if (!"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Somente administradores podem consultar as métricas de IA.");
        }
        return metrics.dashboard(days);
    }
}
