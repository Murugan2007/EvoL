-- Request board: type of request + "need it by" date. Run after 0002.
alter table public.requests
  add column if not exists kind text not null default 'invent' check (kind in ('fix', 'improve', 'invent')),
  add column if not exists need_by date;
