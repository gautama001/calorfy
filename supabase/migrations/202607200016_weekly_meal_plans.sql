-- Persistent seven-day meal plans generated from Calorfy's recipe catalog.

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  diet_key text not null,
  calorie_target integer check (calorie_target > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.weekly_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  category text not null check (category in ('breakfast', 'lunch', 'snack', 'dinner')),
  recipe_id text not null check (char_length(recipe_id) between 1 and 100),
  servings numeric(4,2) not null default 1 check (servings between 0.5 and 10),
  status text not null default 'planned' check (status in ('planned', 'added', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, plan_date, category)
);

create index weekly_plans_user_week_idx on public.weekly_plans (user_id, week_start desc);
create index weekly_plan_items_user_date_idx on public.weekly_plan_items (user_id, plan_date, category);

alter table public.weekly_plans enable row level security;
alter table public.weekly_plan_items enable row level security;

create policy "weekly_plans_select_own" on public.weekly_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "weekly_plans_insert_own" on public.weekly_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weekly_plans_update_own" on public.weekly_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weekly_plans_delete_own" on public.weekly_plans for delete to authenticated using ((select auth.uid()) = user_id);
create policy "weekly_plan_items_select_own" on public.weekly_plan_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "weekly_plan_items_insert_own" on public.weekly_plan_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weekly_plan_items_update_own" on public.weekly_plan_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weekly_plan_items_delete_own" on public.weekly_plan_items for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.replace_weekly_plan(
  p_week_start date,
  p_diet_key text,
  p_calorie_target integer,
  p_items jsonb
)
returns public.weekly_plans
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_plan public.weekly_plans%rowtype;
  item jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) <> 28 then
    raise exception 'A weekly plan requires exactly 28 items';
  end if;

  insert into public.weekly_plans (user_id, week_start, diet_key, calorie_target, updated_at)
  values (current_user_id, p_week_start, p_diet_key, p_calorie_target, now())
  on conflict (user_id, week_start) do update set diet_key = excluded.diet_key, calorie_target = excluded.calorie_target, updated_at = now()
  returning * into saved_plan;

  delete from public.weekly_plan_items where plan_id = saved_plan.id and user_id = current_user_id;

  for item in select value from jsonb_array_elements(p_items)
  loop
    if (item ->> 'plan_date')::date < p_week_start or (item ->> 'plan_date')::date > p_week_start + 6 then
      raise exception 'Plan item outside selected week';
    end if;
    insert into public.weekly_plan_items (plan_id, user_id, plan_date, category, recipe_id, servings)
    values (saved_plan.id, current_user_id, (item ->> 'plan_date')::date, item ->> 'category', item ->> 'recipe_id', coalesce((item ->> 'servings')::numeric, 1));
  end loop;

  return saved_plan;
end;
$$;

grant execute on function public.replace_weekly_plan(date, text, integer, jsonb) to authenticated;
