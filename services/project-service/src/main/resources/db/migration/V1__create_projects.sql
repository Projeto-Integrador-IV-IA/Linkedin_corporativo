CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    description TEXT,
    status      VARCHAR(30)  NOT NULL DEFAULT 'OPEN',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE project_required_skills (
    id         BIGSERIAL PRIMARY KEY,
    project_id BIGINT       NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    skill      VARCHAR(100) NOT NULL
);

CREATE INDEX idx_project_required_skills_project_id ON project_required_skills (project_id);
