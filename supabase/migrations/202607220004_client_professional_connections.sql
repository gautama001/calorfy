-- Client-side read model for active professional relationships. This exposes
-- professional identity and the permissions owned by the authenticated client.

create or replace function public.get_client_professional_connections()
returns table (
  relationship_id uuid,
  professional_id uuid,
  professional_name text,
  profession text,
  verification_status text,
  organization_name text,
  started_at timestamptz,
  share_diary boolean,
  share_weight boolean,
  share_goals boolean,
  share_photos boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select relationship.id, relationship.professional_id, profile.public_name,
    profile.profession, profile.verification_status, profile.organization_name,
    relationship.started_at, permission.share_diary, permission.share_weight,
    permission.share_goals, permission.share_photos
  from public.professional_client_relationships relationship
  join public.professional_profiles profile on profile.user_id = relationship.professional_id
  join public.professional_client_permissions permission on permission.relationship_id = relationship.id
  where relationship.client_id = auth.uid() and relationship.status = 'active'
  order by relationship.updated_at desc;
$$;

revoke all on function public.get_client_professional_connections() from public;
grant execute on function public.get_client_professional_connections() to authenticated;
