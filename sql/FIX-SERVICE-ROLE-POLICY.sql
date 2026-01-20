-- ============================================
-- FIX SERVICE ROLE POLICY FOR RESUMES TABLE
-- ============================================
-- The issue: "Service role can manage all resumes" policy
-- is checking roles as "{public}" instead of checking auth.role()
-- This prevents the webhook from creating/updating resumes
-- ============================================

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Service role can manage all resumes" ON resumes;

-- Recreate with correct implementation
-- This policy allows the service role (webhook) to bypass RLS
CREATE POLICY "Service role can manage all resumes"
ON resumes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'resumes'
ORDER BY policyname;

-- ============================================
-- EXPLANATION
-- ============================================
-- The old policy was created with USING (auth.role() = 'service_role')
-- which gets evaluated as a row-level check, not a role check.
-- The new policy uses TO service_role which properly grants
-- permission to the service role JWT token used by the webhook.
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Service role policy fixed!';
  RAISE NOTICE '✅ Webhook can now create/update resumes';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next step: Test the payment flow again';
END $$;
