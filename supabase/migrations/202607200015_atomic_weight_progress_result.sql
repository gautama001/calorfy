-- Return the updated goal profile from the same transaction as the weigh-in.

drop function if exists public.save_current_weight(numeric, date);

create function public.save_current_weight(measured_weight numeric, measurement_date date)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_entry public.weight_entries%rowtype;
  saved_goal public.user_goals%rowtype;
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
    updated_at = now()
  returning * into saved_goal;

  return jsonb_build_object('entry', to_jsonb(saved_entry), 'goal', to_jsonb(saved_goal));
end;
$$;

grant execute on function public.save_current_weight(numeric, date) to authenticated;
