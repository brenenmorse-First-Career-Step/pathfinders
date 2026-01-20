# 🔧 Fix Resume Creation After Payment

## Problem
- ✅ Photo uploads work
- ❌ Resume doesn't appear after payment
- ❌ No PDF in storage bucket

## Root Cause
The **service role policy** is incorrect. Looking at your policy output:
```json
{
  "policyname": "Service role can manage all resumes",
  "roles": "{public}"  // ❌ WRONG!
}
```

This should be checking for `service_role`, not `public`. This prevents the Stripe webhook from creating resumes.

---

## 🚀 Quick Fix (2 minutes)

### Step 1: Run This SQL Script

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Open file: `sql/COMPLETE-WEBHOOK-FIX.sql`
4. Copy ALL contents
5. Paste into SQL Editor
6. Click **"Run"**

**Expected Output:**
```
✅ WEBHOOK FIX COMPLETE!
✅ Service role policy exists
✅ Storage policies allow service_role
✅ resumes - Public: Yes
✅ resume-assets - Public: Yes
```

### Step 2: Test Payment Again

1. Go through builder (all 6 steps)
2. Upload photo (should work ✅)
3. Go to review page
4. Click "Complete and Pay"
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. Go to `/dashboard/resumes`
8. **Resume should appear within 30 seconds!** ✅

---

## 🔍 What the Fix Does

### Before (Broken)
```sql
-- Policy checks if role is in "{public}" set
-- Service role doesn't match, so INSERT fails
"Service role can manage all resumes"
  roles: "{public}"  ❌
```

### After (Fixed)
```sql
-- Policy explicitly grants permission to service_role
CREATE POLICY "Service role can manage all resumes"
  ON resumes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);  ✅
```

---

## ✅ Verification Checklist

After running the fix:

### Database Level
- [ ] Run `sql/DIAGNOSE-RESUME-ISSUE.sql` 
- [ ] Check Query 5 result - "Service role" policy should show
- [ ] Verify storage buckets exist (Query 6)
- [ ] Check storage policies include service_role (Query 3)

### Application Level
- [ ] Complete a test payment
- [ ] Check Stripe Dashboard > Webhooks > Event logs
- [ ] Webhook should return 200 OK
- [ ] Resume appears in `/dashboard/resumes`
- [ ] PDF downloads successfully
- [ ] Shareable link works

---

## 🐛 Still Not Working?

### Step 1: Run Diagnostic Query
```sql
-- File: sql/DIAGNOSE-RESUME-ISSUE.sql
```

This tells you:
- Are resume records being created?
- Are PDF files in storage?
- Are policies correct?

### Step 2: Check Webhook Logs

**Option A: Stripe Dashboard**
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click your webhook endpoint
3. Go to "Events & logs" tab
4. Find recent `checkout.session.completed` event
5. Check response - should be 200 OK

**Option B: Terminal Logs**
If running `npm run dev`, check terminal for:
```
[INFO] [Payment]: Checkout session completed
[INFO] [Payment]: Resume record created successfully
[INFO] [Payment]: PDF generated and uploaded successfully
```

### Step 3: Common Issues

**Issue: Webhook not being called**
- Solution: Configure webhook in Stripe Dashboard
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`

**Issue: Missing userId in metadata**
- Solution: Make sure user is logged in during checkout
- Check `src/app/checkout/page.tsx` passes userId to Stripe

**Issue: Profile not found**
- Solution: Run `sql/fix-all-issues.sql` to create user records

---

## 📊 Expected Flow After Fix

```
User clicks "Complete and Pay"
  ↓
Stripe Checkout opens
  ↓
User enters card: 4242 4242 4242 4242
  ↓
Payment succeeds ✅
  ↓
Stripe sends webhook → /api/webhooks/stripe
  ↓
Webhook verifies signature ✅
  ↓
Fetches user data from database ✅
  ↓
Creates resume record (NOW WORKS because policy is fixed) ✅
  ↓
Generates PDF from user data ✅
  ↓
Uploads PDF to resumes bucket ✅
  ↓
Updates resume with pdf_url ✅
  ↓
User sees resume in dashboard ✅
```

---

## 📝 Files to Use

| File | Purpose |
|------|---------|
| `sql/COMPLETE-WEBHOOK-FIX.sql` | **RUN THIS FIRST** - Fixes the service role policy |
| `sql/DIAGNOSE-RESUME-ISSUE.sql` | Diagnostic queries to check current state |
| `WEBHOOK-DEBUGGING-GUIDE.md` | Detailed debugging instructions |

---

## 💬 Quick Summary

**The Problem:**
Your service role policy was set to check `roles: "{public}"` instead of `TO service_role`, which prevented the webhook from creating resume records.

**The Solution:**
Run `sql/COMPLETE-WEBHOOK-FIX.sql` to fix the policy, then test payment again.

**Time to Fix:**
~2 minutes (just run the SQL script and test)

**Expected Result:**
Resumes will be created immediately after payment, with PDFs generated within 30 seconds.

---

## 🆘 Need Help?

If it still doesn't work after running the fix:

1. Run `sql/DIAGNOSE-RESUME-ISSUE.sql` and share the results
2. Check Stripe webhook logs and share any errors
3. Share terminal logs from webhook execution
4. See `WEBHOOK-DEBUGGING-GUIDE.md` for detailed troubleshooting

---

**That's it! Run the SQL fix and your resume creation should start working immediately. 🎉**
