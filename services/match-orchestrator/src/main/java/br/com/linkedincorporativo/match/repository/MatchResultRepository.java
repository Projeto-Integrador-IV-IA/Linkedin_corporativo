package br.com.linkedincorporativo.match.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.linkedincorporativo.match.domain.MatchResult;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {

    List<MatchResult> findByProjectIdOrderByScoreDesc(Long projectId);

    void deleteByProjectId(Long projectId);
}
