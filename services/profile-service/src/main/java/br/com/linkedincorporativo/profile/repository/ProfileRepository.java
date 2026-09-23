package br.com.linkedincorporativo.profile.repository;

import br.com.linkedincorporativo.profile.domain.Profile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByEmailIgnoreCase(String email);
}
