-- Admin panel: add role and blocked_at to users
-- Run this in Supabase SQL Editor, then backfill one admin (see bottom).

-- Add role column (default 'user'; only 'admin' can access /admin)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add blocked_at for blocking users without deleting
ALTER TABLE users
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- Optional: index for admin lookups and blocked filter
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_blocked_at ON users(blocked_at) WHERE blocked_at IS NOT NULL;

-- Backfill: set admin@email.com as admin (must exist in users table first)
-- If you don't have this user yet: sign up at /signup with admin@email.com and your password, then run this migration.
UPDATE users SET role = 'admin' WHERE email = 'admin@email.com';

-- Verify
-- SELECT id, email, role, blocked_at FROM users WHERE role = 'admin';
