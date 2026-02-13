-- ==========================================
-- BULLETPROOF USER DATA FIX
-- ==========================================

-- 1. BACKFILL: Fix NULL or empty full_name for existing users
-- Use the email prefix as a fallback (e.g. "jon.doe@example.com" -> "Jon.doe")
UPDATE public.users
SET full_name = INITCAP(SPLIT_PART(email, '@', 1))
WHERE full_name IS NULL OR full_name = '';

-- 2. CONSTRAINT: Ensure full_name is NEVER null in the future
-- First, ensure all existing records are cleaned up (done in step 1)
-- Then apply the constraint.
ALTER TABLE public.users ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN full_name SET DEFAULT '';

-- 3. TRIGGER: Improve the auto-signup trigger to handle missing names
-- This trigger automatically creates a users table record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    fallback_name TEXT;
BEGIN
    -- Derive a fallback name from the email
    fallback_name := INITCAP(SPLIT_PART(NEW.email, '@', 1));

    INSERT INTO public.users (id, email, full_name, linkedin_link)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 
            fallback_name
        ),
        COALESCE(NEW.raw_user_meta_data->>'linkedin_link', NULL)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(
            NULLIF(TRIM(EXCLUDED.full_name), ''), 
            NULLIF(TRIM(users.full_name), ''),
            fallback_name
        ),
        linkedin_link = COALESCE(EXCLUDED.linkedin_link, users.linkedin_link),
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- VERIFICATION QUERY
-- ==========================================
-- SELECT id, email, full_name FROM public.users WHERE full_name IS NULL OR full_name = '';
