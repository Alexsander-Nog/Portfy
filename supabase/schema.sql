create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  title text,
  bio text,
  location text,
  email text,
  phone text,
  photo_url text,
  social_links jsonb,
  skills text[] not null default '{}',
  education jsonb,
  translations jsonb default '{}'::jsonb,
  preferred_locale text not null default 'pt' check (preferred_locale in ('pt','en','es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_themes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  primary_color text not null,
  secondary_color text not null,
  accent_color text not null,
  background_color text not null,
  font_family text not null,
  theme_mode text not null default 'light',
  layout text not null default 'modern',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.featured_videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  url text not null,
  platform text not null check (platform in ('youtube', 'instagram')),
  title text not null,
  description text not null,
  tags text[] not null default '{}',
  position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null default 'standard' check (type in ('standard', 'github', 'media', 'professional')),
  title text not null,
  description text not null,
  image_url text,
  tags text[] not null default '{}',
  link text,
  category text,
  repo_url text,
  media_url text,
  pdf_url text,
  company text,
  results text,
  position integer,
  translations jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  company text not null,
  period text not null,
  description text not null,
  location text,
  current boolean default false,
  certificate_url text,
  show_certificate boolean not null default true,
  position integer,
  translations jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cvs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  language text not null check (language in ('pt', 'en', 'es')),
  selected_projects text[] not null default '{}',
  selected_experiences text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  status text not null default 'trialing',
  plan_tier text not null default 'basic' check (plan_tier in ('basic','pro','premium')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  grace_days integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.profiles enable row level security;
alter table public.user_themes enable row level security;
alter table public.featured_videos enable row level security;
alter table public.projects enable row level security;
alter table public.experiences enable row level security;
alter table public.cvs enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_write_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

alter table public.profiles
  add column if not exists skills text[] not null default '{}';

alter table public.profiles
  add column if not exists education jsonb;

alter table public.profiles
  add column if not exists preferred_locale text not null default 'pt' check (preferred_locale in ('pt','en','es'));

create policy "user_themes_read_own" on public.user_themes
  for select using (auth.uid() = user_id);
create policy "user_themes_write_own" on public.user_themes
  for insert with check (auth.uid() = user_id);
create policy "user_themes_update_own" on public.user_themes
  for update using (auth.uid() = user_id);

alter table public.user_themes
  add column if not exists theme_mode text not null default 'light';

alter table public.user_themes
  add column if not exists layout text not null default 'modern';

create policy "featured_videos_read_own" on public.featured_videos
  for select using (auth.uid() = user_id);
create policy "featured_videos_write_own" on public.featured_videos
  for insert with check (auth.uid() = user_id);
create policy "featured_videos_update_own" on public.featured_videos
  for update using (auth.uid() = user_id);
create policy "featured_videos_delete_own" on public.featured_videos
  for delete using (auth.uid() = user_id);

create policy "projects_read_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_write_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

create policy "experiences_read_own" on public.experiences
  for select using (auth.uid() = user_id);
create policy "experiences_write_own" on public.experiences
  for insert with check (auth.uid() = user_id);
create policy "experiences_update_own" on public.experiences
  for update using (auth.uid() = user_id);
create policy "experiences_delete_own" on public.experiences
  for delete using (auth.uid() = user_id);

alter table public.experiences
  add column if not exists show_certificate boolean not null default true;

create policy "cvs_read_own" on public.cvs
  for select using (auth.uid() = user_id);
create policy "cvs_write_own" on public.cvs
  for insert with check (auth.uid() = user_id);
create policy "cvs_update_own" on public.cvs
  for update using (auth.uid() = user_id);
create policy "cvs_delete_own" on public.cvs

  for delete using (auth.uid() = user_id);omo