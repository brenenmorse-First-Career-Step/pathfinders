# Bug Fixes Summary

## Issues Fixed

### 1. Subscription Not Detected ✅
**Problem:** After paying $9, the review page still showed "Subscribe for $9/year" instead of "Generate Resume"

**Root Cause:** 
- Subscription record was not being created in the database
- Webhook `customer.subscription.created` might not have fired or failed

**Fix Applied:**
- Added subscription creation in `checkout.session.completed` as a fallback
- This ensures subscription is created even if `customer.subscription.created` doesn't fire
- Updated customer metadata to always include `userId`

**Files Changed:**
- `src/app/api/webhooks/stripe/route.ts` - Added subscription creation in checkout.session.completed
- `src/lib/stripe.ts` - Updated customer metadata handling
- `src/app/api/check-subscription/route.ts` - Created server-side subscription check endpoint
- `src/app/builder/review/page.tsx` - Updated to use server-side API

### 2. Resume Version Issue 🔍
**Problem:** Only the first resume shows. When deleted and a new one is created, that one shows, but subsequent ones don't appear.

**Debugging Added:**
- Added comprehensive logging to resume fetching
- Added logging to resume creation
- Added resume_created flag for better refresh handling

**Next Steps to Debug:**
1. Check browser console logs when creating resumes
2. Check server logs for resume creation errors
3. Verify database to see if resumes are actually being created
4. Check if there are any database constraints preventing multiple resumes

## How to Debug

### Check Subscription Status:
1. Open browser console (F12)
2. Go to `/builder/review` page
3. Look for "Subscription check response" log
4. Check `allSubscriptions` count - should be > 0 if subscription exists
5. Check `allSubscriptionStatuses` to see subscription statuses

### Check Resume Creation:
1. Open browser console (F12)
2. Create a resume
3. Check for "Fetched resumes" log - shows count and resume details
4. Check server logs for "Resume created successfully" message
5. Verify in Supabase dashboard that resumes are being created

### Check Database:
Run this SQL in Supabase SQL Editor:
```sql
-- Check subscriptions
SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';

-- Check resumes
SELECT id, title, version, status, created_at 
FROM resumes 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;
```

## Testing Checklist

- [ ] Test subscription checkout - verify subscription is created
- [ ] Test subscription check on review page - should show "Generate Resume"
- [ ] Test creating first resume - should appear in dashboard
- [ ] Test creating second resume - should appear in dashboard
- [ ] Test creating third resume - should appear in dashboard
- [ ] Check browser console for any errors
- [ ] Check server logs for webhook events
- [ ] Verify all resumes show correct version numbers

## Why only one resume appears

The database correctly has **one** resume per completed payment. Extra resumes (2nd, 3rd, 4th) are created only when:

1. You have an **active subscription** in the `subscriptions` table.
2. You see **"Generate Resume"** on the review page (not "Subscribe for $9/year").
3. You click **"Generate Resume"**; the create-checkout API then inserts a new row into `resumes` each time.

If `subscriptions` has no row for you (`allSubscriptions: 0`), the app always shows "Subscribe", so you never hit the flow that creates more resumes. Fixing that is done by:

- **New payments:** Subscription is now created in `checkout.session.completed`, so new payers get a row and see "Generate Resume".
- **Existing payment (you):** Run the one-time backfill so your account gets a subscription row. Use the script below.

## One-time fix: backfill your subscription

If you already paid but still see "Subscribe" and only one resume:

1. Open **Stripe Dashboard** → Customers (or Subscriptions).
2. Find your customer/subscription and copy:
   - **Subscription ID** (e.g. `sub_xxxxxxxxxxxxx`)
   - **Customer ID** (e.g. `cus_xxxxxxxxxxxxx`)
3. Open **Supabase** → SQL Editor.
4. Open the file **`backfill-subscription.sql`** in this project.
5. Replace the placeholders with your `user_id`, subscription id, and customer id.
6. Run the script.

After that, reload the builder/review page; you should see **"Generate Resume"**. Each click will create another resume (v2, v3, …) and they will all show on the dashboard.

## Known Issues

1. **Subscription Detection:** If subscription still not detected, check:
   - Stripe Dashboard → Webhooks → Recent events
   - Look for `checkout.session.completed` and `customer.subscription.created`
   - Check if events succeeded or failed
   - Verify webhook endpoint URL is correct

2. **Resume Display:** If resumes not showing:
   - Check browser console for "Fetched resumes" log
   - Verify resumes exist in database
   - Check if resumes have `status = 'paid'`
   - Verify RLS policies allow user to see their resumes
