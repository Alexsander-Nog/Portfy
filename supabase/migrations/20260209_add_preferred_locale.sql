alter table public.profiles
  add column if not exists preferred_locale text not null default 'pt' check (preferred_locale in ('pt','en','es'));

update public.profiles
  set preferred_locale = 'pt'
  where preferred_locale is null;
