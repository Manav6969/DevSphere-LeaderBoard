DROP VIEW IF EXISTS public.leaderboard;

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.email,
  p.github_username,
  COALESCE(SUM(t.points), 0) as total_points,
  COALESCE(p.time_taken, 0) as total_time,
  COUNT(tc.id) as tasks_completed
FROM profiles p
LEFT JOIN task_completions tc ON p.id = tc.profile_id AND tc.status = 'valid'
LEFT JOIN tasks t ON tc.task_id = t.id
WHERE p.github_username IS NOT NULL
AND p.email NOT IN (SELECT email FROM admins)
GROUP BY p.id, p.email, p.github_username, p.time_taken
ORDER BY total_points DESC, total_time ASC;
