-- Evol v1.2 — editable profile (name + photo), certificate templates with auto name placement.
-- Run AFTER 0003. (SQL Editor → paste → Run.)

-- ── profile photo + name rules ─────────────────────────────────
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles drop constraint if exists profiles_name_len;
alter table public.profiles add constraint profiles_name_len
  check (full_name is null or char_length(btrim(full_name)) between 2 and 60) not valid;
grant update (avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: write own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: replace own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ── certificate templates (admin uploads a PNG and marks where the name goes) ──
-- All positions are percentages of the image, so they work at any resolution.
create table public.certificate_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 60),
  image_path  text not null,
  name_x      numeric not null default 50 check (name_x between 0 and 100),   -- centre of the name
  name_y      numeric not null default 50 check (name_y between 0 and 100),
  name_size   numeric not null default 4  check (name_size between 0.5 and 15), -- font size, % of image width
  name_max_w  numeric not null default 60 check (name_max_w between 10 and 100), -- long names shrink to fit
  name_color  text    not null default '#1c1517' check (name_color ~ '^#[0-9a-fA-F]{6}$'),
  name_weight int     not null default 600 check (name_weight between 300 and 800),
  show_qr     boolean not null default false,
  qr_x        numeric not null default 90 check (qr_x between 0 and 100),
  qr_y        numeric not null default 85 check (qr_y between 0 and 100),
  qr_size     numeric not null default 9  check (qr_size between 3 and 30),   -- % of image width
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index certificate_templates_one_active on public.certificate_templates (is_active) where is_active;
alter table public.certificate_templates enable row level security;

create policy "templates: anyone reads" on public.certificate_templates
  for select to anon, authenticated using (true);
create policy "templates: admin writes" on public.certificate_templates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.activate_certificate_template(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if not exists (select 1 from public.certificate_templates where id = p_id) then raise exception 'template not found'; end if;
  update public.certificate_templates set is_active = false where is_active;
  update public.certificate_templates set is_active = true where id = p_id;
end;
$$;
revoke all on function public.activate_certificate_template(uuid) from public, anon;
grant execute on function public.activate_certificate_template(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificate-templates', 'certificate-templates', true, 8388608, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "cert templates: admin uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'certificate-templates' and public.is_admin());
create policy "cert templates: admin deletes" on storage.objects
  for delete to authenticated using (bucket_id = 'certificate-templates' and public.is_admin());

-- ── the name printed on a certificate is fixed at issue time ──
alter table public.certificates add column if not exists holder_name text;
update public.certificates c set holder_name = r.full_name
  from public.registrations r where r.id = c.registration_id and c.holder_name is null;

create or replace function public.issue_certificate(p_registration_id uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  reg public.registrations;
  total int;
  present int;
  new_id text;
  nm text;
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

  -- the learner's current profile name wins; fall back to the name given at registration
  select coalesce(nullif(btrim(p.full_name), ''), reg.full_name) into nm
    from public.profiles p where p.id = reg.user_id;

  loop
    new_id := 'EVL-' || public.rand_code(4) || '-' || public.rand_code(4);
    exit when not exists (select 1 from public.certificates where cert_id = new_id);
  end loop;

  insert into public.certificates (cert_id, registration_id, holder_name) values (new_id, p_registration_id, coalesce(nm, reg.full_name));
  return new_id;
end;
$$;

-- Issue to everyone eligible in a batch in one go. Returns how many were issued.
create or replace function public.issue_all_eligible(p_batch_id uuid)
returns int language plpgsql security definer set search_path = ''
as $$
declare r record; n int := 0;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  for r in select id from public.registrations
            where batch_id = p_batch_id and status = 'approved'
              and not exists (select 1 from public.certificates c where c.registration_id = registrations.id)
  loop
    begin
      perform public.issue_certificate(r.id);
      n := n + 1;
    exception when others then
      null; -- not eligible yet
    end;
  end loop;
  return n;
end;
$$;

-- Fix a typo in the printed name (admin only).
create or replace function public.rename_certificate_holder(p_cert_id text, p_name text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if char_length(btrim(p_name)) not between 2 and 60 then raise exception 'name must be 2-60 characters'; end if;
  update public.certificates set holder_name = btrim(p_name) where cert_id = p_cert_id;
end;
$$;

revoke all on function public.issue_all_eligible(uuid)                 from public, anon;
revoke all on function public.rename_certificate_holder(text, text)    from public, anon;
grant execute on function public.issue_all_eligible(uuid)              to authenticated;
grant execute on function public.rename_certificate_holder(text, text) to authenticated;

create or replace function public.verify_certificate(p_cert_id text)
returns table (holder_name text, course text, issued_on date, valid boolean)
language sql stable security definer set search_path = ''
as $$
  select coalesce(c.holder_name, r.full_name), b.course_title, c.issued_at::date, not c.revoked
    from public.certificates c
    join public.registrations r on r.id = c.registration_id
    join public.batches b on b.id = r.batch_id
   where c.cert_id = upper(trim(p_cert_id))
   limit 1;
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;
