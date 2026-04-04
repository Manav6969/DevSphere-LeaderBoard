DROP VIEW IF EXISTS public.leaderboard;

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.email,
  p.github_username,
  COALESCE(SUM(t.points), 0) as total_points,
  -- Handle the case where a user has no completions or settings value is malformed
  COALESCE(
    (
      SELECT EXTRACT(EPOCH FROM (MAX(tc.created_at) - s.value::timestamp))
      FROM settings s
      WHERE s.key = 'event_start_time'
    ), 
    0
  )::BIGINT as total_time,
  COUNT(tc.id) as tasks_completed
FROM profiles p
LEFT JOIN task_completions tc ON p.id = tc.profile_id AND tc.status = 'valid'
LEFT JOIN tasks t ON tc.task_id = t.id
WHERE p.github_username IS NOT NULL
AND p.email NOT IN (SELECT email FROM admins)
GROUP BY p.id, p.email, p.github_username
ORDER BY total_points DESC, total_time ASC;
