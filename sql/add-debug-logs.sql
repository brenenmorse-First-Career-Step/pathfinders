-- ============================================
-- DEBUG LOGGING TABLE
-- ============================================
-- Create a table to capture server-side logs in Supabase
-- for easier debugging of webhooks and background tasks.

CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL,
    category TEXT,
    message TEXT,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

-- Allow service_role to manage logs (webhooks use service_role)
DROP POLICY IF EXISTS "Service role can manage debug_logs" ON public.debug_logs;
CREATE POLICY "Service role can manage debug_logs" ON public.debug_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to view logs (for manual check by user if needed)
DROP POLICY IF EXISTS "Users can view logs" ON public.debug_logs;
CREATE POLICY "Users can view logs" ON public.debug_logs
    FOR SELECT TO authenticated USING (true);

DO $$ BEGIN
  RAISE NOTICE '✅ debug_logs table created with RLS policies';
END $$;
