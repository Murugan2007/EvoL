-- Evol v1 — Learner Portal schema
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to read top to bottom. Every table has RLS ON; no policy = no access.
-- The app only ever uses the public (anon / publishable) key. No service_role key needed.

-- ───────────────────────────────────────────────────────────────
-- 0. Helpers
-- ───────────────────────────────────────────────────────────────

-- Random code from an alphabet with no look-alikes (no 0/O, 1/I/L).
create or replace function public.rand_code(n int)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex');
  out text := '';
  i int;
begin
  for i in 0 .. n - 1 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return out;
end;
$$;
revoke all on function public.rand_code(int) from public, anon, authenticated;

-- ───────────────────────────────────────────────────────────────
-- 1. Tables
-- ───────────────────────────────────────────────────────────────

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  phone      text,
  college    text,
  role       text not null default 'learner' check (role in ('learner', 'admin')),
  created_at timestamptz not null default now()
);

create table public.batches (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  course_title      text not null,
  price_inr         int  not null default 99 check (price_inr >= 0),
  seats             int  not null default 100 check (seats > 0),
  starts_on         date,
  project_due_on    date,
  registration_open boolean not null default true,
  created_at        timestamptz not null default now()
);

create table public.registrations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  batch_id         uuid not null references public.batches (id) on delete restrict,
  full_name        text not null check (char_length(full_name) between 2 and 80),
  phone            text not null check (phone ~ '^[0-9+ -]{10,15}$'),
  college          text check (char_length(college) <= 120),
  utr              text not null check (utr ~ '^[A-Z0-9]{10,30}$'),
  payer_upi_name   text not null check (char_length(payer_upi_name) between 2 and 80),
  screenshot_path  text not null,
  declaration_ok   boolean not null check (declaration_ok),
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  code             text unique,
  reject_reason    text,
  decided_at       timestamptz,
  created_at       timestamptz not null default now(),
  unique (user_id, batch_id)
);
create index registrations_utr_idx on public.registrations (utr);
create index registrations_batch_status_idx on public.registrations (batch_id, status);

create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  batch_id   uuid not null references public.batches (id) on delete cascade,
  day_no     int  not null check (day_no between 1 and 30),
  title      text not null,
  starts_at  timestamptz,
  join_link  text,
  unique (batch_id, day_no)
);

create table public.attendance (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid not null references public.classes (id) on delete cascade,
  registration_id uuid not null references public.registrations (id) on delete cascade,
  attended        boolean not null default true,
  unique (class_id, registration_id)
);

create table public.submissions (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations (id) on delete cascade,
  link            text not null check (link ~* '^https?://'),
  note            text check (char_length(note) <= 500),
  status          text not null default 'submitted' check (status in ('submitted', 'accepted', 'needs_work')),
  submitted_at    timestamptz not null default now()
);

create table public.certificates (
  id              uuid primary key default gen_random_uuid(),
  cert_id         text not null unique,
  registration_id uuid not null unique references public.registrations (id) on delete restrict,
  issued_at       timestamptz not null default now(),
  revoked         boolean not null default false,
  revoked_reason  text
);

-- ───────────────────────────────────────────────────────────────
-- 2. Who is an admin?
-- ───────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Create a profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────────────────────────
-- 3. Row-level security
-- ───────────────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.batches       enable row level security;
alter table public.registrations enable row level security;
alter table public.classes       enable row level security;
alter table public.attendance    enable row level security;
alter table public.submissions   enable row level security;
alter table public.certificates  enable row level security;

-- profiles: read/update your own; admin reads all.
-- Column grants stop anyone from editing their own "role".
revoke insert, update, delete on public.profiles from anon, authenticated;
grant  update (full_name, phone, college) on public.profiles to authenticated;

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- batches: public info (name, price, seats). Only admin changes it.
create policy "batches: anyone can read" on public.batches
  for select to anon, authenticated using (true);

create policy "batches: admin writes" on public.batches
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- registrations: learner can create ONE pending request for themselves and read it.
-- Approving/rejecting happens only through admin functions below.
create policy "registrations: read own or admin" on public.registrations
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "registrations: create own pending" on public.registrations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and code is null
    and decided_at is null
    and exists (select 1 from public.batches b where b.id = batch_id and b.registration_open)
    and screenshot_path like (select auth.uid())::text || '/%'
  );

-- a rejected learner may remove their own rejected request and submit a corrected one
create policy "registrations: delete own rejected" on public.registrations
  for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'rejected');

-- classes (contains the join link): only approved learners of that batch, or admin.
create policy "classes: approved learners or admin read" on public.classes
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.registrations r
      where r.batch_id = classes.batch_id
        and r.user_id = (select auth.uid())
        and r.status = 'approved'
    )
  );

create policy "classes: admin writes" on public.classes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- attendance: learner reads own; admin everything.
create policy "attendance: read own or admin" on public.attendance
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.registrations r
      where r.id = attendance.registration_id and r.user_id = (select auth.uid())
    )
  );

create policy "attendance: admin writes" on public.attendance
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- submissions: approved learner can submit/update own (always stays "submitted"); admin reviews.
create policy "submissions: read own or admin" on public.submissions
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.registrations r
      where r.id = submissions.registration_id and r.user_id = (select auth.uid())
    )
  );

create policy "submissions: learner insert own" on public.submissions
  for insert to authenticated
  with check (
    status = 'submitted'
    and exists (
      select 1 from public.registrations r
      where r.id = registration_id and r.user_id = (select auth.uid()) and r.status = 'approved'
    )
  );

