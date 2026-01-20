# Test Payment Flow

## Steps to test if webhook is working:

### 1. Check Stripe Webhook Configuration

Go to: https://dashboard.stripe.com/webhooks

Verify:
- Webhook URL: `https://firstcareerstepslive.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed` is selected
- Status: Active

### 2. Test Payment Flow

1. Go to dashboard: https://firstcareerstepslive.vercel.app/dashboard/resumes
2. Click "Unlock Resume ($9.99)"
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
4. Complete payment

### 3. Check Vercel Logs

Go to: https://vercel.com/your-project/deployments

Look for these logs:
```
✅ EXPECTED:
- "Webhook endpoint hit"
- "Checkout session completed"
- "Processing payment for user"
- "Updating all locked resumes to paid status"
- "Updated all locked resumes to paid status" with updatedCount > 0

❌ IF MISSING:
- Webhook not receiving events
- Check Stripe webhook URL configuration
```

### 4. Check Resume Status

After payment, the resume should:
- Show "Ready to Download" badge
- Have a "Download PDF" button
- Status in database should be "paid"

## Common Issues

### Issue: Webhook not receiving events

**Solution:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook
3. Check "Recent deliveries"
4. If no deliveries, the URL is wrong or webhook is disabled

### Issue: Webhook receiving events but failing

**Check Vercel logs for errors:**
- RLS policy errors → Run SQL script in docs/FIX-RESUMES-RLS-ISSUE.md
- User not found → Check userId in metadata
- Resume not found → Check resumeId in metadata

### Issue: Resume still showing "locked" after payment

**Possible causes:**
1. Webhook didn't process (check Vercel logs)
2. RLS policies blocking update (run SQL fix)
3. `user_payments` table not updated (check database)

## Debug SQL Queries

Check if webhook updated the resume:

```sql
-- Check resume status
SELECT id, title, status, stripe_session_id, updated_at
FROM resumes
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Check payment record
SELECT user_id, has_paid, paid_at, stripe_payment_intent_id
FROM user_payments
WHERE user_id = 'YOUR_USER_ID';

-- Check if RLS policies allow updates
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'resumes' AND cmd = 'UPDATE';
```

## Expected Database State After Payment

### Before Payment:
```json
{
  "resume": {
    "status": "locked",
    "stripe_session_id": null
  },
  "user_payment": null
}
```

### After Payment:
```json
{
  "resume": {
    "status": "paid",
    "stripe_session_id": "cs_test_..."
  },
  "user_payment": {
    "has_paid": true,
    "paid_at": "2026-01-20T..."
  }
}
```
