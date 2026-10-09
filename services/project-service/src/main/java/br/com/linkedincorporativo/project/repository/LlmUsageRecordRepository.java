package br.com.linkedincorporativo.project.repository;

import br.com.linkedincorporativo.project.domain.LlmUsageRecord;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LlmUsageRecordRepository extends JpaRepository<LlmUsageRecord, Long> {
    List<LlmUsageRecord> findByCreatedAtGreaterThanEqualOrderByCreatedAtAsc(Instant createdAt);
}
