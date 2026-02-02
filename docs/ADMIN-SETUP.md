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

### Create admin user via SQL (no app signup)

1. **Run the role migration** (if you haven’t already)
   - In Supabase SQL Editor, run `sql/admin-migration-role-blocked.sql`.
   - That adds `role` and `blocked_at` to `public.users`.

2. **Create the admin user in the database**
   - In Supabase SQL Editor, run `sql/create-admin-user.sql`.
   - That script creates the user in **auth.users**, **auth.identities**, and **public.users** with:
     - Email: **admin@email.com**
     - Password: **Admin123**
     - Role: **admin**
   - No signup through the app is required.

3. **Log in to the admin panel**
   - Go to `https://firstcareersteps.com/admin/login`
   - Sign in with **admin@email.com** and **Admin123**.

### If the SQL script fails (e.g. permission denied on auth.users)

- Create the user in **Supabase Dashboard**: Authentication → Users → **Add user** → Email: **admin@email.com**, Password: **Admin123**.
- Then in SQL Editor run:
  ```sql
  -- Replace USER_ID_HERE with the user id from Dashboard (Authentication → Users)
  INSERT INTO public.users (id, email, full_name, role)
  VALUES ('USER_ID_HERE', 'admin@email.com', 'Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ```

### If the account exists but you forgot the password

- In **Supabase Dashboard**: Authentication → Users → find **admin@email.com** → use “Send password recovery” or set a new password.
- Then use that password on `/admin/login`.
