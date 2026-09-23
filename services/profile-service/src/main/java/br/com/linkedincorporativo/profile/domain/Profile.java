package br.com.linkedincorporativo.profile.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "profiles")
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fullName;
    private String email;
    private String profession;
    private String educationLevel;
    private Integer yearsOfExperience;
    private String bio;
    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProfileSkill> skills = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PortfolioProject> portfolioProjects = new ArrayList<>();

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String value) { this.fullName = value; }
    public String getEmail() { return email; }
    public void setEmail(String value) { this.email = value; }
    public String getProfession() { return profession; }
    public void setProfession(String value) { this.profession = value; }
    public String getEducationLevel() { return educationLevel; }
    public void setEducationLevel(String value) { this.educationLevel = value; }
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer value) { this.yearsOfExperience = value; }
    public String getBio() { return bio; }
    public void setBio(String value) { this.bio = value; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String value) { this.avatarUrl = value; }
    public List<ProfileSkill> getSkills() { return skills; }
    public List<PortfolioProject> getPortfolioProjects() { return portfolioProjects; }
}
