-- Drop the existing foreign key constraint
ALTER TABLE ticket_assignments
DROP CONSTRAINT IF EXISTS ticket_assignments_profile_id_fkey;

-- Add new foreign key constraint to profiles.user_id
ALTER TABLE ticket_assignments
ADD CONSTRAINT ticket_assignments_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- Add an index to improve join performance
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_profile_id
ON ticket_assignments(profile_id); 