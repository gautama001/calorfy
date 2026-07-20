-- Calorfy LATAM food knowledge base.
-- Catalog writes intentionally have no client-facing policies: verified data is
-- curated through trusted import tooling / service-role processes only.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name_es text not null,
  name_pt text not null,
  name_en text not null,
  default_locale text not null,
  active boolean not null default true,
  sort_order smallint not null default 100
);

insert into public.countries (code, name_es, name_pt, name_en, default_locale, sort_order) values
  ('AR', 'Argentina', 'Argentina', 'Argentina', 'es-AR', 10),
  ('BO', 'Bolivia', 'Bolívia', 'Bolivia', 'es-BO', 20),
  ('BR', 'Brasil', 'Brasil', 'Brazil', 'pt-BR', 30),
  ('CL', 'Chile', 'Chile', 'Chile', 'es-CL', 40),
  ('CO', 'Colombia', 'Colômbia', 'Colombia', 'es-CO', 50),
  ('CR', 'Costa Rica', 'Costa Rica', 'Costa Rica', 'es-CR', 60),
  ('CU', 'Cuba', 'Cuba', 'Cuba', 'es-CU', 70),
  ('DO', 'República Dominicana', 'República Dominicana', 'Dominican Republic', 'es-DO', 80),
  ('EC', 'Ecuador', 'Equador', 'Ecuador', 'es-EC', 90),
  ('SV', 'El Salvador', 'El Salvador', 'El Salvador', 'es-SV', 100),
  ('GT', 'Guatemala', 'Guatemala', 'Guatemala', 'es-GT', 110),
  ('HT', 'Haití', 'Haiti', 'Haiti', 'fr-HT', 120),
  ('HN', 'Honduras', 'Honduras', 'Honduras', 'es-HN', 130),
  ('MX', 'México', 'México', 'Mexico', 'es-MX', 140),
  ('NI', 'Nicaragua', 'Nicarágua', 'Nicaragua', 'es-NI', 150),
  ('PA', 'Panamá', 'Panamá', 'Panama', 'es-PA', 160),
  ('PY', 'Paraguay', 'Paraguai', 'Paraguay', 'es-PY', 170),
  ('PE', 'Perú', 'Peru', 'Peru', 'es-PE', 180),
  ('PR', 'Puerto Rico', 'Porto Rico', 'Puerto Rico', 'es-PR', 190),
  ('UY', 'Uruguay', 'Uruguai', 'Uruguay', 'es-UY', 200),
  ('VE', 'Venezuela', 'Venezuela', 'Venezuela', 'es-VE', 210);

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  code text,
  name text not null,
  region_type text not null default 'region' check (region_type in ('state', 'province', 'department', 'region', 'territory', 'city')),
  unique (country_code, code),
  unique (country_code, name)
);

create table public.catalog_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  publisher text not null,
  country_code text references public.countries(code),
  source_url text,
  version text,
  published_year smallint check (published_year between 1900 and 2100),
  license_name text,
  license_url text,
  attribution_text text,
  usage_status text not null default 'pending_review'
    check (usage_status in ('pending_review', 'approved', 'restricted', 'internal', 'rejected')),
  import_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (name, version)
);

create table public.food_groups (
  code text primary key,
  parent_code text references public.food_groups(code),
  name_es text not null,
  name_pt text not null,
  name_en text not null,
  sort_order smallint not null default 100
);

insert into public.food_groups (code, name_es, name_pt, name_en, sort_order) values
  ('CEREALS', 'Cereales, tubérculos y derivados', 'Cereais, tubérculos e derivados', 'Cereals, roots and products', 10),
  ('LEGUMES', 'Legumbres y derivados', 'Leguminosas e derivados', 'Legumes and products', 20),
  ('VEGETABLES', 'Verduras y hortalizas', 'Verduras e hortaliças', 'Vegetables', 30),
  ('FRUITS', 'Frutas y derivados', 'Frutas e derivados', 'Fruits and products', 40),
  ('MEAT', 'Carnes y derivados', 'Carnes e derivados', 'Meat and products', 50),
  ('FISH', 'Pescados y mariscos', 'Peixes e frutos do mar', 'Fish and seafood', 60),
  ('DAIRY', 'Leche y derivados', 'Leite e derivados', 'Milk and dairy', 70),
  ('EGGS', 'Huevos y derivados', 'Ovos e derivados', 'Eggs and products', 80),
  ('FATS', 'Aceites y grasas', 'Óleos e gorduras', 'Fats and oils', 90),
  ('SWEETS', 'Azúcares y dulces', 'Açúcares e doces', 'Sugars and sweets', 100),
  ('BEVERAGES', 'Bebidas', 'Bebidas', 'Beverages', 110),
  ('PREPARED', 'Preparaciones y platos', 'Preparações e pratos', 'Prepared dishes', 120),
  ('CONDIMENTS', 'Condimentos y salsas', 'Condimentos e molhos', 'Condiments and sauces', 130),
  ('OTHER', 'Otros alimentos', 'Outros alimentos', 'Other foods', 140);

