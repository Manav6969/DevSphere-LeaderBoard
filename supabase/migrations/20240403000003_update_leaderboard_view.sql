-- Migration to update leaderboard view with total_time
CREATE OR REPLACE VIEW public.leaderboard AS
  WITH event_start AS (
    SELECT (value->>0)::timestamp as start_time 
    FROM public.settings 
    WHERE key = 'event_start_time'
    LIMIT 1
  )
  SELECT 
    p.id,
    p.email,
    p.github_username,
    COALESCE(SUM(t.points), 0) as total_points,
    COUNT(tc.id) as tasks_completed,
    MAX(tc.created_at) - (SELECT start_time FROM event_start) as total_time_interval,
    EXTRACT(EPOCH FROM (MAX(tc.created_at) - (SELECT start_time FROM event_start))) as total_time
  FROM public.profiles p
  LEFT JOIN public.task_completions tc ON p.id = tc.profile_id AND tc.status = 'valid'
  LEFT JOIN public.tasks t ON tc.task_id = t.id
  GROUP BY p.id, (SELECT start_time FROM event_start)
  ORDER BY total_points DESC, total_time ASC;
