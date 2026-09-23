-- Dados de demonstração. Senha para todos os colaboradores: senha123
INSERT INTO colaboradores (name, email, password_hash, title) VALUES
    ('Ana Souza', 'ana.souza@talentmatch.com', '$2b$10$2f14CDeNkrOMnQeP8HLUIOlOuf1McnXDIHZN71.0iiKtgvm56XmZ.', 'Desenvolvedora Backend'),
    ('Bruno Lima', 'bruno.lima@talentmatch.com', '$2b$10$2f14CDeNkrOMnQeP8HLUIOlOuf1McnXDIHZN71.0iiKtgvm56XmZ.', 'Desenvolvedor Frontend'),
    ('Carla Nunes', 'carla.nunes@talentmatch.com', '$2b$10$2f14CDeNkrOMnQeP8HLUIOlOuf1McnXDIHZN71.0iiKtgvm56XmZ.', 'Engenheira de Dados'),
    ('Diego Santos', 'diego.santos@talentmatch.com', '$2b$10$2f14CDeNkrOMnQeP8HLUIOlOuf1McnXDIHZN71.0iiKtgvm56XmZ.', 'Desenvolvedor Full Stack');

INSERT INTO colaborador_skills (colaborador_id, skill)
SELECT id, skill FROM colaboradores, unnest(ARRAY['Java', 'Spring Boot', 'SQL', 'Docker', 'Git']) AS skill
WHERE email = 'ana.souza@talentmatch.com';

INSERT INTO colaborador_skills (colaborador_id, skill)
SELECT id, skill FROM colaboradores, unnest(ARRAY['React', 'TypeScript', 'JavaScript', 'CSS', 'Git']) AS skill
WHERE email = 'bruno.lima@talentmatch.com';

INSERT INTO colaborador_skills (colaborador_id, skill)
SELECT id, skill FROM colaboradores, unnest(ARRAY['Python', 'SQL', 'AWS', 'Docker', 'Machine Learning', 'Pandas']) AS skill
WHERE email = 'carla.nunes@talentmatch.com';

INSERT INTO colaborador_skills (colaborador_id, skill)
SELECT id, skill FROM colaboradores, unnest(ARRAY['Java', 'React', 'SQL', 'Docker', 'AWS', 'Git']) AS skill
WHERE email = 'diego.santos@talentmatch.com';