create policy "submissions: learner update own" on public.submissions
  for update to authenticated
  using (
    status <> 'accepted'
    and exists (
      select 1 from public.registrations r
      where r.id = submissions.registration_id and r.user_id = (select auth.uid())
    )
  )
  with check (status = 'submitted');

create policy "submissions: admin writes" on public.submissions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- certificates: learner reads own; admin reads all. Writes only via functions below.
create policy "certificates: read own or admin" on public.certificates
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.registrations r
      where r.id = certificates.registration_id and r.user_id = (select auth.uid())
    )
  );

-- ───────────────────────────────────────────────────────────────
-- 4. Admin actions (checked inside the database, not in the browser)
-- ───────────────────────────────────────────────────────────────

create or replace function public.approve_registration(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  reg public.registrations;
  b   public.batches;
  taken int;
  new_code text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;

  select * into reg from public.registrations where id = p_id for update;
  if not found then raise exception 'registration not found'; end if;
  if reg.status = 'approved' then return reg.code; end if;

  -- lock the batch row so two approvals can't both take the last seat
  select * into b from public.batches where id = reg.batch_id for update;
  select count(*) into taken from public.registrations
    where batch_id = reg.batch_id and status = 'approved';
  if taken >= b.seats then raise exception 'batch is full'; end if;

  loop
    new_code := 'EV' || public.rand_code(4);
    exit when not exists (select 1 from public.registrations where code = new_code);
  end loop;

  update public.registrations
     set status = 'approved', code = new_code, reject_reason = null, decided_at = now()
   where id = p_id;
  return new_code;
end;
$$;

create or replace function public.reject_registration(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.registrations
     set status = 'rejected', code = null, reject_reason = p_reason, decided_at = now()
   where id = p_id;
end;
$$;

-- Issue a certificate only if: approved + attended >= 50% of classes + project accepted.
create or replace function public.issue_certificate(p_registration_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  reg public.registrations;
  total int;
  present int;
  new_id text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;

  select * into reg from public.registrations where id = p_registration_id;
  if not found or reg.status <> 'approved' then raise exception 'registration is not approved'; end if;

  select cert_id into new_id from public.certificates where registration_id = p_registration_id;
  if new_id is not null then return new_id; end if;

  select count(*) into total from public.classes where batch_id = reg.batch_id;
  select count(*) into present from public.attendance a
    join public.classes c on c.id = a.class_id
   where a.registration_id = p_registration_id and a.attended and c.batch_id = reg.batch_id;
  if total = 0 or present * 2 < total then raise exception 'attendance below 50%%'; end if;

  if not exists (select 1 from public.submissions
                  where registration_id = p_registration_id and status = 'accepted') then
    raise exception 'project not accepted yet';
  end if;

  loop
    new_id := 'EVL-' || public.rand_code(4) || '-' || public.rand_code(4);
    exit when not exists (select 1 from public.certificates where cert_id = new_id);
  end loop;

  insert into public.certificates (cert_id, registration_id) values (new_id, p_registration_id);
  return new_id;
end;
$$;

create or replace function public.revoke_certificate(p_cert_id text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.certificates set revoked = true, revoked_reason = p_reason where cert_id = p_cert_id;
end;
$$;

revoke all on function public.approve_registration(uuid)        from public, anon;
revoke all on function public.reject_registration(uuid, text)   from public, anon;
revoke all on function public.issue_certificate(uuid)           from public, anon;
revoke all on function public.revoke_certificate(text, text)    from public, anon;
grant execute on function public.approve_registration(uuid)      to authenticated;
grant execute on function public.reject_registration(uuid, text) to authenticated;
grant execute on function public.issue_certificate(uuid)         to authenticated;
grant execute on function public.revoke_certificate(text, text)  to authenticated;

-- ───────────────────────────────────────────────────────────────
-- 5. Public certificate check (anyone, no login)
--    Looks up by the random ID only and returns just 4 fields.
-- ───────────────────────────────────────────────────────────────

create or replace function public.verify_certificate(p_cert_id text)
returns table (holder_name text, course text, issued_on date, valid boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select r.full_name, b.course_title, c.issued_at::date, not c.revoked
    from public.certificates c
    join public.registrations r on r.id = c.registration_id
    join public.batches b on b.id = r.batch_id
   where c.cert_id = upper(trim(p_cert_id))
   limit 1;
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Seats left for a batch (shown on the register page).
create or replace function public.seats_left(p_batch_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select b.seats - (select count(*) from public.registrations r
                     where r.batch_id = b.id and r.status = 'approved')::int
    from public.batches b where b.id = p_batch_id;
$$;
grant execute on function public.seats_left(uuid) to anon, authenticated;

-- ───────────────────────────────────────────────────────────────
-- 6. Private storage for payment screenshots
--    Path must be  <user id>/<file>.  Learners see only their own; admin sees all.
-- ───────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "proofs: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "proofs: read own or admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));

-- ───────────────────────────────────────────────────────────────
-- 7. First batch (edit freely later from the admin page)
-- ───────────────────────────────────────────────────────────────

insert into public.batches (name, course_title, price_inr, seats)
values ('Founding Batch', 'Absolute Basics of Electronics & IoT', 99, 100);

-- ───────────────────────────────────────────────────────────────
-- 8. Make YOURSELF the admin (run ONCE, after you've signed in to the app once)
--    Replace the email, then run just this line:
--
--    update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
-- ───────────────────────────────────────────────────────────────
