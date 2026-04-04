-- Drop the unused 'type' column from the tasks table
-- The app uses the 'title' column to store task type (web, app, ml, foss)
ALTER TABLE public.tasks DROP COLUMN IF EXISTS type;

-- Also drop the enum type if it exists and is no longer used
DROP TYPE IF EXISTS task_type;
