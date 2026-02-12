-- ============================================
-- BACKFILL SUBSCRIPTION (one-time fix)
-- ============================================
-- Use this if you already paid but have no subscription row,
-- so the app still shows "Subscribe" and you can't create more resumes.
--
-- STEP 1: Get your Stripe subscription details
--   - Stripe Dashboard → Customers → find your customer
--   - Or Stripe Dashboard → Subscriptions → find your subscription
--   Copy: subscription id (sub_xxx), customer id (cus_xxx)
--
-- STEP 2: Replace the placeholders below and run in Supabase SQL Editor
-- ============================================

-- Values for promothrill@gmail.com (payment 28 Jan 2026):
-- user_id: c1360f11-1836-45c1-9947-1c8be0ca7027
-- Subscription ID: sub_1SulhZ2KBKxfQZh7TxfNhT2Z
-- Customer ID: cus_TsWKpnHkutcIQS

INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'c1360f11-1836-45c1-9947-1c8be0ca7027',   -- promothrill@gmail.com
  'sub_1SulhZ2KBKxfQZh7TxfNhT2Z',            -- from Stripe
  'cus_TsWKpnHkutcIQS',                       -- from Stripe
  'active',
  NOW() - INTERVAL '1 day',                  -- period start
  NOW() + INTERVAL '1 year',                  -- period end (1 year from now)
  false
)
ON CONFLICT (stripe_subscription_id) DO UPDATE SET
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- After running: reload the builder/review page; you should see "Generate Resume".
-- Then each click on "Generate Resume" will create a new resume.
