package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "required_skills")
public class RequiredSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    private String skillName;
    private String requiredLevel;

    public RequiredSkill() {}
    public RequiredSkill(Project project, String skillName, String requiredLevel) {
        this.project = project;
        this.skillName = skillName;
        this.requiredLevel = requiredLevel;
    }
    public Long getId() { return id; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String value) { this.skillName = value; }
    public String getRequiredLevel() { return requiredLevel; }
    public void setRequiredLevel(String value) { this.requiredLevel = value; }
}
