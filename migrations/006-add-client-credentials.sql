-- Add client account credentials fields for system login
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_password_temp VARCHAR(255);

-- Add index on client_email for unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_email_unique ON clients(client_email) WHERE client_email IS NOT NULL;
