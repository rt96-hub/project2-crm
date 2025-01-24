-- Add is_counted_open to statuses
ALTER TABLE public.statuses
ADD COLUMN is_counted_open boolean DEFAULT true NOT NULL;

-- Update existing statuses based on their names
UPDATE public.statuses
SET is_counted_open = CASE 
    WHEN LOWER(name) IN ('resolved', 'closed') THEN false
    ELSE true
END; 