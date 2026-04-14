-- Drop the existing view
DROP VIEW IF EXISTS public.leaderboard;

-- Recreate the view with dynamic time calculation based on valid completions
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.email,
  p.github_username,
  COALESCE(SUM(t.points), 0) as total_points,
  -- Calculate max time from valid completions, falling back to 0 if none exist
  COALESCE(
    MAX(
      EXTRACT(EPOCH FROM (
        COALESCE(
          (tc.payload->>'commit_time')::timestamp with time zone,
          tc.created_at
        ) - (SELECT value::timestamp with time zone FROM settings WHERE key = 'event_start_time' LIMIT 1)
      ))
    )::bigint, 
    0
  ) as total_time,
  COUNT(tc.id) as tasks_completed
FROM profiles p
LEFT JOIN task_completions tc ON p.id = tc.profile_id AND tc.status = 'valid'
LEFT JOIN tasks t ON tc.task_id = t.id
WHERE p.github_username IS NOT NULL
AND p.email NOT IN (SELECT email FROM admins)
GROUP BY p.id, p.email, p.github_username
ORDER BY total_points DESC, total_time ASC;
