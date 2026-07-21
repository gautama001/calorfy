-- A weigh-in and the user's current weight must never diverge.

create or replace function public.save_current_weight(
  measured_weight numeric,
  measurement_date date
)
returns public.weight_entries
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_entry public.weight_entries%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if measured_weight <= 0 or measured_weight >= 500 then
    raise exception 'Invalid weight';
  end if;

  insert into public.weight_entries (user_id, weight_kg, measured_on)
  values (current_user_id, measured_weight, measurement_date)
  on conflict (user_id, measured_on)
  do update set weight_kg = excluded.weight_kg
  returning * into saved_entry;

  insert into public.user_goals (user_id, current_weight_kg, updated_at)
  values (current_user_id, measured_weight, now())
  on conflict (user_id)
  do update set current_weight_kg = excluded.current_weight_kg, updated_at = now();

  return saved_entry;
end;
$$;

grant execute on function public.save_current_weight(numeric, date) to authenticated;
