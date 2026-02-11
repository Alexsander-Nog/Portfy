update public.profiles set theme_template = 'modern'
  where theme_template in ('dev-modern', 'modern');

update public.profiles set theme_template = 'minimal'
  where theme_template in ('minimal-elegant', 'minimal');

update public.profiles set theme_template = 'dark'
  where theme_template in ('dark-professional', 'dark');

update public.profiles set theme_template = 'gradient'
  where theme_template in ('creative-gradient', 'gradient');

update public.profiles set cv_template = 'modern'
  where cv_template in ('modern-clean', 'modern');

update public.profiles set cv_template = 'minimal'
  where cv_template in ('minimal-recruiter', 'minimal');

update public.profiles set cv_template = 'creative'
  where cv_template in ('creative-designer', 'creative');

update public.profiles set cv_template = 'executive'
  where cv_template in ('executive-pro', 'executive');

alter table public.profiles alter column theme_template set default 'modern';
alter table public.profiles alter column cv_template set default 'modern';
