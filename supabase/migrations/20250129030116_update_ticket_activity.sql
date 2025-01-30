-- Remove NOT NULL constraint from actor_id in ticket_history
ALTER TABLE public.ticket_history
ALTER COLUMN actor_id DROP NOT NULL;

-- Add from_ai column to ticket_history
ALTER TABLE public.ticket_history
ADD COLUMN from_ai boolean DEFAULT FALSE NOT NULL;
