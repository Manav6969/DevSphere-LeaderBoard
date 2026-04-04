-- Migration to add 'type' column to 'tasks' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
        CREATE TYPE task_type AS ENUM ('web app', 'ml', 'foss', 'other');
    END IF;
END $$;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS type task_type DEFAULT 'web app' NOT NULL;