create table public.nutrients (
  code text primary key,
  infoods_tag text,
  name_es text not null,
  name_pt text not null,
  name_en text not null,
  unit text not null check (unit in ('kcal', 'kJ', 'g', 'mg', 'µg', 'IU')),
  category text not null check (category in ('energy', 'proximate', 'carbohydrate', 'lipid', 'mineral', 'vitamin', 'other')),
  decimal_places smallint not null default 2 check (decimal_places between 0 and 6),
  display_order smallint not null default 100,
  daily_value numeric check (daily_value > 0),
  unique (infoods_tag, unit)
);

insert into public.nutrients (code, infoods_tag, name_es, name_pt, name_en, unit, category, decimal_places, display_order) values
  ('energy_kcal', 'ENERC', 'Energía', 'Energia', 'Energy', 'kcal', 'energy', 0, 10),
  ('energy_kj', 'ENERC', 'Energía', 'Energia', 'Energy', 'kJ', 'energy', 0, 11),
  ('water', 'WATER', 'Agua', 'Água', 'Water', 'g', 'proximate', 2, 20),
  ('protein', 'PROCNT', 'Proteína', 'Proteína', 'Protein', 'g', 'proximate', 2, 30),
  ('fat_total', 'FAT', 'Grasa total', 'Gordura total', 'Total fat', 'g', 'lipid', 2, 40),
  ('carbohydrate', 'CHOCDF', 'Carbohidratos', 'Carboidratos', 'Carbohydrate', 'g', 'carbohydrate', 2, 50),
  ('fiber', 'FIBTG', 'Fibra alimentaria', 'Fibra alimentar', 'Dietary fiber', 'g', 'carbohydrate', 2, 60),
  ('sugars', 'SUGAR', 'Azúcares', 'Açúcares', 'Sugars', 'g', 'carbohydrate', 2, 70),
  ('ash', 'ASH', 'Cenizas', 'Cinzas', 'Ash', 'g', 'proximate', 2, 80),
  ('calcium', 'CA', 'Calcio', 'Cálcio', 'Calcium', 'mg', 'mineral', 1, 90),
  ('iron', 'FE', 'Hierro', 'Ferro', 'Iron', 'mg', 'mineral', 2, 100),
  ('magnesium', 'MG', 'Magnesio', 'Magnésio', 'Magnesium', 'mg', 'mineral', 1, 110),
  ('phosphorus', 'P', 'Fósforo', 'Fósforo', 'Phosphorus', 'mg', 'mineral', 1, 120),
  ('potassium', 'K', 'Potasio', 'Potássio', 'Potassium', 'mg', 'mineral', 1, 130),
  ('sodium', 'NA', 'Sodio', 'Sódio', 'Sodium', 'mg', 'mineral', 1, 140),
  ('zinc', 'ZN', 'Zinc', 'Zinco', 'Zinc', 'mg', 'mineral', 2, 150),
  ('vitamin_a_rae', 'VITA_RAE', 'Vitamina A', 'Vitamina A', 'Vitamin A', 'µg', 'vitamin', 1, 160),
  ('thiamin', 'THIA', 'Tiamina', 'Tiamina', 'Thiamin', 'mg', 'vitamin', 3, 170),
  ('riboflavin', 'RIBF', 'Riboflavina', 'Riboflavina', 'Riboflavin', 'mg', 'vitamin', 3, 180),
  ('niacin', 'NIA', 'Niacina', 'Niacina', 'Niacin', 'mg', 'vitamin', 2, 190),
  ('vitamin_c', 'VITC', 'Vitamina C', 'Vitamina C', 'Vitamin C', 'mg', 'vitamin', 2, 200),
  ('folate_dfe', 'FOLDFE', 'Folato', 'Folato', 'Folate', 'µg', 'vitamin', 1, 210),
  ('cholesterol', 'CHOLE', 'Colesterol', 'Colesterol', 'Cholesterol', 'mg', 'lipid', 1, 220),
  ('fat_saturated', 'FASAT', 'Grasas saturadas', 'Gorduras saturadas', 'Saturated fat', 'g', 'lipid', 2, 230),
  ('fat_monounsaturated', 'FAMS', 'Grasas monoinsaturadas', 'Gorduras monoinsaturadas', 'Monounsaturated fat', 'g', 'lipid', 2, 240),
  ('fat_polyunsaturated', 'FAPU', 'Grasas poliinsaturadas', 'Gorduras poli-insaturadas', 'Polyunsaturated fat', 'g', 'lipid', 2, 250);

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  scientific_name text,
  description text,
  food_type text not null default 'generic'
    check (food_type in ('generic', 'raw', 'processed', 'prepared', 'traditional_dish', 'branded')),
  group_code text not null references public.food_groups(code),
  origin_country_code text references public.countries(code),
  origin_region_id uuid references public.regions(id),
  source_id uuid references public.catalog_sources(id),
  source_food_code text,
  verification_status text not null default 'draft'
    check (verification_status in ('draft', 'in_review', 'verified', 'deprecated', 'rejected')),
  quality_grade text check (quality_grade in ('A', 'B', 'C', 'D')),
  edible_portion_percent numeric(5,2) check (edible_portion_percent between 0 and 100),
  density_g_ml numeric(8,4) check (density_g_ml > 0),
  default_portion_g numeric(8,2) check (default_portion_g > 0),
  image_path text,
  tags text[] not null default '{}',
  search_vector tsvector,
  metadata jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (source_id, source_food_code)
);

