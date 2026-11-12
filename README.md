# Evol — Learner Portal (v1)

Next.js 16 + Supabase (Postgres, Auth, Storage, RLS) + Vercel. Font: Outfit (Glacial Indifference stand-in).

## One-time setup

1. **Database** — Supabase → SQL Editor → paste `supabase/migrations/0001_init.sql` → Run.
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
