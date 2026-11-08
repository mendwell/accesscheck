alter table public.checkups
  add column if not exists is_public boolean not null default false,
  add column if not exists public_location_name text,
  add column if not exists public_location_detail text,
  add column if not exists public_location_mode text,
  add column if not exists public_latitude double precision,
  add column if not exists public_longitude double precision,
  add column if not exists published_at timestamptz;

alter table public.checkups
  drop constraint if exists checkups_public_location_mode_check,
  add constraint checkups_public_location_mode_check
    check (public_location_mode is null or public_location_mode in ('exact', 'approximate')),
  drop constraint if exists checkups_public_latitude_check,
  add constraint checkups_public_latitude_check
    check (public_latitude is null or public_latitude between -90 and 90),
  drop constraint if exists checkups_public_longitude_check,
  add constraint checkups_public_longitude_check
    check (public_longitude is null or public_longitude between -180 and 180);

create index if not exists checkups_public_results_idx
  on public.checkups (published_at desc)
  where is_public = true and status = 'submitted';

comment on column public.checkups.is_public is
  'Explicit private-dashboard approval gate for the sanitized public results feed.';
comment on column public.checkups.public_location_mode is
  'Whether the approved public marker is exact or approximate.';