create table public.food_names (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  country_code text references public.countries(code),
  locale text not null,
  name text not null,
  normalized_name text not null default '',
  name_type text not null default 'common'
    check (name_type in ('primary', 'common', 'regional', 'synonym', 'misspelling', 'brand')),
  is_searchable boolean not null default true,
  created_at timestamptz not null default now()
);

create index food_names_food_idx on public.food_names(food_id);
create index food_names_normalized_trgm_idx on public.food_names using gin (normalized_name gin_trgm_ops);
create unique index food_names_unique_idx on public.food_names (food_id, coalesce(country_code, ''), locale, normalized_name);

create table public.food_country_presence (
  food_id uuid not null references public.foods(id) on delete cascade,
  country_code text not null references public.countries(code) on delete cascade,
  region_id uuid references public.regions(id),
  popularity smallint check (popularity between 1 and 5),
  is_traditional boolean not null default false,
  seasonality smallint[] check (seasonality <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]),
  notes text,
  primary key (food_id, country_code)
);

create table public.food_nutrients (
  food_id uuid not null references public.foods(id) on delete cascade,
  nutrient_code text not null references public.nutrients(code),
  amount_per_100g numeric(14,6),
  min_amount numeric(14,6),
  max_amount numeric(14,6),
  value_type text not null default 'measured'
    check (value_type in ('measured', 'calculated', 'estimated', 'borrowed', 'trace', 'not_detected')),
  analytical_method text,
  source_id uuid references public.catalog_sources(id),
  confidence smallint check (confidence between 1 and 5),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (food_id, nutrient_code),
  check (amount_per_100g is null or amount_per_100g >= 0),
  check (min_amount is null or max_amount is null or min_amount <= max_amount)
);

create table public.food_portions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  country_code text references public.countries(code),
  locale text not null,
  label text not null,
  qualifier text,
  grams numeric(9,3) not null check (grams > 0),
  household_measure_code text,
  source_id uuid references public.catalog_sources(id),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index food_portions_food_idx on public.food_portions(food_id);

create table public.recipe_ingredients (
  recipe_food_id uuid not null references public.foods(id) on delete cascade,
  ingredient_food_id uuid not null references public.foods(id),
  sequence smallint not null check (sequence > 0),
  grams numeric(10,3) not null check (grams > 0),
  preparation_note text,
  yield_factor numeric(8,5) check (yield_factor > 0),
  retention_factor numeric(8,5) check (retention_factor between 0 and 1),
  primary key (recipe_food_id, sequence),
  check (recipe_food_id <> ingredient_food_id)
);

create table public.food_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_type text not null check (submission_type in ('new_food', 'correction', 'new_name', 'new_portion', 'new_recipe')),
  food_id uuid references public.foods(id),
  country_code text not null references public.countries(code),
  payload jsonb not null,
  evidence_paths text[] not null default '{}',
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'in_review', 'accepted', 'rejected', 'withdrawn')),
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_submissions_user_idx on public.food_submissions(user_id, created_at desc);
create index foods_search_idx on public.foods using gin(search_vector);
create index foods_country_idx on public.foods(origin_country_code, verification_status);
create index foods_group_idx on public.foods(group_code, verification_status);

