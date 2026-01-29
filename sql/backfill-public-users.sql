-- Backfill public.users from auth.users (run in Supabase SQL Editor)
-- Use this when new users don't get resumes because they're missing from public.users.
-- Subscriptions and resumes tables reference users(id); create-checkout and webhook need public.users to exist.

INSERT INTO public.users (id, email, full_name)
SELECT
  a.id,
  a.email,
  COALESCE(
    a.raw_user_meta_data->>'full_name',
    a.raw_user_meta_data->>'name',
    split_part(a.email, '@', 1)
  )
FROM auth.users a
LEFT JOIN public.users u ON u.id = a.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
