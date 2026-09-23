package br.com.linkedincorporativo.match.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "matches")
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "colaborador_id", nullable = false)
    private Long colaboradorId;

    @Column(name = "colaborador_name", nullable = false, length = 150)
    private String colaboradorName;

    @Column(nullable = false)
    private BigDecimal score;

    @Column(name = "matched_skills", nullable = false, columnDefinition = "text")
    private String matchedSkills;

    @Column(name = "skill_gaps", nullable = false, columnDefinition = "text")
    private String skillGaps;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected MatchResult() {
    }

    public MatchResult(Long projectId, Long colaboradorId, String colaboradorName, BigDecimal score,
            String matchedSkills, String skillGaps) {
        this.projectId = projectId;
        this.colaboradorId = colaboradorId;
        this.colaboradorName = colaboradorName;
        this.score = score;
        this.matchedSkills = matchedSkills;
        this.skillGaps = skillGaps;
    }

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public Long getColaboradorId() {
        return colaboradorId;
    }

    public String getColaboradorName() {
        return colaboradorName;
    }

    public BigDecimal getScore() {
        return score;
    }

    public String getMatchedSkills() {
        return matchedSkills;
    }

    public String getSkillGaps() {
        return skillGaps;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
