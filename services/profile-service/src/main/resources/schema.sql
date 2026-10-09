ALTER TABLE IF EXISTS profiles
    ALTER COLUMN bio TYPE TEXT;

ALTER TABLE IF EXISTS portfolio_projects
    ALTER COLUMN description TYPE TEXT;

DELETE FROM profile_skills;
DELETE FROM skills;
