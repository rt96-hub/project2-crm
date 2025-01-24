-- Create function to get employee open ticket counts
CREATE OR REPLACE FUNCTION public.get_employee_open_ticket_counts()
RETURNS TABLE (
    profile_id uuid,
    count bigint
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        ta.profile_id,
        COUNT(*)::bigint
    FROM ticket_assignments ta
    JOIN tickets t ON ta.ticket_id = t.id
    JOIN statuses s ON t.status_id = s.id
    WHERE s.is_counted_open = true
    GROUP BY ta.profile_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_employee_open_ticket_counts() TO authenticated;