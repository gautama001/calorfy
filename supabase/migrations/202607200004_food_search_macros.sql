-- Search results used by the meal composer. Global foods remain available in
-- every market, while regional dishes receive a market ranking boost.
create or replace function public.search_foods_with_macros(
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
  energy_kcal numeric,
  protein_g numeric,
  carbohydrate_g numeric,
  fat_g numeric,
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
         energy.amount_per_100g as energy_kcal,
         protein.amount_per_100g as protein_g,
         carbs.amount_per_100g as carbohydrate_g,
         fat.amount_per_100g as fat_g,
         (greatest(
           ts_rank_cd(f.search_vector, query.tsq),
           similarity(public.normalize_food_name(f.canonical_name), query.normalized)
         ) + case
           when f.origin_country_code = market_code then 0.15
           when exists (select 1 from public.food_country_presence p where p.food_id = f.id and p.country_code = market_code) then 0.10
           else 0
         end)::real as rank
  from public.foods f
  cross join query
  left join public.food_nutrients energy on energy.food_id = f.id and energy.nutrient_code = 'energy_kcal'
  left join public.food_nutrients protein on protein.food_id = f.id and protein.nutrient_code = 'protein'
  left join public.food_nutrients carbs on carbs.food_id = f.id and carbs.nutrient_code = 'carbohydrate'
  left join public.food_nutrients fat on fat.food_id = f.id and fat.nutrient_code = 'fat_total'
  where f.verification_status = 'verified'
    and (
      market_code is null
      or f.origin_country_code = market_code
      or exists (select 1 from public.food_country_presence p where p.food_id = f.id and p.country_code = market_code)
      or (f.origin_country_code is null and not exists (
        select 1 from public.food_country_presence p where p.food_id = f.id
      ))
    )
    and (
      f.search_vector @@ query.tsq
      or public.normalize_food_name(f.canonical_name) % query.normalized
      or exists (select 1 from public.food_names n where n.food_id = f.id and n.normalized_name % query.normalized)
    )
  order by rank desc, f.canonical_name
  limit least(greatest(result_limit, 1), 50);
$$;

grant execute on function public.search_foods_with_macros(text, text, integer) to anon, authenticated;
