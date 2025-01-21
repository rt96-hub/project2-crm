-- Drop existing profile policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of ticket creators and assignees" ON public.profiles;

-- Create new policies
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Simplified policy for viewing profiles related to tickets
CREATE POLICY "Users can view profiles of ticket creators and assignees"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.creator_id = profiles.user_id
            AND (t.creator_id = auth.uid() OR EXISTS (
                SELECT 1 FROM ticket_assignments ta
                WHERE ta.ticket_id = t.id AND ta.profile_id = auth.uid()
            ))
        )
        OR
        EXISTS (
            SELECT 1 FROM ticket_assignments ta
            JOIN tickets t ON t.id = ta.ticket_id
            WHERE ta.profile_id = profiles.user_id
            AND (t.creator_id = auth.uid() OR ta.profile_id = auth.uid())
        )
    ); 