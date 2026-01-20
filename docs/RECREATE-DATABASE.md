# Recreate Database - Fresh Start

This guide will help you recreate your Supabase database with the correct schema.

## ⚠️ WARNING
**This will DELETE ALL existing data!** Only run this if you want a fresh start with no user data.

## Steps to Recreate Database

### 1. Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### 2. Run the Recreation Script
1. Open the file: `sql/recreate-database-fresh.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **RUN** (or press Ctrl+Enter)

### 3. Verify Database Structure (Optional)
1. Open the file: `sql/check-database-structure.sql`
2. Copy and paste into SQL Editor
3. Click **RUN** to see all tables, columns, and policies

## What Gets Created

### Tables:
- ✅ `users` - User accounts (extends auth.users)
- ✅ `profile` - User profile data (all builder steps)
- ✅ `experiences` - Work/volunteer/project experiences
- ✅ `certifications` - User certifications
- ✅ `resumes` - Resume records with payment status
- ✅ `user_payments` - Payment tracking

### Features:
- ✅ All required columns for builder steps
- ✅ Row Level Security (RLS) enabled
- ✅ RLS policies for all tables
- ✅ Indexes for performance
- ✅ Foreign key constraints

## After Running the Script

1. **Test the builder:**
   - Sign in to your app
   - Go to `/builder/step-1`
   - Fill out the form and click "Next"
   - Should now work without errors!

2. **Check for errors:**
   - Open browser console (F12)
   - Look for any database errors
   - If you see errors, check the table structure matches the code

## Troubleshooting

### If you get permission errors:
- Make sure you're logged into Supabase as the project owner
- Check that RLS policies are created correctly

### If tables still don't work:
1. Run `sql/check-database-structure.sql` to see what exists
2. Compare with the expected schema in `sql/recreate-database-fresh.sql`
3. Manually fix any differences

## Need Help?

If the database recreation doesn't work:
1. Check Supabase logs for errors
2. Verify all environment variables are set correctly
3. Make sure you have the correct Supabase project selected
