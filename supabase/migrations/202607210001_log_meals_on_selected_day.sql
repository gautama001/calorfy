-- Store a meal on the diary day selected by the user while preserving atomic item creation.

drop function if exists public.create_meal_with_items(text, text, uuid, jsonb);

create function public.create_meal_with_items(
  meal_name text,
  meal_category text,
  client_event_id uuid,
  items jsonb,
  meal_eaten_at timestamptz default now()
)
returns public.meals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_meal public.meals%rowtype;
  item jsonb;
  item_index integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if client_event_id is null then
    raise exception 'client_event_id is required';
  end if;

  select * into saved_meal
  from public.meals
  where user_id = current_user_id and client_id = client_event_id;

  if found then
    return saved_meal;
  end if;

  if meal_category not in ('breakfast', 'lunch', 'snack', 'dinner') then
    raise exception 'Invalid meal category';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 50 then
    raise exception 'A meal requires between 1 and 50 items';
  end if;

  insert into public.meals (
    user_id, client_id, name, category, calories, protein_g, carbs_g, fat_g, eaten_at
  )
  select
    current_user_id,
    client_event_id,
    left(trim(meal_name), 200),
    meal_category,
    coalesce(sum((value ->> 'calories')::numeric), 0),
    coalesce(sum((value ->> 'protein')::numeric), 0),
    coalesce(sum((value ->> 'carbs')::numeric), 0),
    coalesce(sum((value ->> 'fat')::numeric), 0),
    coalesce(meal_eaten_at, now())
  from jsonb_array_elements(items)
  returning * into saved_meal;

  if saved_meal.name = '' then
    raise exception 'Meal name is required';
  end if;

  for item in select value from jsonb_array_elements(items)
  loop
    insert into public.meal_items (
      meal_id, user_id, food_id, food_name, quantity, unit, grams,
      calories, protein_g, carbs_g, fat_g, sort_order
    ) values (
      saved_meal.id,
      current_user_id,
      nullif(item ->> 'food_id', '')::uuid,
      left(trim(item ->> 'food_name'), 300),
      (item ->> 'quantity')::numeric,
      item ->> 'unit',
      (item ->> 'grams')::numeric,
      coalesce((item ->> 'calories')::numeric, 0),
      coalesce((item ->> 'protein')::numeric, 0),
      coalesce((item ->> 'carbs')::numeric, 0),
      coalesce((item ->> 'fat')::numeric, 0),
      item_index
    );
    item_index := item_index + 1;
  end loop;

  return saved_meal;
end;
$$;

grant execute on function public.create_meal_with_items(text, text, uuid, jsonb, timestamptz)
  to authenticated;

notify pgrst, 'reload schema';
