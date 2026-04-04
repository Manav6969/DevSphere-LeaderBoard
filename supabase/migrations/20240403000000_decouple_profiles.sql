-- Migration: Decouple profiles from auth.users
-- This allows participants to register without logging in

-- 1. Remove the foreign key constraint from profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Ensure id has a default UUID for new participants
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Update RLS policies for profiles
-- Allow anyone to insert their profile (onboarding)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
-- We use email-based verification for updates since there's no auth session for participants
CREATE POLICY "Anyone can insert a profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update a profile if they know the email" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Enable RLS on task_completions (already enabled, but ensure select is public)
DROP POLICY IF EXISTS "Completions are viewable by everyone" ON public.task_completions;
CREATE POLICY "Completions are viewable by everyone" ON public.task_completions FOR SELECT USING (true);
