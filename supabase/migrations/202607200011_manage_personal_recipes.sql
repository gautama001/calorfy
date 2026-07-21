-- Update recipe metadata and ingredients as one atomic operation.

create or replace function public.update_meal_template(
  target_template_id uuid,
  template_name text,
  template_category text,
  template_yield numeric,
  template_yield_label text,
  items jsonb
)
returns public.meal_templates
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_template public.meal_templates%rowtype;
  item jsonb;
  item_index integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if template_category not in ('breakfast', 'lunch', 'snack', 'dinner') then
    raise exception 'Invalid recipe category';
  end if;
  if template_yield <= 0 or template_yield > 1000 then
    raise exception 'Invalid recipe yield';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 50 then
    raise exception 'A recipe requires between 1 and 50 items';
  end if;

  update public.meal_templates
  set
    name = left(trim(template_name), 100),
    category = template_category,
    yield_quantity = template_yield,
    yield_label = left(trim(template_yield_label), 30),
    calories = (select coalesce(sum((value ->> 'calories')::numeric), 0) from jsonb_array_elements(items)),
    protein_g = (select coalesce(sum((value ->> 'protein')::numeric), 0) from jsonb_array_elements(items)),
    carbs_g = (select coalesce(sum((value ->> 'carbs')::numeric), 0) from jsonb_array_elements(items)),
    fat_g = (select coalesce(sum((value ->> 'fat')::numeric), 0) from jsonb_array_elements(items)),
    updated_at = now()
  where id = target_template_id and user_id = current_user_id
  returning * into saved_template;

  if not found then
    raise exception 'Recipe not found';
  end if;
  if saved_template.name = '' or saved_template.yield_label = '' then
    raise exception 'Recipe name and yield label are required';
  end if;

  delete from public.meal_template_items
  where template_id = target_template_id and user_id = current_user_id;

  for item in select value from jsonb_array_elements(items)
  loop
    insert into public.meal_template_items (
      template_id, user_id, food_id, food_name, quantity, unit, grams,
      calories, protein_g, carbs_g, fat_g, sort_order
    ) values (
      saved_template.id,
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

  return saved_template;
end;
$$;

grant execute on function public.update_meal_template(uuid, text, text, numeric, text, jsonb)
  to authenticated;
