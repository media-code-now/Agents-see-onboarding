-- Add clients JSONB column to team_members table for storing assigned client IDs
ALTER TABLE team_members
ADD COLUMN clients JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance on clients array
CREATE INDEX idx_team_members_clients ON team_members USING GIN (clients);
