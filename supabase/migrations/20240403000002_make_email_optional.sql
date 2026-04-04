-- Migration to make 'email' optional in 'profiles'
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Ensure github_username has a unique constraint (already does, but for safety)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_github_username_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_github_username_key UNIQUE (github_username);
    END IF;
END $$;

-- Update RLS for public registration based on github_username
DROP POLICY IF EXISTS "Anyone can update a profile if they know the email" ON public.profiles;
CREATE POLICY "Anyone can update a profile" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
