-- Migration 007: Add Access & Logins fields to clients table
-- Adds website access credentials and tool integration URLs

ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_cms VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_login_url VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_username VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_password VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hosting VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS domain_registrar VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_analytics VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_console VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_business_profile VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag_manager VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS other_tools TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_website_cms ON clients(website_cms);
CREATE INDEX IF NOT EXISTS idx_clients_hosting ON clients(hosting);
