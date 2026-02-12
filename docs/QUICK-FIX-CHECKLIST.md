# 🚀 Quick Fix Checklist

## Critical Issues Fixed
- ❌ Photo upload failing (RLS error)
- ❌ Resume not created after payment

---

## ✅ Step-by-Step Fix (5 minutes)

### 1️⃣ Run SQL Script in Supabase
- [ ] Open [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Click **SQL Editor** in left menu
- [ ] Open file: `sql/FINAL-FIX-ALL-STORAGE-ISSUES.sql`
- [ ] Copy ALL contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click **"Run"** button
- [ ] Wait for ✅ Success message

**Expected Output:**
```
✅ ALL STORAGE ISSUES FIXED!
✅ resume-assets bucket: Created and configured
✅ resumes bucket: Created and configured
```

---

### 2️⃣ Verify Storage Buckets Created
- [ ] In Supabase Dashboard, go to **Storage**
- [ ] Verify `resume-assets` bucket exists (Public: ✅)
- [ ] Verify `resumes` bucket exists (Public: ✅)

---

### 3️⃣ Restart Dev Server
- [ ] Stop your dev server (Ctrl+C)
- [ ] Run `npm run dev` again
- [ ] Wait for server to start

---

### 4️⃣ Test Photo Upload (Step 6)
- [ ] Go to `http://localhost:3000/builder/step-6`
- [ ] Click to upload a photo
- [ ] Photo uploads ✅ (no errors)
- [ ] Browser console shows NO red 400 errors
- [ ] Photo preview appears

**If it fails:** Check browser console for errors and verify SQL script ran successfully.

---

### 5️⃣ Test Complete Payment Flow
- [ ] Complete all builder steps (1-6)
- [ ] Go to review page
- [ ] Click "Complete and Pay"
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Any future date for expiry
- [ ] Any 3 digits for CVC
- [ ] Any 5 digits for ZIP
- [ ] Complete payment ✅

---

### 6️⃣ Verify Resume Created
- [ ] After payment, redirected to success page ✅
- [ ] Click "View My Resume" or go to `/dashboard/resumes`
- [ ] Resume appears in list ✅
- [ ] Wait 30 seconds for PDF generation
- [ ] PDF URL appears (not "Generating...") ✅
- [ ] Click "Download PDF" - PDF downloads ✅

---

## 🎉 Success Indicators

If all these work, you're done!
- ✅ Photo uploads without errors
- ✅ Resume record created after payment
- ✅ PDF generated and downloadable
- ✅ Shareable link works

---

## ❌ Troubleshooting

### Photo Upload Still Fails
1. Check browser console for exact error
2. Verify you're logged in
3. Run SQL script again
4. Check Supabase Storage > resume-assets > Policies tab

### Resume Not Created
1. Check Supabase Dashboard > Database > Edge Functions > Logs
2. Look for webhook execution errors
3. Verify `resumes` bucket exists and is public
4. Check if resume record exists but pdf_url is null

### PDF URL is Null After 1 Minute
1. Check webhook logs in Supabase
2. Look for "PDF generation failed" messages
3. Verify `resumes` bucket policies exist
4. Check service role has upload permissions

---

## 📚 Detailed Documentation

For more details, see:
- `FIX-INSTRUCTIONS.md` - Detailed step-by-step guide
- `ISSUE-RESOLUTION-SUMMARY.md` - Technical deep-dive
- `sql/FINAL-FIX-ALL-STORAGE-ISSUES.sql` - The fix script

---

## ⚡ Quick Reference

### Test Card for Stripe
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Storage Buckets Required
- `resume-assets` - For profile photos (Step 6)
- `resumes` - For PDF storage (After payment)

### Key URLs to Test
- Photo Upload: `/builder/step-6`
- Review: `/builder/review`
- Payment: `/checkout`
- Success: `/checkout/success`
- Dashboard: `/dashboard/resumes`

---

**That's it! The fix should take ~5 minutes to apply and test. 🚀**
