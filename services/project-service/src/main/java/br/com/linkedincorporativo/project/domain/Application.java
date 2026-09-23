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
@Table(name = "project_applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    private Long profileId;
    private String profileName;
    private String profileEmail;
    private String status = "PENDENTE";

    public Application() {}
    public Application(Project project, Long profileId, String profileName, String profileEmail) {
        this.project = project;
        this.profileId = profileId;
        this.profileName = profileName;
        this.profileEmail = profileEmail;
    }
    public Long getId() { return id; }
    public Long getProfileId() { return profileId; }
    public String getProfileName() { return profileName; }
    public String getProfileEmail() { return profileEmail; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }
}
