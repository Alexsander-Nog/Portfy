alter table if exists public.subscriptions
  add column if not exists plan_tier text not null default 'basic' check (plan_tier in ('basic','pro','premium'));

update public.subscriptions
  set plan_tier = coalesce(plan_tier, 'basic');
