-- Remove NOT NULL constraint from profile_id in ticket_conversations
ALTER TABLE public.ticket_conversations
ALTER COLUMN profile_id DROP NOT NULL;

-- Remove NOT NULL constraint from author_id in ticket_comments
ALTER TABLE public.ticket_comments
ALTER COLUMN author_id DROP NOT NULL;

-- Add from_ai column to ticket_conversations
ALTER TABLE public.ticket_conversations
ADD COLUMN from_ai boolean DEFAULT FALSE NOT NULL;

-- Add from_ai column to ticket_comments
ALTER TABLE public.ticket_comments
ADD COLUMN from_ai boolean DEFAULT FALSE NOT NULL; 