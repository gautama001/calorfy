-- Keep goal preferences aligned with every eating style available in the catalog.
alter table public.user_goals drop constraint if exists user_goals_diet_check;
alter table public.user_goals add constraint user_goals_diet_check check (
  diet in ('balanced', 'high_protein', 'vegetarian', 'vegan', 'keto', 'low_carb', 'gluten_free', 'paleo', 'mediterranean', 'macrobiotic', 'raw')
);
