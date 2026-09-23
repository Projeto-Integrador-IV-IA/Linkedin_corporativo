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
@Table(name = "portfolio_projects")
public class PortfolioProject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;
    private String title;
    private String description;
    private String technologies;

    public PortfolioProject() {}
    public PortfolioProject(Profile profile, String title, String description, String technologies) {
        this.profile = profile;
        this.title = title;
        this.description = description;
        this.technologies = technologies;
    }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String value) { this.title = value; }
    public String getDescription() { return description; }
    public void setDescription(String value) { this.description = value; }
    public String getTechnologies() { return technologies; }
    public void setTechnologies(String value) { this.technologies = value; }
}
