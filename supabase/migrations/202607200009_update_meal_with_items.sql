-- Edit a meal and replace its nutritional snapshot atomically.

create or replace function public.update_meal_with_items(
  target_meal_id uuid,
  meal_name text,
  meal_category text,
  items jsonb
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

  if meal_category not in ('breakfast', 'lunch', 'snack', 'dinner') then
    raise exception 'Invalid meal category';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 50 then
    raise exception 'A meal requires between 1 and 50 items';
  end if;

  update public.meals
  set
    name = left(trim(meal_name), 200),
    category = meal_category,
    calories = (select coalesce(sum((value ->> 'calories')::numeric), 0) from jsonb_array_elements(items)),
    protein_g = (select coalesce(sum((value ->> 'protein')::numeric), 0) from jsonb_array_elements(items)),
    carbs_g = (select coalesce(sum((value ->> 'carbs')::numeric), 0) from jsonb_array_elements(items)),
    fat_g = (select coalesce(sum((value ->> 'fat')::numeric), 0) from jsonb_array_elements(items)),
    updated_at = now()
  where id = target_meal_id and user_id = current_user_id
  returning * into saved_meal;

  if not found then
    raise exception 'Meal not found';
  end if;

  if saved_meal.name = '' then
    raise exception 'Meal name is required';
  end if;

  delete from public.meal_items
  where meal_id = target_meal_id and user_id = current_user_id;

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

grant execute on function public.update_meal_with_items(uuid, text, text, jsonb)
  to authenticated;
