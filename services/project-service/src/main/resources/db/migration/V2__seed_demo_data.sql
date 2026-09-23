INSERT INTO projects (title, description, status) VALUES
    ('Desenvolvedor Full Stack Java/React', 'Vaga interna para o time de plataforma: back-end em Java/Spring e front-end em React.', 'OPEN'),
    ('Engenheiro(a) de Dados e ML', 'Projeto de recomendação interna: pipelines de dados, treinamento e inferência de modelos.', 'OPEN');

INSERT INTO project_required_skills (project_id, skill)
SELECT id, skill FROM projects, unnest(ARRAY['Java', 'Spring Boot', 'React', 'SQL', 'Docker']) AS skill
WHERE title = 'Desenvolvedor Full Stack Java/React';

INSERT INTO project_required_skills (project_id, skill)
SELECT id, skill FROM projects, unnest(ARRAY['Python', 'SQL', 'AWS', 'Docker', 'Machine Learning']) AS skill
WHERE title = 'Engenheiro(a) de Dados e ML';
