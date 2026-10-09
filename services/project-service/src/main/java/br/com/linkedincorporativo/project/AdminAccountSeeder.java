package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountSeeder implements CommandLineRunner {
    private final UserAccountRepository users;
    private final String email;
    private final String password;
    private final String displayName;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AdminAccountSeeder(
        UserAccountRepository users,
        @Value("${admin.email:}") String email,
        @Value("${admin.password:}") String password,
        @Value("${admin.display-name:Administrador}") String displayName
    ) {
        this.users = users;
        this.email = email.trim().toLowerCase();
        this.password = password;
        this.displayName = displayName == null || displayName.isBlank() ? "Administrador" : displayName.trim();
    }

    @Override
    public void run(String... args) {
        if (email.isBlank() || password.length() < 8) return;
        UserAccount admin = users.findByEmailIgnoreCase(email).orElseGet(UserAccount::new);
        admin.setEmail(email);
        admin.setDisplayName(displayName);
        admin.setRole("ADMIN");
        admin.setPasswordHash(encoder.encode(password));
        users.save(admin);
    }
}
