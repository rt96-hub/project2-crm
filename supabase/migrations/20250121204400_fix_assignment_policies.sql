-- Function to get assignees for tickets with limited profile information
CREATE OR REPLACE FUNCTION public.get_ticket_assignees(ticket_ids uuid[])
RETURNS TABLE (
    ticket_id uuid,
    assignee_id uuid,
    first_name text,
    last_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        ta.ticket_id,
        p.user_id as assignee_id,
        p.first_name,
        p.last_name
    FROM ticket_assignments ta
    JOIN profiles p ON ta.profile_id = p.user_id
    WHERE ta.ticket_id = ANY(ticket_ids)
    AND p.is_active = true
    ORDER BY ta.ticket_id, p.first_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_ticket_assignees(uuid[]) TO authenticated;
