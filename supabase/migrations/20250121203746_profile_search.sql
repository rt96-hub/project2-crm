-- Create function to get all active profiles
CREATE OR REPLACE FUNCTION public.get_all_active_profiles()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM profiles WHERE is_active = true ORDER BY first_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_active_profiles() TO authenticated;

-- Add policy to allow users to create assignments
CREATE POLICY "Users can create assignments"
    ON public.ticket_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_assignments.ticket_id
            AND (
                -- User is the creator of the ticket
                t.creator_id = auth.uid()
                OR
                -- User is already assigned to the ticket (for adding additional assignees)
                EXISTS (
                    SELECT 1 FROM ticket_assignments ta
                    WHERE ta.ticket_id = t.id
                    AND ta.profile_id = auth.uid()
                )
            )
        )
    ); 