package br.com.linkedincorporativo.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.linkedincorporativo.project.domain.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
