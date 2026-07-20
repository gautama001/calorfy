-- Calorfy launch schema. Every user-owned table is protected by RLS.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  preferred_language text not null default 'es' check (preferred_language in ('es', 'en', 'pt')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_weight_kg numeric(5,2) check (current_weight_kg > 0),
  target_weight_kg numeric(5,2) check (target_weight_kg > 0),
  height_cm numeric(5,2) check (height_cm > 0),
  birth_year smallint check (birth_year between 1900 and 2100),
  sex text check (sex in ('female', 'male', 'other', 'prefer_not_to_say')),
  goal text check (goal in ('maintain', 'lose', 'gain', 'gain_muscle')),
  diet text check (diet in ('balanced', 'keto', 'paleo', 'vegan', 'mediterranean', 'raw', 'macrobiotic')),
  calorie_goal integer check (calorie_goal > 0),
  protein_goal_g numeric(7,2) check (protein_goal_g >= 0),
  carbs_goal_g numeric(7,2) check (carbs_goal_g >= 0),
  fat_goal_g numeric(7,2) check (fat_goal_g >= 0),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  category text check (category in ('breakfast', 'lunch', 'snack', 'dinner')),
  image_path text,
  calories numeric(9,2) not null default 0 check (calories >= 0),
  protein_g numeric(9,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(9,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(9,2) not null default 0 check (fat_g >= 0),
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meals_user_eaten_at_idx on public.meals (user_id, eaten_at desc);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg > 0),
  measured_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

create index weight_entries_user_date_idx on public.weight_entries (user_id, measured_on desc);

create table public.daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  water_ml integer not null default 0 check (water_ml >= 0),
  steps integer not null default 0 check (steps >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.meals enable row level security;
alter table public.weight_entries enable row level security;
alter table public.daily_activity enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "goals_select_own" on public.user_goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "goals_insert_own" on public.user_goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goals_update_own" on public.user_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals_delete_own" on public.user_goals for delete to authenticated using ((select auth.uid()) = user_id);

create policy "meals_select_own" on public.meals for select to authenticated using ((select auth.uid()) = user_id);
create policy "meals_insert_own" on public.meals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meals_update_own" on public.meals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "meals_delete_own" on public.meals for delete to authenticated using ((select auth.uid()) = user_id);

create policy "weights_select_own" on public.weight_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "weights_insert_own" on public.weight_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weights_update_own" on public.weight_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weights_delete_own" on public.weight_entries for delete to authenticated using ((select auth.uid()) = user_id);

create policy "activity_select_own" on public.daily_activity for select to authenticated using ((select auth.uid()) = user_id);
create policy "activity_insert_own" on public.daily_activity for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "activity_update_own" on public.daily_activity for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "activity_delete_own" on public.daily_activity for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-images', 'meal-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "meal_images_select_own" on storage.objects for select to authenticated
using (bucket_id = 'meal-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "meal_images_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'meal-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "meal_images_update_own" on storage.objects for update to authenticated
using (bucket_id = 'meal-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'meal-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "meal_images_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'meal-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

