-- Fix NULL or empty full_name for existing users
-- This script sets the full_name to the email prefix if it's currently NULL or empty
UPDATE public.users
SET full_name = COALESCE(
    full_name, 
    INITCAP(SPLIT_PART(email, '@', 1))
)
WHERE full_name IS NULL OR full_name = '';

-- Specifically for the user mentioned: knoxvilleaccounting@brenzpizzaco.com
-- This is already covered by the generic query above, but we can verify it.

-- To prevent this from happening manually in the future at the DB level, 
-- we can add a constraint, but it's better to enforce it in the UI first.
-- ALTER TABLE public.users ALTER COLUMN full_name SET NOT NULL;
