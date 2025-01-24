-- Drop the existing function
DROP FUNCTION IF EXISTS get_all_active_employee_profiles;

-- Create the new function with a more descriptive name
CREATE OR REPLACE FUNCTION get_all_active_employee_profiles()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM profiles 
    WHERE is_active = true 
    AND is_customer = false 
    ORDER BY first_name, last_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_active_employee_profiles() TO authenticated; 