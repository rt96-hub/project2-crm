-- Enable RLS on all organization-related tables
ALTER TABLE public.organization_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Organization Types Policies
CREATE POLICY "Allow read access for authenticated users on organization_types" 
ON public.organization_types FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all access for admin users on organization_types" 
ON public.organization_types FOR ALL 
TO authenticated 
USING (public.is_admin());

-- Organization Statuses Policies
CREATE POLICY "Allow read access for authenticated users on organization_statuses" 
ON public.organization_statuses FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all access for admin users on organization_statuses" 
ON public.organization_statuses FOR ALL 
TO authenticated 
USING (public.is_admin());

-- Organizations Policies
CREATE POLICY "Allow customers to view their own organization" 
ON public.organizations FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_users ou 
        WHERE ou.organization_id = organizations.id 
        AND ou.profile_id = auth.uid()
    )
);


CREATE POLICY "Allow non-customer users to view all organizations" 
ON public.organizations FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND is_customer = false
    )
);



CREATE POLICY "Allow all access for admin users on organizations" 
ON public.organizations FOR ALL 
TO authenticated 
USING (public.is_admin());

-- Organization Users Policies
CREATE POLICY "Allow customer to view their own record from organization_users"
ON public.organization_users FOR SELECT
TO authenticated
USING (
    profile_id = auth.uid()
);


-- CREATE POLICY "Allow customers to view organization_users within their organization" 
-- ON public.organization_users FOR SELECT 
-- TO authenticated 
-- USING (
--     EXISTS (
--         SELECT 1 FROM public.organization_users ou
--         JOIN public.profiles p ON p.user_id = ou.profile_id
--         WHERE ou.organization_id = organization_users.organization_id
--         AND p.is_customer = true
--         AND ou.profile_id = auth.uid()
--     )
-- );
-- not functional, shows all organization_users for all organizations

CREATE POLICY "Allow non-customer users to view all organization_users" 
ON public.organization_users FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND is_customer = false
    )
);



CREATE POLICY "Allow all access for admin users on organization_users" 
ON public.organization_users FOR ALL 
TO authenticated 
USING (public.is_admin());

