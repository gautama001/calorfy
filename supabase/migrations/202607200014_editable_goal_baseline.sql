-- Let users correct the baseline of the active journey without losing its history.

drop function if exists public.save_goal_plan(numeric,numeric,numeric,smallint,text,text,text,integer,numeric,numeric,numeric);

create or replace function public.save_goal_plan(
  p_current_weight_kg numeric,
  p_target_weight_kg numeric,
  p_starting_weight_kg numeric,
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
  effective_start numeric;
  effective_started_on date;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_current_weight_kg is not null and (p_current_weight_kg <= 0 or p_current_weight_kg >= 500) then raise exception 'Invalid weight'; end if;
  if p_target_weight_kg is not null and (p_target_weight_kg <= 0 or p_target_weight_kg >= 500) then raise exception 'Invalid target'; end if;
  if p_starting_weight_kg is not null and (p_starting_weight_kg <= 0 or p_starting_weight_kg >= 500) then raise exception 'Invalid starting weight'; end if;

  select * into previous_goal from public.user_goals where user_id = current_user_id for update;
  starts_new_cycle := p_current_weight_kg is not null and p_target_weight_kg is not null and (
    previous_goal.user_id is null
    or previous_goal.starting_weight_kg is null
    or previous_goal.target_weight_kg is distinct from p_target_weight_kg
    or previous_goal.goal is distinct from p_goal
  );
  effective_start := case
    when starts_new_cycle then p_current_weight_kg
    else coalesce(p_starting_weight_kg, previous_goal.starting_weight_kg, p_current_weight_kg)
  end;
  effective_started_on := case when starts_new_cycle then current_date else coalesce(previous_goal.goal_started_on, current_date) end;

  if starts_new_cycle then
    update public.goal_cycles set status = 'replaced', ended_on = current_date
    where user_id = current_user_id and status = 'active';
    insert into public.goal_cycles (user_id, starting_weight_kg, target_weight_kg, goal, started_on)
    values (current_user_id, effective_start, p_target_weight_kg, p_goal, effective_started_on);
  elsif effective_start is not null then
    update public.goal_cycles
    set starting_weight_kg = effective_start, target_weight_kg = coalesce(p_target_weight_kg, target_weight_kg), goal = p_goal
    where user_id = current_user_id and status = 'active';
  end if;

  insert into public.user_goals (
    user_id, current_weight_kg, target_weight_kg, height_cm, birth_year, sex, goal, diet,
    calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, starting_weight_kg, goal_started_on, updated_at
  ) values (
    current_user_id, p_current_weight_kg, p_target_weight_kg, p_height_cm, p_birth_year, p_sex, p_goal, p_diet,
    p_calorie_goal, p_protein_goal_g, p_carbs_goal_g, p_fat_goal_g, effective_start, effective_started_on, now()
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

grant execute on function public.save_goal_plan(numeric,numeric,numeric,numeric,smallint,text,text,text,integer,numeric,numeric,numeric) to authenticated;
