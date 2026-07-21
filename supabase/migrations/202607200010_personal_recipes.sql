-- Personal recipes are reusable templates, independent from diary history.

create table public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_meal_id uuid references public.meals(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  category text not null check (category in ('breakfast', 'lunch', 'snack', 'dinner')),
  yield_quantity numeric(9,2) not null default 1 check (yield_quantity > 0 and yield_quantity <= 1000),
  yield_label text not null default 'porciones' check (char_length(yield_label) between 1 and 30),
  calories numeric(10,2) not null default 0 check (calories >= 0),
  protein_g numeric(10,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(10,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(10,2) not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.meal_templates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  food_name text not null check (char_length(food_name) between 1 and 300),
  quantity numeric(10,3) not null check (quantity > 0),
  unit text not null check (unit in ('g', 'ml', 'tbsp')),
  grams numeric(10,3) not null check (grams > 0 and grams <= 50000),
  calories numeric(10,2) not null default 0 check (calories >= 0),
  protein_g numeric(10,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(10,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(10,2) not null default 0 check (fat_g >= 0),
  sort_order smallint not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index meal_templates_user_updated_idx on public.meal_templates (user_id, updated_at desc);
create index meal_template_items_template_idx on public.meal_template_items (template_id, sort_order);

alter table public.meal_templates enable row level security;
alter table public.meal_template_items enable row level security;

create policy "meal_templates_select_own" on public.meal_templates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "meal_templates_insert_own" on public.meal_templates for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "meal_templates_update_own" on public.meal_templates for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "meal_templates_delete_own" on public.meal_templates for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "meal_template_items_select_own" on public.meal_template_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "meal_template_items_insert_own" on public.meal_template_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "meal_template_items_update_own" on public.meal_template_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "meal_template_items_delete_own" on public.meal_template_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.create_meal_template(
  template_name text,
  template_category text,
  template_yield numeric,
  template_yield_label text,
  source_meal uuid,
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
  if source_meal is not null and not exists (
    select 1 from public.meals where id = source_meal and user_id = current_user_id
  ) then
    raise exception 'Source meal not found';
  end if;

  insert into public.meal_templates (
    user_id, source_meal_id, name, category, yield_quantity, yield_label,
    calories, protein_g, carbs_g, fat_g
  )
  select
    current_user_id,
    source_meal,
    left(trim(template_name), 100),
    template_category,
    template_yield,
    left(trim(template_yield_label), 30),
    coalesce(sum((value ->> 'calories')::numeric), 0),
    coalesce(sum((value ->> 'protein')::numeric), 0),
    coalesce(sum((value ->> 'carbs')::numeric), 0),
    coalesce(sum((value ->> 'fat')::numeric), 0)
  from jsonb_array_elements(items)
  returning * into saved_template;

  if saved_template.name = '' or saved_template.yield_label = '' then
    raise exception 'Recipe name and yield label are required';
  end if;

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

grant execute on function public.create_meal_template(text, text, numeric, text, uuid, jsonb)
  to authenticated;
