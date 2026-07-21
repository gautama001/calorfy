-- Lightweight meal memory: a logged meal can become a reusable favorite.

alter table public.meals
  add column if not exists is_favorite boolean not null default false;

create index if not exists meals_user_favorite_eaten_idx
  on public.meals (user_id, is_favorite desc, eaten_at desc);
