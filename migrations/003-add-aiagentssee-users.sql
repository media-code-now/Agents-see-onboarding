-- Add additional super admin users
INSERT INTO users (name, email, password, is_master_admin, created_at, updated_at)
VALUES 
  ('Noam', 'noam@aiagentssee.com', '$2b$12$tT6tZiwGekvdnsIYPzDN6.2MvfVM3k5XijFauwYgdrOWI1tDzriny', true, NOW(), NOW()),
  ('Yehuda', 'yehuda@aiagentssee.com', '$2b$12$7/1z1.bJznApQ87QhKHB5Oa5q26.ZvKIj9.2kzqk9fvSBXtb2Vrrq', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  is_master_admin = true,
  updated_at = NOW();

-- Verify
SELECT id, email, name, is_master_admin FROM users ORDER BY created_at DESC;
