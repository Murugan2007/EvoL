# Evol — Learner Portal (v1)

Next.js 16 + Supabase (Postgres, Auth, Storage, RLS) + Vercel. Font: Outfit (Glacial Indifference stand-in).

## One-time setup

1. **Database** — Supabase → SQL Editor → run `supabase/migrations/0001_init.sql`, then `0002_makers_market.sql` (in that order).
2. **Auth** — Supabase → Authentication:
   - URL Configuration: *Site URL* = your Vercel URL; add `https://YOUR-DOMAIN/auth/callback` and `http://localhost:3000/auth/callback` to *Redirect URLs*.
   - Providers → enable **Email** (magic link) and, optionally, **Google**.
3. **Env vars** — copy `.env.local.example` to `.env.local` (and add the same in Vercel → Settings → Environment Variables):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_UPI_ID`.
   Never add the `service_role` / secret key. The app doesn't need it.
4. **Make yourself admin** — sign in to the app once, then in the SQL Editor run:
   `update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';`
   An **Admin** button then appears on the Learn screen and in **More → Admin menu** (`/admin`).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run test:db    # 40 security checks on the database rules (no Supabase needed)
```

## How admin access works

- `role` lives in `public.profiles`. Users can't change it (column grants), only SQL Editor can.
- `/admin/*` is gated on the server (`requireAdmin`) **and** by the database: approve/reject/issue/revoke are
  `security definer` functions that re-check `is_admin()`. Hiding a button is never the security.

## Company page

The static company page is `public/about.html`, served at `/about` (see `rewrites` in `next.config.ts`).

## Google login (one-time)

1. Google Cloud Console → APIs & Services → **OAuth consent screen** (External) → fill app name "Evol", your email → Publish.
2. **Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorized redirect URI: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback` (shown in Supabase → Authentication → Providers → Google).
3. Copy the **Client ID** and **Client secret** into Supabase → Authentication → Providers → **Google** → enable → Save.
4. Supabase → Authentication → URL Configuration: Site URL = your Vercel URL; add `/auth/callback` under Redirect URLs.

## Roles

| Role | How to get it | Sees |
|---|---|---|
| learner | default on sign-up | Learn, Marketplace, Request, More |
| maker | applies at `/become-a-maker`, admin approves at `/admin/makers` | + `/maker` studio (products, customer requests) |
| admin | SQL: `update public.profiles set role='admin' where email='YOU';` | + `/admin` |

Products go live only after admin approval (`/admin/products`). Checkout is not built yet (needs a payment gateway).

## Optional env: `NEXT_PUBLIC_SITE_URL`
Set to `https://evolindia.vercel.app` (your public address). Sign-in then always returns there, never to a protected Vercel deployment URL.

## Speed tips
Set Vercel → Settings → Functions → **Region** to the one closest to your Supabase project (Supabase → Project Settings → General shows its region, e.g. Mumbai = `bom1`).
