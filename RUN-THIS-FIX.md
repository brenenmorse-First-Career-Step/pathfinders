# 🚀 ONE-FILE FIX - Start Here!

## What Your Screenshot Shows

Your Stripe webhook is returning **400 errors** for all events:
- ❌ `checkout.session.completed` - 400 ERR
- ❌ `payment_intent.succeeded` - 400 ERR
- ❌ All delivery attempts failed

**This means:** The webhook code is running, but it's failing when trying to create the resume record because the service_role doesn't have permission.

---

## ✅ The Fix (1 Minute)

### Step 1: Run ONE SQL File

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Open file: **`sql/FIX-EVERYTHING-ONE-SCRIPT.sql`**
4. Copy **ALL** contents
5. Paste into SQL Editor
6. Click **"Run"**

**You should see:**
```
✅ Fixed: Service role can now create/update resumes
✅ Storage buckets created/updated
✅ Profile photo upload policies created
✅ PDF storage policies created
✅ VERIFIED: Service role policy exists on resumes table
✅ VERIFIED: Both storage buckets exist
✅ VERIFIED: resume-assets policies exist (4 policies)
✅ VERIFIED: resumes bucket policies exist (4 policies)

🎉 ALL FIXES APPLIED SUCCESSFULLY!
```

### Step 2: Test Payment Again

1. Go to your app
2. Complete builder (all 6 steps)
3. Upload photo in Step 6 ✅
4. Click "Complete and Pay"
5. Use card: `4242 4242 4242 4242`
6. Complete payment
7. Go to `/dashboard/resumes`
8. **Resume should appear!** ✅

---

## 🔍 What Changed

### Before (Broken):
- Webhook tries to create resume → **400 Error**
- Service role policy incorrect
- Resume never created
- PDF never generated

### After (Fixed):
- Webhook creates resume → **200 OK** ✅
- Service role has permission
- Resume created immediately
- PDF generates within 30 seconds

---

## ✅ How to Verify It's Fixed

### Check Stripe Webhook:
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Complete a new payment
3. Check new event in webhook logs
4. Should show: **200 OK** (not 400 ERR)

### Check Database:
1. Go to Supabase Dashboard > Table Editor
2. Open `resumes` table
3. You should see your resume record

### Check Dashboard:
1. Go to `/dashboard/resumes`
2. Your resume should be listed
3. PDF should download successfully

---

## 🐛 Still Getting 400 Errors?

If you still see 400 errors after running the fix:

### Check Environment Variables:
Make sure these are set in your `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Check Terminal Logs:
When payment completes, check your terminal for errors:
```
[ERROR] Failed to create resume record
[ERROR] RLS policy violation
```

### Run Diagnostic:
```sql
-- Check if resume was created
SELECT * FROM resumes 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📊 The Complete Flow After Fix

```
1. User pays with Stripe ✅
   ↓
2. Stripe sends webhook event ✅
   ↓
3. Webhook receives event ✅
   ↓
4. Webhook verifies signature ✅
   ↓
5. Webhook creates resume record ✅ (FIXED - was failing here)
   ↓
6. Webhook generates PDF ✅
   ↓
7. Webhook uploads PDF to storage ✅
   ↓
8. Webhook updates resume with PDF URL ✅
   ↓
9. Webhook returns 200 OK ✅
   ↓
10. Resume appears in dashboard ✅
```

---

## 🎯 Why This Fixes the 400 Error

The 400 error happens because:
1. Stripe webhook runs with `service_role` permissions
2. Webhook tries to INSERT into `resumes` table
3. RLS policy was checking `roles: "{public}"` instead of `TO service_role`
4. Permission denied → 400 error returned to Stripe

After the fix:
1. Policy explicitly grants permission `TO service_role`
2. Webhook can INSERT into resumes table
3. Resume created successfully
4. 200 OK returned to Stripe ✅

---

## 📝 Only 1 File Needed

**File:** `sql/FIX-EVERYTHING-ONE-SCRIPT.sql`

This single file fixes:
- ✅ Service role policy (main issue)
- ✅ Storage bucket creation
- ✅ Storage policies for photos
- ✅ Storage policies for PDFs
- ✅ Verifies all fixes applied

**Time:** ~1 minute to run
**Result:** Immediate fix, test payment right after

---

## 🆘 Need Help?

If still not working after running the script:

1. **Share the output** from running the SQL script
2. **Share new Stripe webhook logs** (after the fix)
3. **Check if policy shows service_role:**
   ```sql
   SELECT policyname, roles::text 
   FROM pg_policies 
   WHERE tablename = 'resumes' 
     AND policyname = 'Service role can manage all resumes';
   ```

Expected result:
```
policyname: "Service role can manage all resumes"
roles: "{service_role}"
```

If it still shows `"{public}"`, the policy didn't update correctly.

---

**That's it! Just run that ONE SQL file and your webhook should start working immediately. The 400 errors will become 200 OK responses. 🎉**
