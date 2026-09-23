package br.com.linkedincorporativo.project.service;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;

import br.com.linkedincorporativo.project.domain.Project;
import br.com.linkedincorporativo.project.domain.ProjectRequiredSkill;
import br.com.linkedincorporativo.project.dto.CreateProjectRequest;
import br.com.linkedincorporativo.project.dto.ProjectDto;
import br.com.linkedincorporativo.project.repository.ProjectRepository;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ProjectDto create(CreateProjectRequest request) {
        Project project = new Project();
        project.setTitle(request.title());
        project.setDescription(request.description());
        project.setRequiredSkills(request.requiredSkills().stream().map(ProjectRequiredSkill::new).toList());

        return ProjectDto.from(projectRepository.save(project));
    }

    public List<ProjectDto> listAll() {
        return projectRepository.findAll().stream().map(ProjectDto::from).toList();
    }

    public ProjectDto findById(Long id) {
        return projectRepository.findById(id)
                .map(ProjectDto::from)
                .orElseThrow(() -> new NoSuchElementException("project not found: " + id));
    }
}
