alter table public.profiles
  add column if not exists trial_start timestamptz not null default now();

alter table public.profiles
  add column if not exists trial_end timestamptz not null default (now() + interval '15 days');
