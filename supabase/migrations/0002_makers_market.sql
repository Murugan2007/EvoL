-- Evol v1.1 — makers, marketplace, request board
-- Run AFTER 0001_init.sql (SQL Editor → paste → Run).

-- ── roles: add "maker" ─────────────────────────────────────────
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('learner', 'maker', 'admin'));

create or replace function public.is_maker()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles
                  where id = (select auth.uid()) and role in ('maker', 'admin'));
$$;
revoke all on function public.is_maker() from public, anon;
grant execute on function public.is_maker() to authenticated;

-- ── tables ─────────────────────────────────────────────────────
create table public.maker_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 60),
  bio           text not null check (char_length(bio) between 10 and 600),
  portfolio_url text check (portfolio_url is null or portfolio_url ~* '^https?://'),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  created_at    timestamptz not null default now()
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  maker_id    uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 10 and 1000),
  category    text not null default 'Gadgets',
  price_inr   int  not null check (price_inr between 1 and 500000),
  stock       int  not null default 1 check (stock >= 0),
  image_path  text,
  status      text not null default 'pending' check (status in ('pending', 'live', 'hidden', 'rejected')),
  created_at  timestamptz not null default now()
);
create index products_status_idx on public.products (status, created_at desc);

create table public.requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 5 and 100),
  description text not null check (char_length(description) between 20 and 2000),
  budget_inr  int check (budget_inr is null or budget_inr between 1 and 1000000),
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now()
);

create table public.offers (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  maker_id   uuid not null references public.profiles (id) on delete cascade,
  message    text not null check (char_length(message) between 10 and 800),
  price_inr  int not null check (price_inr between 1 and 1000000),
  created_at timestamptz not null default now(),
  unique (request_id, maker_id)
);

alter table public.maker_applications enable row level security;
alter table public.products           enable row level security;
alter table public.requests           enable row level security;
alter table public.offers             enable row level security;

-- ── maker applications ─────────────────────────────────────────
create policy "apps: read own or admin" on public.maker_applications
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "apps: create own pending" on public.maker_applications
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and reject_reason is null);
create policy "apps: delete own rejected" on public.maker_applications
  for delete to authenticated using (user_id = (select auth.uid()) and status = 'rejected');

-- ── products ───────────────────────────────────────────────────
create policy "products: anyone reads live" on public.products
  for select to anon, authenticated using (status = 'live');
create policy "products: maker reads own, admin all" on public.products
  for select to authenticated using (maker_id = (select auth.uid()) or public.is_admin());
create policy "products: maker creates pending" on public.products
  for insert to authenticated
  with check (maker_id = (select auth.uid()) and public.is_maker() and status = 'pending');
create policy "products: maker edits own (goes back to review)" on public.products
  for update to authenticated
  using (maker_id = (select auth.uid()) and public.is_maker())
  with check (maker_id = (select auth.uid()) and status in ('pending', 'hidden'));
create policy "products: maker deletes own" on public.products
  for delete to authenticated using (maker_id = (select auth.uid()));

-- ── requests: owner + makers + admin see them; anyone signed in can post ──
create policy "requests: read" on public.requests
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_maker() or public.is_admin());
create policy "requests: create own" on public.requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open');
create policy "requests: owner closes" on public.requests
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── offers ─────────────────────────────────────────────────────
create policy "offers: read" on public.offers
  for select to authenticated
  using (
    maker_id = (select auth.uid()) or public.is_admin()
    or exists (select 1 from public.requests r where r.id = offers.request_id and r.user_id = (select auth.uid()))
  );
create policy "offers: maker creates" on public.offers
  for insert to authenticated
  with check (
    maker_id = (select auth.uid()) and public.is_maker()
    and exists (select 1 from public.requests r where r.id = request_id and r.status = 'open')
  );

-- ── admin actions ──────────────────────────────────────────────
create or replace function public.approve_maker(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.maker_applications set status = 'approved', reject_reason = null
   where id = p_id returning user_id into uid;
  if uid is null then raise exception 'application not found'; end if;
  update public.profiles set role = 'maker' where id = uid and role = 'learner';
end;
$$;

create or replace function public.reject_maker(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.maker_applications set status = 'rejected', reject_reason = p_reason where id = p_id;
end;
$$;

create or replace function public.review_product(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_status not in ('live', 'rejected', 'hidden') then raise exception 'bad status'; end if;
  update public.products set status = p_status where id = p_id;
end;
$$;

revoke all on function public.approve_maker(uuid)           from public, anon;
revoke all on function public.reject_maker(uuid, text)      from public, anon;
revoke all on function public.review_product(uuid, text)    from public, anon;
grant execute on function public.approve_maker(uuid)        to authenticated;
grant execute on function public.reject_maker(uuid, text)   to authenticated;
grant execute on function public.review_product(uuid, text) to authenticated;

-- Maker display name for product cards (public, only name — no email/phone).
create or replace function public.maker_name(p_id uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select a.display_name from public.maker_applications a
   where a.user_id = p_id and a.status = 'approved' limit 1;
$$;
grant execute on function public.maker_name(uuid) to anon, authenticated;

-- ── product images: public bucket, makers write only to their own folder ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "product images: maker uploads to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_maker()
              and (storage.foldername(name))[1] = (select auth.uid())::text);
