-- Add is_active to organization_types
ALTER TABLE public.organization_types
ADD COLUMN is_active boolean DEFAULT true NOT NULL;

-- Add is_active to organization_statuses
ALTER TABLE public.organization_statuses
ADD COLUMN is_active boolean DEFAULT true NOT NULL;

-- Add is_active to statuses
ALTER TABLE public.statuses
ADD COLUMN is_active boolean DEFAULT true NOT NULL;

-- Add is_active to priorities
ALTER TABLE public.priorities
ADD COLUMN is_active boolean DEFAULT true NOT NULL;

-- Set all existing records to active
UPDATE public.organization_types SET is_active = true;
UPDATE public.organization_statuses SET is_active = true;
UPDATE public.statuses SET is_active = true;
UPDATE public.priorities SET is_active = true; 