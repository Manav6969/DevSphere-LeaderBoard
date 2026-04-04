-- Initial Schema for DevSphere Leaderboard

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE task_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE completion_status AS ENUM ('valid', 'invalidated');

-- 2. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  github_username TEXT UNIQUE,
  role user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tasks Table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_identifier TEXT UNIQUE NOT NULL, -- e.g. "issue-123" or "repo-name"
  title TEXT NOT NULL,
  difficulty task_difficulty NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Task Completions Table
CREATE TABLE task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  status completion_status DEFAULT 'valid' NOT NULL,
  payload JSONB, -- Store original GitHub payload for reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(profile_id, task_id)
);

-- 5. Leaderboard View
CREATE OR REPLACE VIEW leaderboard AS
  SELECT 
    p.id,
    p.email,
    p.github_username,
    COALESCE(SUM(t.points), 0) as total_points,
    COUNT(tc.id) as tasks_completed
  FROM profiles p
  LEFT JOIN task_completions tc ON p.id = tc.profile_id AND tc.status = 'valid'
  LEFT JOIN tasks t ON tc.task_id = t.id
  GROUP BY p.id;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Profiles: Users can see all profiles (for leaderboard), but only update their own github_username if it is null
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tasks: Viewable by everyone
CREATE POLICY "Tasks are viewable by everyone" ON tasks FOR SELECT USING (true);
CREATE POLICY "Admins can manage tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Task Completions: Viewable by everyone, only admins can update status
CREATE POLICY "Completions are viewable by everyone" ON task_completions FOR SELECT USING (true);
CREATE POLICY "Only admins can modify completions" ON task_completions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
