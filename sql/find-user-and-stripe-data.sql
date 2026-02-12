-- ============================================
-- FIND USER DATA (run in Supabase SQL Editor)
-- ============================================
-- This shows your app users and their resumes.
-- Use the user_id when running backfill-subscription.sql.
--
-- WHERE TO GET STRIPE IDs (not in your DB):
-- 1. Stripe Dashboard → Customers → click customer (e.g. promothrill@gmail.com)
--    → Copy "Customer ID" (cus_xxxxxxxxxxxxx)
-- 2. Same customer page → Subscriptions tab, or:
--    Stripe Dashboard → Subscriptions → find the subscription
--    → Copy "Subscription ID" (sub_xxxxxxxxxxxxx)
-- ============================================

-- 1. List all users with email and id
SELECT 
  id AS user_id,
  email,
  full_name,
  date_created
FROM users
ORDER BY date_created DESC;

-- 2. List users who have resumes (paid)
SELECT 
  u.id AS user_id,
  u.email,
  u.full_name,
  r.id AS resume_id,
  r.title,
  r.version,
  r.status,
  r.created_at AS resume_created_at
FROM users u
JOIN resumes r ON r.user_id = u.id
WHERE r.status = 'paid'
ORDER BY u.email, r.created_at DESC;

-- 3. Check if any user already has a subscription
SELECT 
  s.user_id,
  u.email,
  u.full_name,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.status AS subscription_status,
  s.current_period_end
FROM subscriptions s
JOIN users u ON u.id = s.user_id
ORDER BY s.updated_at DESC;

-- 4. One user: who has "Anas Resume" (your case)
SELECT 
  u.id AS user_id,
  u.email,
  u.full_name,
  r.id AS resume_id,
  r.title,
  r.version,
  r.status
FROM users u
JOIN resumes r ON r.user_id = u.id
WHERE r.title ILIKE '%Anas%'
ORDER BY r.created_at DESC;
