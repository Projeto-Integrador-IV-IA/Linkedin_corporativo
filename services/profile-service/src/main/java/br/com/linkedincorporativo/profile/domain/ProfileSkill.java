package br.com.linkedincorporativo.profile.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "profile_skills")
public class ProfileSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
    private String proficiencyLevel;
    private Integer yearsOfExperience;

    public ProfileSkill() {}
    public ProfileSkill(Profile profile, Skill skill, String proficiencyLevel, Integer yearsOfExperience) {
        this.profile = profile;
        this.skill = skill;
        this.proficiencyLevel = proficiencyLevel;
        this.yearsOfExperience = yearsOfExperience;
    }
    public Long getId() { return id; }
    public Profile getProfile() { return profile; }
    public Skill getSkill() { return skill; }
    public String getProficiencyLevel() { return proficiencyLevel; }
    public void setProficiencyLevel(String value) { this.proficiencyLevel = value; }
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer value) { this.yearsOfExperience = value; }
}
