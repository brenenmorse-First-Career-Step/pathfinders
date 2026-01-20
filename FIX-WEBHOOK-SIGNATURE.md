# 🔧 Fix "Invalid Signature" Webhook Error

## The Problem

Your Stripe webhook is returning:
```
HTTP status code: 400
{
  "error": "Invalid signature"
}
```

This means the webhook secret in your environment variables **doesn't match** the one in your Stripe dashboard.

---

## ✅ The Fix (5 minutes)

### Step 1: Get the Correct Webhook Secret from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint (the one pointing to your app)
3. Click **"Reveal"** next to "Signing secret"
4. Copy the secret (starts with `whsec_...`)

**Important:** Make sure you're looking at the **TEST MODE** webhook if you're using test keys!

### Step 2: Update Environment Variables

#### If Using Vercel (Production):

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `STRIPE_WEBHOOK_SECRET`
5. Click **Edit**
6. Paste the new webhook secret from Step 1
7. Click **Save**
8. **Redeploy your application** (this is important!)

#### If Using Local Development:

1. Open `.env.local` file
2. Find `STRIPE_WEBHOOK_SECRET`
3. Update it with the secret from Step 1:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET_HERE
   ```
4. **Restart your dev server** (`npm run dev`)

### Step 3: Verify Webhook Endpoint URL

Make sure your Stripe webhook is pointing to the correct URL:

**For Production:**
```
https://firstcareerstepslive.vercel.app/api/webhooks/stripe
```

**For Local Testing (using Stripe CLI):**
```
http://localhost:3000/api/webhooks/stripe
```

**To test locally:**
```bash
# Install Stripe CLI if you haven't
# Then run:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a **local webhook secret** (different from production).

---

## 🔍 How to Check if It's Fixed

### Option 1: Test Payment Again

1. Complete a test payment
2. Go to Stripe Dashboard → Webhooks
3. Check the latest event
4. Should show **200 OK** (not 400)

### Option 2: Check Logs

After updating the secret, check your application logs:

**Vercel:**
- Go to Vercel Dashboard → Your Project → Logs
- Look for: `[Stripe Info] Webhook Verification: Signature verified successfully`

**Local:**
- Check your terminal where `npm run dev` is running
- Should see: `[Stripe Info] Webhook Verification: Signature verified successfully`

---

## 🐛 Common Issues

### Issue 1: Using Wrong Webhook Secret

**Symptom:** Still getting "Invalid signature"

**Solution:**
- Make sure you're using the webhook secret from the **correct webhook endpoint**
- If you have multiple webhooks, use the one that matches your endpoint URL
- Test mode webhooks have different secrets than live mode

### Issue 2: Webhook Secret Not Updated in Vercel

**Symptom:** Updated `.env.local` but production still fails

**Solution:**
- Environment variables in `.env.local` only work locally
- You **must** update them in Vercel Dashboard
- **Redeploy** after updating (Vercel doesn't auto-reload env vars)

### Issue 3: Using Local Secret in Production

**Symptom:** Works locally but fails in production

**Solution:**
- Local webhook secret (from Stripe CLI) only works for local testing
- Production needs the webhook secret from Stripe Dashboard
- Make sure you're using the correct one for each environment

### Issue 4: Webhook Endpoint URL Mismatch

**Symptom:** Webhook not being called at all

**Solution:**
- Check Stripe Dashboard → Webhooks → Your endpoint
- Verify the URL matches your actual deployment URL
- Make sure it's using HTTPS (not HTTP) for production

---

## 📝 Quick Checklist

After updating the webhook secret:

- [ ] Copied webhook secret from Stripe Dashboard
- [ ] Updated `STRIPE_WEBHOOK_SECRET` in Vercel (if production)
- [ ] Updated `STRIPE_WEBHOOK_SECRET` in `.env.local` (if local)
- [ ] Redeployed application (if production)
- [ ] Restarted dev server (if local)
- [ ] Tested payment flow
- [ ] Checked Stripe webhook logs - should show 200 OK
- [ ] Resume appears in dashboard

---

## 🎯 Expected Flow After Fix

```
1. User completes payment ✅
   ↓
2. Stripe sends webhook ✅
   ↓
3. Webhook signature verified ✅ (was failing here)
   ↓
4. Resume record created ✅
   ↓
5. PDF generated ✅
   ↓
6. PDF uploaded to storage ✅
   ↓
7. Resume appears in dashboard ✅
```

---

## 🔐 Security Note

**Never commit webhook secrets to git!**

- ✅ Keep them in `.env.local` (already in `.gitignore`)
- ✅ Store them in Vercel Environment Variables
- ❌ Don't put them in code
- ❌ Don't commit them to GitHub

---

## 🆘 Still Not Working?

If you still get "Invalid signature" after updating:

1. **Double-check the webhook secret:**
   - Copy it again from Stripe Dashboard
   - Make sure there are no extra spaces
   - Make sure it starts with `whsec_`

2. **Check environment variable is loaded:**
   - Add a log: `console.log('Webhook secret exists:', !!process.env.STRIPE_WEBHOOK_SECRET)`
   - Should print `true`

3. **Verify webhook endpoint URL:**
   - In Stripe Dashboard, check the exact URL
   - Make sure it matches your deployment URL exactly

4. **Check if using correct Stripe mode:**
   - Test mode webhooks use test secrets
   - Live mode webhooks use live secrets
   - Make sure they match!

5. **Try creating a new webhook:**
   - In Stripe Dashboard, create a new webhook endpoint
   - Copy the new signing secret
   - Update your environment variable
   - This ensures you have a fresh, correct secret

---

**Once the webhook secret matches, your webhook should work and resumes will be created! 🎉**
