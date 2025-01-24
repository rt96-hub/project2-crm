-- Create function to get open ticket counts
CREATE OR REPLACE FUNCTION public.get_organization_open_ticket_counts()
RETURNS TABLE (
    organization_id uuid,
    count bigint
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.organization_id,
        COUNT(*)::bigint
    FROM tickets t
    JOIN statuses s ON t.status_id = s.id
    WHERE s.is_counted_open = true
    GROUP BY t.organization_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_open_ticket_counts() TO authenticated; 