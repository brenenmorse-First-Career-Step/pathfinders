# Admin Panel Setup

## 1. Fix 404 on /admin

- **Deploy the latest code** that includes the `src/app/admin/` folder. If your site (e.g. firstcareersteps.com) is deployed from a different repo or branch than where you pushed the admin panel, redeploy from the repo/branch that has the admin code.
- Middleware now redirects `/admin` and `/admin/` to `/admin/login` (when not signed in) or `/admin/dashboard` (when signed in as admin), so you should not hit a 404 for `/admin` once the new code is deployed.

## 2. Fix "Invalid email or password" on admin login

Supabase returns **"Invalid login credentials"** when the email/password do not exist in **Supabase Auth** (not just in the `public.users` table).

The SQL migration only runs:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@email.com';
```

That updates **public.users** for an existing row. It does **not** create the user in **Supabase Auth**. You must have an Auth user first.

### Correct order

1. **Create the admin account in Supabase Auth**
   - Go to your app’s **Sign up** page: `https://firstcareersteps.com/signup`
   - Sign up with:
     - Email: **admin@email.com**
     - Password: **Admin123**
   - This creates the user in **auth.users** and (via your app) in **public.users**.

2. **Then run the migration** (if you haven’t already)
   - In Supabase SQL Editor, run `sql/admin-migration-role-blocked.sql`.
   - That adds `role` and `blocked_at` and runs:
     - `UPDATE users SET role = 'admin' WHERE email = 'admin@email.com';`

3. **Log in to the admin panel**
   - Go to `https://firstcareersteps.com/admin/login`
   - Sign in with **admin@email.com** and **Admin123**.

### If you already ran the migration before signing up

- Sign up at `/signup` with **admin@email.com** and **Admin123**.
- Then run only the backfill in Supabase SQL Editor:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'admin@email.com';
  ```

### If the account exists but you forgot the password

- In **Supabase Dashboard**: Authentication → Users → find **admin@email.com** → use “Send password recovery” or set a new password.
- Then use that password on `/admin/login`.
