-- Initialize Neon database schema and add super admin user
-- Run this script in Neon SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- For Neon, use gen_random_uuid() instead if uuid_generate_v4() doesn't work
-- ─── Users table (authentication) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  password     VARCHAR(255) NOT NULL,
  is_master_admin BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login   TIMESTAMP WITH TIME ZONE,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Insert super admin user ─────────────────────────────────────────────────
INSERT INTO users (name, email, password, is_master_admin, created_at, updated_at)
VALUES ('Noam Sadi', 'noam@nsmprime.com', '$2b$12$dSzXQ1D9/uMJpp9CNSb4MetT5QqwCkEzUdHWAUF.11QoGV0Csma.y', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify insertion
SELECT id, email, name, is_master_admin FROM users WHERE email = 'noam@nsmprime.com';
