# Webhook Debugging Guide

## Issue Identified

The resume is not being created after payment because:
1. ✅ Photo upload works (fixed)
2. ❌ Resume record NOT being created in database
3. ❌ PDF NOT being generated/uploaded

## Root Cause

The **"Service role can manage all resumes"** policy is incorrectly configured:
- Current: `roles: "{public}"` 
- Should be: `TO service_role`

This prevents the Stripe webhook (which runs with service_role permissions) from creating resume records.

## Fix Steps

### Step 1: Fix the Service Role Policy

Run this SQL script in Supabase SQL Editor:

```sql
-- File: sql/FIX-SERVICE-ROLE-POLICY.sql
```

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `sql/FIX-SERVICE-ROLE-POLICY.sql`
4. Paste and Run
5. Verify you see: ✅ Service role policy fixed!

### Step 2: Diagnose Current State

Run the diagnostic queries to see what's happening:

```sql
-- File: sql/DIAGNOSE-RESUME-ISSUE.sql
```

This will show you:
- Are resume records being created? (probably NO currently)
- Are PDF files in storage? (probably NO currently)
- Are policies correct? (will be after Step 1)

### Step 3: Test Payment Flow Again

1. Go through the builder flow (all 6 steps)
2. Click "Complete and Pay"
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Check `/dashboard/resumes` for your resume

### Step 4: Monitor Webhook Logs

If resume still doesn't appear, check webhook logs:

#### Option A: Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Click "Events & logs" tab
4. Look for recent `checkout.session.completed` events
5. Check if webhook returned 200 OK or error

#### Option B: Supabase Logs (if using Edge Functions)
1. Go to Supabase Dashboard
2. Click "Database" > "Functions"
3. Look for function execution logs
4. Check for errors

#### Option C: Local Development Logs
If running locally:
1. Check your terminal where `npm run dev` is running
2. Look for webhook execution logs:
   ```
   [INFO] [Payment]: Webhook received
   [INFO] [Payment]: Checkout session completed
   [INFO] [Payment]: Resume record created successfully
   [INFO] [Payment]: PDF generated and uploaded successfully
   ```

## Common Issues & Solutions

### Issue 1: Webhook Not Being Called

**Symptoms:**
- No logs in terminal/Stripe dashboard
- Resume record not created at all

**Solutions:**
1. Verify webhook endpoint is configured in Stripe
2. Check webhook secret matches `.env.local`
3. If local dev: Use Stripe CLI to forward webhooks
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Issue 2: Resume Record Created but No PDF

**Symptoms:**
- Resume appears in database (check with diagnostic query)
- `pdf_url` is NULL
- No files in `resumes` storage bucket

**Solutions:**
1. Check storage bucket policies (should allow service_role to INSERT)
2. Check webhook logs for PDF generation errors
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Issue 3: Webhook Returns Error

**Symptoms:**
- Stripe dashboard shows 400/500 error
- Resume not created

**Solutions:**
1. Check the exact error in Stripe webhook logs
2. Common errors:
   - Missing metadata.userId: User not signed in during checkout
   - Profile not found: User record not in database
   - RLS error: Service role policy incorrect (fix with Step 1)

### Issue 4: Payment Successful but Redirect Fails

**Symptoms:**
- Payment goes through
- Stuck on loading/error page
- Resume not visible

**Solutions:**
1. Webhook might be delayed - wait 30 seconds
2. Check if resume record exists with diagnostic query
3. Manually refresh `/dashboard/resumes` page

## Verification Checklist

After applying the fix:

- [ ] Service role policy fixed (roles should be `{service_role}`, not `{public}`)
- [ ] Payment completes successfully
- [ ] Webhook receives `checkout.session.completed` event
- [ ] Resume record created in database with status='paid'
- [ ] PDF generation starts (check logs)
- [ ] PDF uploaded to `resumes` storage bucket
- [ ] Resume record updated with `pdf_url`
- [ ] Resume visible in `/dashboard/resumes`
- [ ] Can download PDF
- [ ] Shareable link works

## Expected Webhook Flow

```
1. User completes payment in Stripe
   ↓
2. Stripe sends webhook to /api/webhooks/stripe
   ↓
3. Verify webhook signature ✅
   ↓
4. Extract userId from session.metadata
   ↓
5. Fetch user profile and data
   ↓
6. Create resume record in database
   👉 THIS FAILS if service role policy is wrong
   ↓
7. Generate PDF from user data
   ↓
8. Upload PDF to resumes bucket
   👉 THIS FAILS if storage policy is wrong
   ↓
9. Update resume record with pdf_url
   ↓
10. Resume appears in dashboard ✅
```

## Debug Commands

### Check if webhook endpoint exists
```bash
curl -I http://localhost:3000/api/webhooks/stripe
# Should return: 405 Method Not Allowed (POST only)
```

### Check Stripe webhook configuration
```bash
stripe webhooks list
# Look for endpoint pointing to your app
```

### Forward webhooks to local dev
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret (whsec_xxx)
# Update STRIPE_WEBHOOK_SECRET in .env.local
```

### Test webhook manually
```bash
stripe trigger checkout.session.completed
```

## Getting More Help

If issues persist:

1. Run diagnostic query and share results
2. Check Stripe webhook logs and share error
3. Check browser console for errors
4. Share terminal logs from webhook execution
5. Verify all environment variables are set correctly

## Quick Test Script

Run this after fixing the policy:

```sql
-- Test if service role can insert into resumes
SET ROLE service_role;

INSERT INTO resumes (
  user_id, 
  title, 
  status, 
  shareable_link, 
  version
) VALUES (
  'YOUR_USER_ID_HERE',
  'Test Resume',
  'paid',
  'test-link-123',
  1
) RETURNING *;

-- If this works, the policy is fixed!
-- Delete the test record:
DELETE FROM resumes WHERE title = 'Test Resume';
```

Replace `YOUR_USER_ID_HERE` with your actual user ID from the auth.users table.
