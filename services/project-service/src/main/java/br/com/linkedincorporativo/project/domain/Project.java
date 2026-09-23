package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private String area;
    private String ownerName;
    private String ownerEmail;
    private Long ownerUserId;
    private String status = "ABERTO";

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RequiredSkill> requiredSkills = new ArrayList<>();
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Application> applications = new ArrayList<>();

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String value) { this.title = value; }
    public String getDescription() { return description; }
    public void setDescription(String value) { this.description = value; }
    public String getArea() { return area; }
    public void setArea(String value) { this.area = value; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String value) { this.ownerName = value; }
    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String value) { this.ownerEmail = value; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long value) { this.ownerUserId = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }
    public List<RequiredSkill> getRequiredSkills() { return requiredSkills; }
    public List<Application> getApplications() { return applications; }
}
