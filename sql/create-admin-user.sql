-- Create admin user entirely via SQL (no app signup required).
-- Run this in Supabase SQL Editor after running admin-migration-role-blocked.sql.
-- Requires pgcrypto extension (Supabase usually has it). If INSERT into auth.users fails (permission denied),
-- create the user in Dashboard → Authentication → Users → Add user, then run only the "Ensure public.users" block at the bottom.

-- Enable pgcrypto for password hashing (ignore error if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  admin_email text := 'admin@email.com';
  admin_password text := 'Admin123';
  encrypted_pw text;
  now_ts timestamptz := now();
BEGIN
  encrypted_pw := crypt(admin_password, gen_salt('bf'));

  -- Insert into auth.users (Supabase Auth)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    admin_email,
    encrypted_pw,
    now_ts,
    now_ts,
    now_ts,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '',
    '',
    '',
    ''
  );

  -- Insert into auth.identities (required for email provider)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_id,
    format('{"sub":"%s","email":"%s"}', admin_id::text, admin_email)::jsonb,
    'email',
    admin_id::text,
    now_ts,
    now_ts,
    now_ts
  );

  -- Insert into public.users with role = admin (your app table)
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (admin_id, admin_email, 'Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', email = admin_email;

  RAISE NOTICE 'Admin user created: % (id: %)', admin_email, admin_id;
END $$;

-- If the DO block above fails with "permission denied" on auth.users:
-- 1. Create the user in Supabase Dashboard: Authentication → Users → Add user
--    Email: admin@email.com, Password: Admin123
-- 2. Then run only this (replace USER_ID with the id from Dashboard):
--
-- INSERT INTO public.users (id, email, full_name, role)
-- VALUES ('USER_ID_HERE', 'admin@email.com', 'Admin', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
