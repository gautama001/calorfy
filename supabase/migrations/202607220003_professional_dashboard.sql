-- Professional dashboard read model. It exposes only active relationships and
-- returns each health field when the client explicitly enabled that scope.

create or replace function public.get_professional_client_summaries()
returns table (
  relationship_id uuid,
  client_id uuid,
  display_name text,
  started_at timestamptz,
  share_diary boolean,
  share_weight boolean,
  share_goals boolean,
  share_photos boolean,
  current_weight_kg numeric,
  last_weight_on date,
  target_weight_kg numeric,
  calorie_goal integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    relationship.id,
    relationship.client_id,
    coalesce(nullif(trim(profile.display_name), ''), 'Cliente Calorfy'),
    relationship.started_at,
    permission.share_diary,
    permission.share_weight,
    permission.share_goals,
    permission.share_photos,
    case when permission.share_weight then latest_weight.weight_kg else null end,
    case when permission.share_weight then latest_weight.measured_on else null end,
    case when permission.share_goals then goal.target_weight_kg else null end,
    case when permission.share_goals then goal.calorie_goal else null end
  from public.professional_client_relationships relationship
  join public.professional_client_permissions permission
    on permission.relationship_id = relationship.id
  left join public.profiles profile
    on profile.id = relationship.client_id
  left join public.user_goals goal
    on goal.user_id = relationship.client_id
  left join lateral (
    select entry.weight_kg, entry.measured_on
    from public.weight_entries entry
    where entry.user_id = relationship.client_id
    order by entry.measured_on desc, entry.created_at desc
    limit 1
  ) latest_weight on true
  where relationship.professional_id = auth.uid()
    and relationship.status = 'active'
  order by relationship.updated_at desc;
$$;

revoke all on function public.get_professional_client_summaries() from public;
grant execute on function public.get_professional_client_summaries() to authenticated;

