-- Add is_customer to profiles
ALTER TABLE public.profiles
ADD COLUMN is_customer BOOLEAN DEFAULT FALSE;

-- Update existing profiles to have is_customer = false
UPDATE public.profiles SET is_customer = FALSE;

-- Create organization_type table
CREATE TABLE public.organization_types (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organization_status table
CREATE TABLE public.organization_statuses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organizations table
CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    customer_since timestamp with time zone DEFAULT timezone('utc'::text, now()),
    customer_type_id uuid REFERENCES public.organization_types(id) ON DELETE RESTRICT,
    customer_status_id uuid REFERENCES public.organization_statuses(id) ON DELETE RESTRICT,
    total_contract decimal(12,2),
    default_priority_id uuid REFERENCES public.priorities(id) ON DELETE RESTRICT,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organization_users junction table
CREATE TABLE public.organization_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, profile_id)
);

-- Add updated_at trigger to organizations
CREATE TRIGGER handle_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed organization types
INSERT INTO public.organization_types (name) VALUES
    ('Individual'),
    ('Small Business'),
    ('Medium Business'),
    ('Large Business'),
    ('Enterprise');

-- Seed organization statuses
INSERT INTO public.organization_statuses (name) VALUES
    ('In Pipeline'),
    ('Under Contract'),
    ('Cancelled'),
    ('On Hold'),
    ('Churned'); 