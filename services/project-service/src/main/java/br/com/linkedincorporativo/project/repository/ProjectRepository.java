package br.com.linkedincorporativo.project.repository;

import br.com.linkedincorporativo.project.domain.Project;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerUserId(Long ownerUserId);
    List<Project> findByOwnerUserIdOrOwnerEmail(Long ownerUserId, String ownerEmail);
}
