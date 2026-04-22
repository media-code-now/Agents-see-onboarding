-- Insert test user for noam@nsmprime.com
-- Password: Change this to a secure password and hash it with bcrypt
INSERT INTO users (name, email, password, is_master_admin, created_at, updated_at)
VALUES (
  'Noam',
  'noam@nsmprime.com',
  '$2a$12$example_hashed_password_here', -- Replace with actual bcrypt hash
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
