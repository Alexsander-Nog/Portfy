alter table if exists public.subscriptions
  add column if not exists plan_type text not null default 'trial';

alter table if exists public.subscriptions
  add column if not exists subscription_active boolean not null default true;

alter table if exists public.subscriptions
  add column if not exists trial_start timestamptz not null default now();

alter table if exists public.subscriptions
  add column if not exists trial_end timestamptz not null default (now() + interval '15 days');

update public.subscriptions
set
  plan_type = coalesce(plan_type, 'trial'),
  subscription_active = coalesce(subscription_active, true),
  trial_start = coalesce(trial_start, now()),
  trial_end = coalesce(trial_end, now() + interval '15 days')
where plan_type is distinct from 'paid';