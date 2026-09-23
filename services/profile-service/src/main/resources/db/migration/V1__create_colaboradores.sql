CREATE TABLE colaboradores (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(150)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(100)  NOT NULL,
    title         VARCHAR(150),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE colaborador_skills (
    id             BIGSERIAL PRIMARY KEY,
    colaborador_id BIGINT       NOT NULL REFERENCES colaboradores (id) ON DELETE CASCADE,
    skill          VARCHAR(100) NOT NULL
);

CREATE INDEX idx_colaborador_skills_colaborador_id ON colaborador_skills (colaborador_id);
