# Admin Panel – Architecture Plan

This document describes the **architecture and plan** for the FirstCareerSteps admin panel. It is for review only; implementation will start after you approve.

---

## 1. Goals

- **User management**: Full CRUD, block/unblock, delete users.
- **Resumes management**: List, filter, view, and delete resumes created by users.
- **Roadmaps management**: List, filter, view, and delete career roadmaps created by users.
- **Payment & analytics dashboard**: Revenue collected, payment success/failure, user and payment analytics in one place.
- **Admin settings**: Email configuration (Resend.com) for transactional emails (verification, invoice, ban, delete, etc.).
- **Security**: Only designated admins can access the panel; all actions are auditable where useful.

---

## 2. Tech Context (Existing)

| Layer        | Stack                          |
|-------------|---------------------------------|
| Framework   | Next.js 15 (App Router)         |
| Auth/DB     | Supabase (Auth + Postgres)      |
| Payments    | Stripe                          |
| Styling     | Tailwind CSS                    |
| Email       | Resend.com (transactional: verification, invoice, ban, delete) – to be integrated |
| Privileged  | `createAdminClient()` (service role) already used in API routes |

**Relevant tables**: `users`, `profile`, `experiences`, `resumes`, `career_roadmaps`, `subscriptions`.  
**No admin/role concept yet** – we will add it as below.  
**Payment analytics**: Revenue and success/failure data come from Stripe API (checkout sessions, payment intents) and/or `subscriptions`; admin dashboard and payments list will use these sources.

---

## 3. Admin Access Model

### 3.1 Separate URL and separate users (required)

- **Separate URL**: The admin panel lives entirely under **`/admin`**. All admin UI and flows use this base path (e.g. `/admin`, `/admin/login`, `/admin/dashboard`). The main app stays under `/`, `/dashboard`, `/login`, etc. No mixing of admin and regular routes.

- **Separate users for admin**:  
  - Admins are **separate user accounts** in the system: same `users` table, but with `role = 'admin'` (or `is_admin = true`).  
  - **Admin login**: Admins sign in at **`/admin/login`** only. Regular users sign in at `/login` and never see the admin panel.  
  - **No public admin signup**: Admin accounts are not created via a public form. They are created by another admin (future “Invite admin” in admin panel) or by backfill/DB (e.g. set `role = 'admin'` for a known user ID/email).  
  - **Access rules**:  
    - If a **regular user** (role = 'user') goes to `/admin` or `/admin/login` and signs in → show “Unauthorized” or redirect to main app (`/dashboard`).  
    - If an **admin user** (role = 'admin') signs in at `/admin/login` → allow access to `/admin/*`.  
    - Unauthenticated visits to any `/admin/*` (except `/admin/login`) → redirect to `/admin/login`.

This keeps admin URL space and admin identity clearly separate from the main product.

### 3.2 Admin identity in the database

**Option A – Admin flag on `users` (recommended)**  
- Add column: `users.role` (e.g. `'user' | 'admin'`) or `users.is_admin BOOLEAN`.  
- One source of truth; easy to check in middleware and API.  
- Admin users are distinct rows in `users` with elevated role (same table, different role).

**Option B – Allowlist in env (optional extra)**  
- e.g. `ADMIN_EMAILS=admin@example.com,other@example.com`.  
- Can be used in addition to Option A (e.g. only these emails can ever be admin).  
- Less flexible if used alone (redeploy to add/remove admins).

**Recommendation**: Start with **Option A** (`users.role` or `is_admin`). Use **separate URL `/admin`** and **dedicated admin login at `/admin/login`**; only users with `role = 'admin'` can access `/admin/*`.

---

## 4. Database Changes

### 4.1 Users table

- Add **`role`** TEXT: `'user'` (default) or `'admin'`.  
  **Or** add **`is_admin`** BOOLEAN DEFAULT false.  
- Optional: **`blocked_at`** TIMESTAMP (null = not blocked). When set, app and API treat user as blocked (no login / no access to protected features).

