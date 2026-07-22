-- Persist user preferences across devices while keeping them protected by the
-- existing profiles RLS policy.

alter table public.profiles
  add column if not exists theme text not null default 'light'
    check (theme in ('light', 'dark')),
  add column if not exists reminder_time time not null default '13:00',
  add column if not exists nutrition_targets_mode text not null default 'auto'
    check (nutrition_targets_mode in ('auto', 'manual')),
  add column if not exists preferences_initialized boolean not null default false;

notify pgrst, 'reload schema';
