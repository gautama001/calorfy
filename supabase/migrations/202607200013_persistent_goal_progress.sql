-- Persist the baseline of each goal journey and retain previous journeys.

alter table public.user_goals
  add column if not exists starting_weight_kg numeric(5,2) check (starting_weight_kg > 0),
  add column if not exists goal_started_on date;

update public.user_goals goals
set
  starting_weight_kg = coalesce(
    goals.starting_weight_kg,
    (select entries.weight_kg from public.weight_entries entries where entries.user_id = goals.user_id order by entries.measured_on asc limit 1),
    goals.current_weight_kg
  ),
  goal_started_on = coalesce(
    goals.goal_started_on,
    (select entries.measured_on from public.weight_entries entries where entries.user_id = goals.user_id order by entries.measured_on asc limit 1),
    current_date
  )
where goals.starting_weight_kg is null or goals.goal_started_on is null;

create table public.goal_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  starting_weight_kg numeric(5,2) not null check (starting_weight_kg > 0),
  target_weight_kg numeric(5,2) not null check (target_weight_kg > 0),
  goal text check (goal in ('maintain', 'lose', 'gain', 'gain_muscle')),
  started_on date not null default current_date,
  ended_on date,
  status text not null default 'active' check (status in ('active', 'replaced', 'completed')),
  created_at timestamptz not null default now(),
  check (ended_on is null or ended_on >= started_on)
);

create unique index goal_cycles_one_active_per_user_idx on public.goal_cycles (user_id) where status = 'active';
create index goal_cycles_user_started_idx on public.goal_cycles (user_id, started_on desc);

alter table public.goal_cycles enable row level security;
create policy "goal_cycles_select_own" on public.goal_cycles for select to authenticated using ((select auth.uid()) = user_id);
create policy "goal_cycles_insert_own" on public.goal_cycles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goal_cycles_update_own" on public.goal_cycles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into public.goal_cycles (user_id, starting_weight_kg, target_weight_kg, goal, started_on)
select user_id, starting_weight_kg, target_weight_kg, goal, goal_started_on
from public.user_goals goals
where starting_weight_kg is not null
  and target_weight_kg is not null
  and not exists (select 1 from public.goal_cycles cycles where cycles.user_id = goals.user_id and cycles.status = 'active');

create or replace function public.save_goal_plan(
  p_current_weight_kg numeric,
  p_target_weight_kg numeric,
  p_height_cm numeric,
  p_birth_year smallint,
  p_sex text,
  p_goal text,
  p_diet text,
  p_calorie_goal integer,
  p_protein_goal_g numeric,
  p_carbs_goal_g numeric,
  p_fat_goal_g numeric
)
returns public.user_goals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  previous_goal public.user_goals%rowtype;
  saved_goal public.user_goals%rowtype;
  starts_new_cycle boolean := false;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_current_weight_kg is not null and (p_current_weight_kg <= 0 or p_current_weight_kg >= 500) then raise exception 'Invalid weight'; end if;
  if p_target_weight_kg is not null and (p_target_weight_kg <= 0 or p_target_weight_kg >= 500) then raise exception 'Invalid target'; end if;

  select * into previous_goal from public.user_goals where user_id = current_user_id for update;
  starts_new_cycle := p_current_weight_kg is not null and p_target_weight_kg is not null and (
    previous_goal.user_id is null
    or previous_goal.starting_weight_kg is null
    or previous_goal.target_weight_kg is distinct from p_target_weight_kg
    or previous_goal.goal is distinct from p_goal
  );

  if starts_new_cycle then
    update public.goal_cycles set status = 'replaced', ended_on = current_date
    where user_id = current_user_id and status = 'active';
    insert into public.goal_cycles (user_id, starting_weight_kg, target_weight_kg, goal, started_on)
    values (current_user_id, p_current_weight_kg, p_target_weight_kg, p_goal, current_date);
  end if;

  insert into public.user_goals (
    user_id, current_weight_kg, target_weight_kg, height_cm, birth_year, sex, goal, diet,
    calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, starting_weight_kg, goal_started_on, updated_at
  ) values (
    current_user_id, p_current_weight_kg, p_target_weight_kg, p_height_cm, p_birth_year, p_sex, p_goal, p_diet,
    p_calorie_goal, p_protein_goal_g, p_carbs_goal_g, p_fat_goal_g,
    case when starts_new_cycle then p_current_weight_kg else previous_goal.starting_weight_kg end,
    case when starts_new_cycle then current_date else previous_goal.goal_started_on end,
    now()
  )
  on conflict (user_id) do update set
    current_weight_kg = excluded.current_weight_kg, target_weight_kg = excluded.target_weight_kg,
    height_cm = excluded.height_cm, birth_year = excluded.birth_year, sex = excluded.sex,
    goal = excluded.goal, diet = excluded.diet, calorie_goal = excluded.calorie_goal,
    protein_goal_g = excluded.protein_goal_g, carbs_goal_g = excluded.carbs_goal_g, fat_goal_g = excluded.fat_goal_g,
    starting_weight_kg = excluded.starting_weight_kg, goal_started_on = excluded.goal_started_on, updated_at = now()
  returning * into saved_goal;

  if p_current_weight_kg is not null then
    insert into public.weight_entries (user_id, weight_kg, measured_on)
    values (current_user_id, p_current_weight_kg, current_date)
    on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg;
  end if;

  return saved_goal;
end;
$$;

grant execute on function public.save_goal_plan(numeric,numeric,numeric,smallint,text,text,text,integer,numeric,numeric,numeric) to authenticated;

create or replace function public.save_current_weight(measured_weight numeric, measurement_date date)
returns public.weight_entries
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_entry public.weight_entries%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if measured_weight <= 0 or measured_weight >= 500 then raise exception 'Invalid weight'; end if;

  insert into public.weight_entries (user_id, weight_kg, measured_on)
  values (current_user_id, measured_weight, measurement_date)
  on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg
  returning * into saved_entry;

  insert into public.user_goals (user_id, current_weight_kg, starting_weight_kg, goal_started_on, updated_at)
  values (current_user_id, measured_weight, measured_weight, measurement_date, now())
  on conflict (user_id) do update set
    current_weight_kg = excluded.current_weight_kg,
    starting_weight_kg = coalesce(public.user_goals.starting_weight_kg, excluded.starting_weight_kg),
    goal_started_on = coalesce(public.user_goals.goal_started_on, excluded.goal_started_on),
    updated_at = now();

  return saved_entry;
end;
$$;

grant execute on function public.save_current_weight(numeric, date) to authenticated;