### 4.2 RLS and service role

- Keep RLS on all tables.
- Admin operations will run via **API routes** that use **`createAdminClient()`** (service role), so RLS is bypassed only in those server-side routes after we verify the **current request is from an admin** (see below).  
- No need to add RLS policies like “admins can see all rows”; admin logic stays in app/API layer.

### 4.3 Migration script (conceptual)

- `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user','admin'));`
- Optional: `ALTER TABLE users ADD COLUMN blocked_at TIMESTAMPTZ;`
- Backfill: set one or more users to `role = 'admin'` (or `is_admin = true`) by email/ID.

### 4.4 Optional: Admin settings (e.g. email / Resend)

- **Env-only**: Resend API key and from email in `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (and optional `RESEND_FROM_NAME`). No DB table needed.  
- **DB option**: Table `admin_settings` (key TEXT PRIMARY KEY, value JSONB) for from email, from name, and per-email-type toggles (e.g. `email_verification_enabled`, `email_invoice_enabled`, `email_ban_enabled`, `email_delete_enabled`). Allows changing these from admin UI without redeploy.  
- **Recommendation**: Start with env for API key and from address; add `admin_settings` later if you want toggles and editable from address in UI.

---

## 5. Route & Middleware Architecture

### 5.1 URL layout

All admin UI and API live under the **separate base path `/admin`** (see §3.1). Main app stays on `/`; admins use only `/admin` and `/admin/login`.

| Path | Purpose |
|------|--------|
| `/admin` | Redirect to `/admin/dashboard` (or to `/admin/login` if not authenticated or not admin) |
| `/admin/login` | **Dedicated admin login** – only for admin users; after sign-in, only users with `role = 'admin'` can proceed to `/admin/*`; regular users get “Unauthorized” or redirect to main app |
| `/admin/dashboard` | Analytics dashboard: user stats, payment stats, revenue, recent activity |
| `/admin/users` | User list + CRUD |
| `/admin/users/[id]` | User detail, edit, block, delete |
| `/admin/resumes` | Resumes list (all users) |
| `/admin/resumes/[id]` | Resume detail, delete |
| `/admin/roadmaps` | Roadmaps list (all users) |
| `/admin/roadmaps/[id]` | Roadmap detail, delete |
| `/admin/payments` | Payment list, success/failed, revenue breakdown (optional dedicated page or part of dashboard) |
| `/admin/settings` | Admin settings: email (Resend) configuration, from address, etc. |

API routes (all under `/api/admin/`):

| Method + Path | Purpose |
|---------------|--------|
| `GET /api/admin/users` | List users (paginated, search, filters) |
| `GET /api/admin/users/[id]` | Get one user + profile + counts (resumes, roadmaps, subscription) |
| `PATCH /api/admin/users/[id]` | Update user (e.g. full_name, email, role, blocked_at) |
| `DELETE /api/admin/users/[id]` | Delete user (cascade to profile, experiences, resumes, roadmaps, subscription; optionally Supabase Auth delete) |
| `POST /api/admin/users/[id]/block` | Set blocked_at |
| `POST /api/admin/users/[id]/unblock` | Clear blocked_at |
| `GET /api/admin/resumes` | List resumes (paginated, filter by user_id, status) |
| `GET /api/admin/resumes/[id]` | Get one resume |
| `DELETE /api/admin/resumes/[id]` | Delete resume |
| `GET /api/admin/roadmaps` | List roadmaps (paginated, filter by user_id) |
| `GET /api/admin/roadmaps/[id]` | Get one roadmap |
| `DELETE /api/admin/roadmaps/[id]` | Delete roadmap |
| `GET /api/admin/analytics` | Dashboard analytics: user counts, revenue, payment success/fail, recent payments |
| `GET /api/admin/payments` | List payments (from Stripe or local log); filter by status, date range |
| `GET /api/admin/settings` | Get admin settings (e.g. email config for UI) |
| `PATCH /api/admin/settings` | Update admin settings (e.g. Resend from email, enable/disable email types) |

### 5.2 Protecting admin routes

- **Middleware**  
  - For paths starting with **`/admin`** (and optionally `/api/admin`):  
    - **Allow `/admin/login`** for everyone (so admins can sign in).  
    - For all other `/admin/*` routes: if not authenticated → redirect to **`/admin/login`** (not the main app `/login`).  
    - If authenticated, load user from DB (using server client) and check `role === 'admin'` (or `is_admin`).  
    - If not admin → 403 or redirect to main app (e.g. `/dashboard`) so regular users never see admin content.  
  - Use **service role only in API routes**, not in middleware; middleware uses the normal server Supabase client and fetches `users.role` for the current `auth.uid()`.

- **Admin login flow**  
  - Login form at `/admin/login` uses the same Supabase Auth (email/password) as the main app, but after successful sign-in the app checks `users.role`. If `role !== 'admin'`, do not allow access: sign out or show “Unauthorized – admin access only” and redirect to `/` or `/login`. If `role === 'admin'`, redirect to `/admin` or `/admin/dashboard`.

- **API routes**  
  - In each `/api/admin/*` route:  
    1. Get session (e.g. `createServerClient()` + `getUser()`).  
    2. With service role client, get that user’s `role` from `users`.  
    3. If not admin → return 403.  
    4. Else run the admin action using **createAdminClient()** for all DB writes/reads that need to see other users’ data.

This way, only admins can open admin pages and call admin APIs; all privileged DB access is server-side and after an explicit admin check.

---

## 6. Feature Breakdown

### 6.1 User management (CRUD + block/delete)

- **List**  
  - Table: email, full_name, role, blocked_at, date_created, counts (resumes, roadmaps), subscription status.  
  - Search by email/name; pagination (e.g. 20 per page).

- **Create**  
  - Optional: “Invite user” (create auth user + row in `users`) if you want; otherwise skip for v1.

- **Read**  
  - Single user: `users` + `profile` + count of resumes, roadmaps, and subscription status (from `subscriptions`).  
  - Optionally list latest 5 resumes and 5 roadmaps on the same page.

- **Update**  
  - Edit: full_name, email (if you sync with Supabase Auth), role (user/admin), and optionally linkedin_link.  
  - Block: set `blocked_at`; optionally call Supabase Auth admin to ban user so they cannot sign in.  
  - Unblock: clear `blocked_at` and unban in Auth if you use ban.

- **Delete**  
  - Soft delete: set a `deleted_at` and exclude from normal app (optional).  
  - Hard delete: delete row in `users` (cascade will remove profile, experiences, resumes, roadmaps, subscription); optionally delete the user from Supabase Auth so they cannot log in again.

- **App behavior for blocked users**  
  - In middleware or layout: if `users.blocked_at` is set for current user, redirect to a “Account suspended” page and do not allow access to dashboard/builder/resumes/roadmaps.

### 6.2 Resumes management

- **List**  
  - All resumes (using admin client): id, user_id, user email/name, title, status, created_at, shareable_link.  
  - Filters: by user (email/id), status (draft/locked/paid).  
  - Pagination.

- **View**  
  - Resume metadata + link to PDF if `pdf_url` exists; optional embed or link to public share URL if available.

- **Delete**  
  - Delete row in `resumes`; optionally remove file from storage if you store PDFs in Supabase Storage.

### 6.3 Roadmaps management

- **List**  
  - All career_roadmaps: id, user_id, user email/name, career_name, created_at.  
  - Filter by user; pagination.

- **View**  
  - Full `roadmap_data` (JSON), infographic_url, milestone_roadmap_url.

- **Delete**  
  - Delete row in `career_roadmaps`; optionally remove assets from storage.

### 6.4 Payment & analytics dashboard

- **Dashboard home (`/admin/dashboard`)**  
  - **User system analytics**: Total users, new signups (e.g. last 7/30 days), active vs blocked count, total resumes, total roadmaps.  
  - **Payment system analytics**:  
    - Total revenue collected (from Stripe or derived from `subscriptions` + checkout sessions).  
    - Successful vs failed payment counts (successful checkouts, failed attempts if tracked).  
    - Revenue over time (e.g. last 7/30/90 days) – optional chart.  
  - **Recent activity**: Latest payments (user email, amount, status, date), latest signups, latest blocked/deleted actions (if logged).

- **Payments list (`/admin/payments`)**  
  - Table: date, user (email/id), amount, currency, status (success / failed / refunded), Stripe session/payment ID, link to user.  
  - Filters: date range, status, user.  
  - Data source: Stripe API (list payment intents or checkout sessions) and/or local `subscriptions` + any payment log table if you store one.

- **Success vs failure**  
  - Each payment row shows status (success/failed).  
  - Optional: aggregate cards on dashboard – “Payments successful (count)”, “Payments failed (count)”, “Total collected (amount)”.

### 6.5 Admin settings (including email / Resend)

- **Settings page (`/admin/settings`)**  
  - **Email settings** (Resend.com):  
    - **API key**: Stored in env `RESEND_API_KEY`; settings UI can show “Configured” / “Not set” (never expose full key in UI).  
    - **From address**: e.g. `noreply@yourdomain.com` or Resend verified domain – configurable in settings (store in env `RESEND_FROM_EMAIL` or in DB `admin_settings`).  
    - **From name**: Optional display name (e.g. “FirstCareerSteps”).  
    - **Enable/disable per email type**: Toggles for each transactional email (see list below) so you can turn verification, invoice, ban, delete emails on/off without code change.

- **Email types sent via Resend**  
  | Email type | When sent | Purpose |
  |------------|-----------|---------|
  | **Account creation / verification** | After signup (if you use email verification) | Confirm email, activate account. |
  | **Payment success / invoice** | After successful Stripe payment | Receipt, invoice summary, link to resume/dashboard. |
  | **Account banned** | When admin blocks user | Notify user their account has been suspended. |
  | **Account deleted** | When admin deletes user (optional, e.g. 24h before or at deletion) | Notify user their account and data have been removed. |
  | **Password reset** | When user requests reset (if handled via Resend) | Send reset link. |
  | **Subscription canceled / renewal reminder** | Optional: on cancel or before renewal | Inform user about subscription status. |

- **Implementation note**  
  - Use **Resend** API (e.g. `POST https://api.resend.com/emails`) from server-only code (API routes or server actions).  
  - Store Resend API key in env; from address/name can be env or a simple `admin_settings` table (key-value or JSON).  
  - Each email type can have a template (React Email, or HTML string); admin settings only control from address and on/off toggles, not template body (templates stay in code or a future template editor).

---

## 7. UI Structure (Admin Panel)

- **Layout**  
  - One **admin layout** under `src/app/admin/layout.tsx`:  
    - Verify admin (redirect if not).  
    - Sidebar: **Dashboard**, **Users**, **Resumes**, **Roadmaps**, **Payments**, **Settings**.  
    - Header: “FirstCareerSteps Admin”, current admin email, Logout (to main site or logout).

- **Shared components**  
  - Reuse existing UI primitives (Button, Card, Input, etc.) where possible.  
  - Add admin-specific components if needed: DataTable (sortable, paginated), Badge (role, status, blocked, payment status), ConfirmModal (for delete/block), simple charts for revenue/user trends (optional).

- **Dashboard**  
  - **Analytics**: User system (total users, new signups, blocked count, total resumes, total roadmaps) and payment system (total revenue, successful vs failed payment counts, optional revenue-over-time chart).  
  - **Recent activity**: Latest payments (user, amount, status), latest signups; quick links to Users, Payments, Settings.

---

## 8. Implementation Order (Suggested)

1. **DB**  
   - Add `role` (or `is_admin`) and optional `blocked_at` to `users`; migration + backfill one admin.

2. **Auth & protection**  
   - Middleware: protect `/admin` and optionally `/api/admin` (admin check).  
   - Helper: `getAdminUser()` in API (get session → load user → check role).

3. **Admin API – Users**  
   - List, get one, update, block, unblock, delete (with cascade and optional Auth delete).

4. **Admin UI – Users**  
   - List page, detail/edit page, block/unblock, delete with confirmation.

5. **Admin API – Resumes**  
   - List, get one, delete.

6. **Admin UI – Resumes**  
   - List (with filters), detail, delete.

7. **Admin API – Roadmaps**  
   - List, get one, delete.

8. **Admin UI – Roadmaps**  
   - List (with filters), detail, delete.

9. **Blocked-user handling**  
   - In main app middleware or dashboard layout: if current user has `blocked_at`, show “Account suspended” and block access.

10. **Admin API – Analytics & payments**  
    - `GET /api/admin/analytics`: aggregate user counts, revenue, payment success/fail, recent payments (from Stripe + DB).  
    - `GET /api/admin/payments`: list payments with filters (Stripe API or local log).

11. **Admin UI – Dashboard & payments**  
    - Dashboard page: user analytics cards, payment analytics cards, recent payments table, recent signups.  
    - Payments page: full payments list, filters, status badges.

12. **Admin settings & email (Resend)**  
    - DB or env: store Resend from email/name; optional `admin_settings` table for toggles.  
    - `GET /api/admin/settings`, `PATCH /api/admin/settings` for email config (and future toggles).  
    - Admin UI: Settings page with email section (from address, from name, “Resend configured” indicator, enable/disable per email type).  
    - Resend integration: server-only helper to send email (verification, payment invoice, account ban, account delete); call from existing flows (signup, webhook, admin block/delete).

13. **Dashboard & polish**  
    - Finalize dashboard layout; any extra stats or links you want.

---

## 9. Security Checklist

- [ ] Admin routes and API routes require authentication.
- [ ] Admin routes and API routes require `role === 'admin'` (or `is_admin`).
- [ ] All admin DB access uses service role only in server-side API routes after admin check.
- [ ] No service role key or admin-only logic in client components.
- [ ] Blocked users cannot access dashboard/builder/resumes/roadmaps (enforced server-side and in middleware/layout).
- [ ] Delete user: cascade and optional Auth delete; no orphaned rows.

---

## 10. Out of Scope (For Later)

- Audit log (who did what, when) – can add later.  
- Admin activity log (login, IP) – optional.  
- Invite/create user from admin – optional.  
- Editing resume/roadmap content from admin – view/delete only in this plan.  
- Editing email templates from admin UI – templates stay in code or env for v1; Resend + toggles only in settings.  
- Full Stripe subscription management (cancel/refund from admin) – Stripe dashboard can be used; admin shows read-only + link to Stripe.

---

## 11. Summary

| Item | Decision |
|------|----------|
| **Admin identity** | `users.role` = 'user' \| 'admin' (or `is_admin`); **separate users** – admins are distinct accounts, no public admin signup |
| **Admin URL & login** | **Separate URL** `/admin`; **dedicated admin login** at `/admin/login` – only admin users can access `/admin/*`; regular users use `/login` and main app |
| **Blocked users** | `users.blocked_at` + optional Supabase Auth ban |
| **URLs** | `/admin/*` for admin UI (separate from main app), `/api/admin/*` for admin API |
| **Protection** | Middleware + per-route admin check in API |
| **DB access** | Service role only in admin API routes after admin check |
| **Features** | User CRUD + block/delete; Resumes list/view/delete; Roadmaps list/view/delete; **Payment & analytics dashboard**; **Payments list** (success/failed, revenue); **Admin settings** (email via Resend.com) |
| **Email provider** | Resend.com – verification, payment invoice, account ban, account delete (and optional password reset, subscription emails) |

If you confirm this plan (or specify changes, e.g. Option B for admin list, or soft delete for users), the next step is to implement in the order above.