create or replace function public.normalize_food_name(input text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(lower(public.unaccent(coalesce(input, ''))), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.set_food_name_normalized()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.normalized_name := public.normalize_food_name(new.name);
  return new;
end;
$$;

create trigger food_names_normalize_before_write
before insert or update of name on public.food_names
for each row execute procedure public.set_food_name_normalized();

create or replace function public.refresh_food_search_vector(target_food_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.foods f
  set search_vector = to_tsvector(
    'simple',
    public.normalize_food_name(
      concat_ws(' ', f.canonical_name, f.scientific_name,
        (select string_agg(n.name, ' ') from public.food_names n where n.food_id = f.id and n.is_searchable)
      )
    )
  )
  where f.id = target_food_id;
$$;

create or replace function public.food_search_vector_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_food_search_vector(coalesce(new.food_id, old.food_id));
  return coalesce(new, old);
end;
$$;

create trigger food_names_refresh_search_after_write
after insert or update or delete on public.food_names
for each row execute procedure public.food_search_vector_trigger();

create or replace function public.food_self_search_vector_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.search_vector := to_tsvector('simple', public.normalize_food_name(concat_ws(' ', new.canonical_name, new.scientific_name)));
  return new;
end;
$$;

create trigger foods_refresh_search_before_write
before insert or update of canonical_name, scientific_name on public.foods
for each row execute procedure public.food_self_search_vector_trigger();

create or replace function public.search_foods(
  search_term text,
  market_code text default null,
  result_limit integer default 20
)
returns table (
  id uuid,
  canonical_name text,
  display_name text,
  food_type text,
  group_code text,
  origin_country_code text,
  default_portion_g numeric,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with query as (
    select public.normalize_food_name(search_term) as normalized,
           plainto_tsquery('simple', public.normalize_food_name(search_term)) as tsq
  )
  select f.id,
         f.canonical_name,
         coalesce(
           (select n.name from public.food_names n
            where n.food_id = f.id
              and (market_code is null or n.country_code = market_code or n.country_code is null)
            order by (n.country_code = market_code) desc nulls last, (n.name_type = 'primary') desc
            limit 1),
           f.canonical_name
         ) as display_name,
         f.food_type,
         f.group_code,
         f.origin_country_code,
         f.default_portion_g,
         greatest(
           ts_rank_cd(f.search_vector, query.tsq),
           similarity(public.normalize_food_name(f.canonical_name), query.normalized)
         )::real as rank
  from public.foods f, query
  where f.verification_status = 'verified'
    and (market_code is null or f.origin_country_code = market_code or exists (
      select 1 from public.food_country_presence p where p.food_id = f.id and p.country_code = market_code
    ))
    and (
      f.search_vector @@ query.tsq
      or public.normalize_food_name(f.canonical_name) % query.normalized
      or exists (select 1 from public.food_names n where n.food_id = f.id and n.normalized_name % query.normalized)
    )
  order by rank desc, f.canonical_name
  limit least(greatest(result_limit, 1), 50);
$$;

alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.catalog_sources enable row level security;
alter table public.food_groups enable row level security;
alter table public.nutrients enable row level security;
alter table public.foods enable row level security;
alter table public.food_names enable row level security;
alter table public.food_country_presence enable row level security;
alter table public.food_nutrients enable row level security;
alter table public.food_portions enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.food_submissions enable row level security;

create policy "countries_public_read" on public.countries for select to anon, authenticated using (active);
create policy "regions_public_read" on public.regions for select to anon, authenticated using (true);
create policy "groups_public_read" on public.food_groups for select to anon, authenticated using (true);
create policy "nutrients_public_read" on public.nutrients for select to anon, authenticated using (true);
create policy "sources_approved_read" on public.catalog_sources for select to anon, authenticated using (usage_status = 'approved');
create policy "foods_verified_read" on public.foods for select to anon, authenticated using (verification_status = 'verified');
create policy "food_names_verified_read" on public.food_names for select to anon, authenticated using (
  exists (select 1 from public.foods f where f.id = food_id and f.verification_status = 'verified')
);
create policy "food_presence_verified_read" on public.food_country_presence for select to anon, authenticated using (
  exists (select 1 from public.foods f where f.id = food_id and f.verification_status = 'verified')
);
create policy "food_nutrients_verified_read" on public.food_nutrients for select to anon, authenticated using (
  exists (select 1 from public.foods f where f.id = food_id and f.verification_status = 'verified')
);
create policy "food_portions_verified_read" on public.food_portions for select to anon, authenticated using (
  exists (select 1 from public.foods f where f.id = food_id and f.verification_status = 'verified')
);
create policy "recipe_ingredients_verified_read" on public.recipe_ingredients for select to anon, authenticated using (
  exists (select 1 from public.foods f where f.id = recipe_food_id and f.verification_status = 'verified')
);

create policy "submissions_insert_own" on public.food_submissions for insert to authenticated
with check ((select auth.uid()) = user_id and status in ('draft', 'submitted'));
create policy "submissions_select_own" on public.food_submissions for select to authenticated
using ((select auth.uid()) = user_id);
create policy "submissions_update_own_draft" on public.food_submissions for update to authenticated
using ((select auth.uid()) = user_id and status in ('draft', 'submitted'))
with check ((select auth.uid()) = user_id and status in ('draft', 'submitted', 'withdrawn'));
create policy "submissions_delete_own_draft" on public.food_submissions for delete to authenticated
using ((select auth.uid()) = user_id and status = 'draft');

grant execute on function public.search_foods(text, text, integer) to anon, authenticated;
