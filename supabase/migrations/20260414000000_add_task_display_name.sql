-- Add task_name column to tasks table
ALTER TABLE tasks ADD COLUMN task_name TEXT;

-- Update existing tasks to have task_name equal to github_identifier as a default
UPDATE tasks SET task_name = github_identifier WHERE task_name IS NULL;
