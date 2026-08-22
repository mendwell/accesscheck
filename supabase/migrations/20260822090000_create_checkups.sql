create extension if not exists pgcrypto;

create table if not exists public.checkups (
  id uuid primary key default gen_random_uuid(),
  edit_token_hash text not null,
  site jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  section_index integer not null default 0 check (section_index between 0 and 4),
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists checkups_updated_at_idx
  on public.checkups (updated_at desc);

alter table public.checkups enable row level security;

revoke all on table public.checkups from anon, authenticated;
grant select, insert, update on table public.checkups to service_role;
