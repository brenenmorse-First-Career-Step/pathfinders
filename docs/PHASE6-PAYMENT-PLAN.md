# Phase 6: Stripe Payment Integration - Implementation Plan

## Overview
Implement Stripe payment integration to allow users to unlock their resumes after completing the builder. When a user clicks "Unlock Resume - $9.99", they'll be taken to Stripe Checkout, and upon successful payment, the resume status will be updated to 'paid'.

---

## ✅ Prerequisites Already Met

You already have Stripe configured in `.env.local`:
- ✅ `STRIPE_SECRET_KEY` (LIVE mode)
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (LIVE mode)
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL`

**Note:** You're using LIVE keys, so real payments will be processed!

---

## Implementation Steps

### Step 1: Install Stripe SDK

Run manually:
```bash
npm install stripe @stripe/stripe-js
```

### Step 2: Create Stripe Client Library

**File:** `src/lib/stripe.ts`

### Step 3: Create Checkout API Endpoint

**File:** `src/app/api/create-checkout/route.ts`

This endpoint will:
- Accept resume_id as parameter
- Verify user owns the resume
- Create a Stripe Checkout session for $9.99
- Return the session URL for redirect

### Step 4: Create Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

This endpoint will:
- Verify webhook signature
- Handle `checkout.session.completed` event
- Update resume status to 'paid'
- Generate shareable link

### Step 5: Create Checkout Page

**File:** `src/app/checkout/page.tsx`

Redirects user to Stripe Checkout

### Step 6: Create Success Page

**File:** `src/app/checkout/success/page.tsx`

Shows success message and links to My Resumes

### Step 7: Create Cancel Page

**File:** `src/app/checkout/cancel/page.tsx`

Shows cancellation message

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── create-checkout/
│   │   │   └── route.ts          # Create Stripe session
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts      # Handle payment events
│   └── checkout/
│       ├── page.tsx              # Redirect to Stripe
│       ├── success/
│       │   └── page.tsx          # Payment success
│       └── cancel/
│           └── page.tsx          # Payment cancelled
└── lib/
    └── stripe.ts                 # Stripe client initialization
```

---

## Security Considerations

1. **Webhook Signature Verification** - Always verify Stripe webhook signatures
2. **User Authorization** - Verify user owns the resume before creating checkout
3. **Idempotency** - Handle duplicate webhook events
4. **Environment Variables** - Never expose secret keys in client-side code

---

## Testing

### With Stripe Test Mode (Recommended First)
1. Use test keys (pk_test_... and sk_test_...)
2. Use test card: `4242 4242 4242 4242`
3. Any future date for expiry
4. Any 3 digits for CVC

### With Stripe CLI (for webhooks)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Success Criteria

- [ ] User can click "Unlock Resume" and be redirected to Stripe Checkout
- [ ] Payment of $9.99 is processed successfully
- [ ] Resume status updates from 'locked' to 'paid' after payment
- [ ] Success page shows confirmation
- [ ] Cancel page shows appropriate message
- [ ] Webhook handler processes events correctly

---

## Next Steps

1. Install Stripe SDK: `npm install stripe @stripe/stripe-js`
2. Create all the files listed above
3. Test with Stripe test mode first
4. Configure webhook endpoint in Stripe Dashboard
5. Test payment flow end-to-end
6. Deploy to Vercel
7. Update webhook URL in Stripe Dashboard to production URL

---

**Estimated Time:** 2-3 hours
**Complexity:** Medium
**Status:** Ready to implement (Stripe keys already configured!)
