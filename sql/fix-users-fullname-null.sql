-- ============================================
-- FIX: REMOVE ACCIDENTAL NOT NULL CONSTRAINT
-- ============================================
-- The users table on the live database somehow has a NOT NULL
-- constraint on full_name which doesn't match our schema records.
-- This script ensures the column can accept NULL values.

ALTER TABLE public.users 
  ALTER COLUMN full_name DROP NOT NULL;

-- Also ensure date_created has a default (it should, but just in case)
ALTER TABLE public.users 
  ALTER COLUMN date_created SET DEFAULT NOW();

-- Also ensure role exists and has a default
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

DO $$ BEGIN
  RAISE NOTICE '✅ users table schema synchronized (full_name is now nullable)';
END $$;
