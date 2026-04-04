-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Settings Table for global configuration
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Initialize event_start_time if not exists
INSERT INTO public.settings (key, value)
VALUES ('event_start_time', NOW()::text)
ON CONFLICT (key) DO NOTHING;

-- 3. Modify Tasks Table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- 4. Modify Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS time_taken BIGINT DEFAULT 0; -- total seconds

-- 5. Update handle_new_user function to not automatically create profile if we want to restrict
-- Actually, the user wants ONLY admins to login. 
-- So we should check the admins table during auth callback.

-- 6. Update Leaderboard View
DROP VIEW IF EXISTS public.leaderboard;
CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT 
    p.id,
    p.email,
    p.github_username,
    p.score as total_points,
    p.time_taken as total_time,
    (SELECT COUNT(*) FROM task_completions tc WHERE tc.profile_id = p.id AND tc.status = 'valid') as tasks_completed
  FROM profiles p
  WHERE p.github_username IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.email = p.email) -- Exclude admins from leaderboard
  ORDER BY p.score DESC, p.time_taken ASC;

-- Enable RLS for new tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- FIX: Use a non-recursive policy for admins SELECT
CREATE POLICY "Admins are viewable by authenticated users" ON public.admins FOR SELECT TO authenticated USING (true);

CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Settings are manageable by admins" ON public.settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);
