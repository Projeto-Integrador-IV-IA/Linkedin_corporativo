CREATE TABLE matches (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT       NOT NULL,
    colaborador_id  BIGINT       NOT NULL,
    colaborador_name VARCHAR(150) NOT NULL,
    score           NUMERIC(5, 2) NOT NULL,
    matched_skills  TEXT         NOT NULL DEFAULT '',
    skill_gaps      TEXT         NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_project_id ON matches (project_id);
