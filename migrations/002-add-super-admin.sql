-- Add Noam as super admin user
INSERT INTO users (name, email, password, is_master_admin, created_at, updated_at)
VALUES ('Noam Sadi', 'noam@nsmprime.com', '$2b$12$g446INnsJPzaIz80jo2xKeOST4jwgrtJqUwxQYJvnl5O1sw3TqyjS', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  password = '$2b$12$g446INnsJPzaIz80jo2xKeOST4jwgrtJqUwxQYJvnl5O1sw3TqyjS',
  is_master_admin = true,
  updated_at = NOW();

-- Verify
SELECT id, email, name, is_master_admin FROM users WHERE email = 'noam@nsmprime.com';
