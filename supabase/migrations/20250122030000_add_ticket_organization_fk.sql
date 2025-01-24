-- Add foreign key constraint for organization_id in tickets table
ALTER TABLE tickets
ADD CONSTRAINT tickets_organization_id_fkey
FOREIGN KEY (organization_id) REFERENCES organizations(id)
ON DELETE CASCADE; 