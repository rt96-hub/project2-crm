-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of ticket creators and assignees" ON public.profiles;

-- Create new policy to allow all authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);