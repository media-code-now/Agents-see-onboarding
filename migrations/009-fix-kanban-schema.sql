-- Fix kanban_cards schema

-- Drop old column CHECK constraint (may be auto-named by Postgres)
ALTER TABLE kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_column_check;
-- Add updated constraint that includes 'backlog'
ALTER TABLE kanban_cards ADD CONSTRAINT kanban_cards_column_check CHECK ("column" IN ('backlog', 'todo', 'in-progress', 'review', 'done'));

-- Drop FK on assigned_to so we can store names instead of UUIDs
ALTER TABLE kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_assigned_to_fkey;
-- Change assigned_to to TEXT (store team member names directly)
ALTER TABLE kanban_cards ALTER COLUMN assigned_to TYPE TEXT USING (assigned_to::TEXT);

-- Add category column
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Other';
