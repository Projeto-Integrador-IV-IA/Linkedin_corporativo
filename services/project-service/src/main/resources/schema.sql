ALTER TABLE IF EXISTS projects
    ALTER COLUMN description TYPE TEXT;

DELETE FROM required_skills;

ALTER TABLE IF EXISTS project_applications
    ADD COLUMN IF NOT EXISTS user_id BIGINT;

ALTER TABLE IF EXISTS project_applications
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_project_interest_user
    ON project_applications (project_id, user_id)
    WHERE user_id IS NOT NULL;
