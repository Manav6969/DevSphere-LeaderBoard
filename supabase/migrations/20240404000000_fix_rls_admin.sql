-- FIX: Update RLS Policies to use the 'admins' table for verification

-- 1. Tasks Table Policies
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
CREATE POLICY "Admins can manage tasks" ON public.tasks 
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- 2. Task Completions Policies
DROP POLICY IF EXISTS "Only admins can modify completions" ON public.task_completions;
CREATE POLICY "Only admins can modify completions" ON public.task_completions 
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- 3. Profiles Policies (Admins should be able to update profiles if needed)
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email'
  )
);
