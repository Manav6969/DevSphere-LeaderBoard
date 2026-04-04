-- Enable realtime replication for the task_completions table so the 
-- frontend WebSocket catches instant point updates!

BEGIN;

-- First, ensure the publication exists (Supabase creates this by default)
-- Then, add our table to it!
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_completions;

COMMIT;
