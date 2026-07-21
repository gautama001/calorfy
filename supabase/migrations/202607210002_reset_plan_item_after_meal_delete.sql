-- Keep a weekly plan actionable when its linked diary meal is deleted.

create or replace function public.reset_weekly_plan_item_after_meal_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.client_id is not null then
    update public.weekly_plan_items
    set status = 'planned', updated_at = now()
    where id = old.client_id
      and user_id = old.user_id
      and status = 'added';
  end if;
  return old;
end;
$$;

drop trigger if exists reset_weekly_plan_item_after_meal_delete on public.meals;
create trigger reset_weekly_plan_item_after_meal_delete
after delete on public.meals
for each row execute function public.reset_weekly_plan_item_after_meal_delete();
