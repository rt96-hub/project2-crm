-- Drop the existing foreign key constraint for ticket_comments
ALTER TABLE ticket_comments
DROP CONSTRAINT IF EXISTS ticket_comments_author_id_fkey;

-- Add new foreign key constraint to profiles.user_id for ticket_comments
ALTER TABLE ticket_comments
ADD CONSTRAINT ticket_comments_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- Add an index to improve join performance for ticket_comments
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author_id
ON ticket_comments(author_id);
