-- Drop the existing foreign key constraint
ALTER TABLE ticket_history
DROP CONSTRAINT IF EXISTS ticket_history_actor_id_fkey;

-- Add new foreign key constraint to profiles.user_id
ALTER TABLE ticket_history
ADD CONSTRAINT ticket_history_actor_id_fkey
FOREIGN KEY (actor_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- Add an index to improve join performance
CREATE INDEX IF NOT EXISTS idx_ticket_history_actor_id
ON ticket_history(actor_id); 