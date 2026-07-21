-- Preserve every component of a logged meal and make retries idempotent.

alter table public.meals
  add column if not exists client_id uuid;

create unique index if not exists meals_user_client_id_idx
  on public.meals (user_id, client_id)
  where client_id is not null;

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  food_name text not null check (char_length(food_name) between 1 and 300),
  quantity numeric(10,3) not null check (quantity > 0),
  unit text not null check (unit in ('g', 'ml', 'tbsp')),
  grams numeric(10,3) not null check (grams > 0 and grams <= 5000),
  calories numeric(9,2) not null default 0 check (calories >= 0),
  protein_g numeric(9,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(9,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(9,2) not null default 0 check (fat_g >= 0),
  sort_order smallint not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index meal_items_meal_idx on public.meal_items (meal_id, sort_order);
create index meal_items_user_created_idx on public.meal_items (user_id, created_at desc);

alter table public.meal_items enable row level security;

create policy "meal_items_select_own" on public.meal_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "meal_items_insert_own" on public.meal_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meal_items_update_own" on public.meal_items
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "meal_items_delete_own" on public.meal_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.create_meal_with_items(
  meal_name text,
  meal_category text,
  client_event_id uuid,
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
    user_id, client_id, name, category, calories, protein_g, carbs_g, fat_g
  )
  select
    current_user_id,
    client_event_id,
    left(trim(meal_name), 200),
    meal_category,
    coalesce(sum((value ->> 'calories')::numeric), 0),
    coalesce(sum((value ->> 'protein')::numeric), 0),
    coalesce(sum((value ->> 'carbs')::numeric), 0),
    coalesce(sum((value ->> 'fat')::numeric), 0)
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

grant execute on function public.create_meal_with_items(text, text, uuid, jsonb)
  to authenticated;
