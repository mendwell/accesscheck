-- Speeds up private dashboard filtering while keeping flexible, versioned JSON records.
create index if not exists checkups_checkup_type_idx
  on public.checkups ((site ->> 'checkupType'));

create index if not exists checkups_municipality_idx
  on public.checkups ((site ->> 'municipality'))
  where site ->> 'checkupType' = 'voting';

create index if not exists checkups_status_submitted_at_idx
  on public.checkups (status, submitted_at desc);
