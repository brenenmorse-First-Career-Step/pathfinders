# Phase 7 PDF Generation - Deployment Checklist

## ⚠️ IMPORTANT: Supabase Storage Setup Required

Before testing, you MUST create a storage bucket in Supabase:

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `resumes`
   - **Public**: ✅ **Yes** (so users can download PDFs)
   - **File size limit**: 10 MB (optional)
   - **Allowed MIME types**: `application/pdf` (optional)
5. Click **"Create bucket"**

### 2. Set Bucket Policies (Optional but Recommended)

Add these policies for security:

```sql
-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to all resumes
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');
```

---

## Deployment Steps

### 1. Commit Changes

```bash
git add .
git commit -m "Phase 7: Implement PDF generation with ATS-friendly template"
git push
```

### 2. Deploy to Vercel

```bash
vercel --prod
```

### 3. Test the Flow

1. **Complete the builder** (all steps)
2. **Go to review page**
3. **Click "Complete & Pay - $9.99"**
4. **Use test card**: `4242 4242 4242 4242`
5. **Complete payment**
6. **Check success page** - should show "Payment Successful!"
7. **Go to Dashboard → My Resumes**
8. **Verify**:
   - Resume shows "Paid & Ready" status
   - "Download PDF" button appears
   - "Copy Link" button appears
9. **Click "Download PDF"** - PDF should download
10. **Open PDF** - Verify it contains your data

---

## Files Created

- ✅ `src/lib/pdf/templates/professional.tsx` - ATS-friendly PDF template
- ✅ `src/lib/pdf/generator.ts` - PDF generation utilities

## Files Modified

- ✅ `src/app/api/webhooks/stripe/route.ts` - Added PDF generation
- ✅ Dashboard already has download button (no changes needed)

---

## Troubleshooting

### PDF Not Generating?

1. **Check Vercel logs** for errors
2. **Check webhook logs** in Stripe Dashboard
3. **Verify storage bucket exists** and is public
4. **Check Supabase logs** for upload errors

### Download Button Not Showing?

1. **Refresh the dashboard page**
2. **Check if `pdf_url` is set** in the resumes table
3. **Verify resume status is 'paid'**

### PDF Content Issues?

1. **Check if profile data exists** (headline, about, skills)
2. **Check if experiences exist**
3. **Verify data in Supabase tables**

---

## Next Steps After Testing

Once everything works:

1. ✅ **Switch to LIVE Stripe keys** (if not already)
2. ✅ **Test with real payment** (small amount)
3. ✅ **Share with beta users**
4. 🎉 **Launch!**

---

## Phase 8 Ideas (Future)

- LinkedIn content generation
- Multiple PDF templates
- Resume editing after payment
- Email delivery of PDF
- Resume analytics
