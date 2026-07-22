-- Calorfy Pro foundation. A professional relationship alone grants no access
-- to health data; each scope is recorded separately and remains client-owned.

create table public.professional_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profession text not null check (profession in ('nutritionist', 'personal_trainer')),
  public_name text not null check (char_length(public_name) between 1 and 80),
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  organization_name text check (char_length(organization_name) <= 120),
  license_number text check (char_length(license_number) <= 80),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_invites (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (accepted_by is null and accepted_at is null)
    or (accepted_by is not null and accepted_at is not null)
  )
);

create table public.professional_client_relationships (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (professional_id, client_id),
  check (professional_id <> client_id),
  check ((status = 'active' and ended_at is null) or (status = 'ended' and ended_at is not null))
);

create table public.professional_client_permissions (
  relationship_id uuid primary key references public.professional_client_relationships(id) on delete cascade,
  share_diary boolean not null default false,
  share_weight boolean not null default false,
  share_goals boolean not null default false,
  share_photos boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.professional_access_audit (
  id bigint generated always as identity primary key,
  relationship_id uuid not null references public.professional_client_relationships(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('relationship_started', 'permissions_created', 'permissions_updated', 'relationship_ended')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index professional_invites_owner_idx
  on public.professional_invites (professional_id, created_at desc);
create index professional_relationships_client_idx
  on public.professional_client_relationships (client_id, status, updated_at desc);
create index professional_relationships_professional_idx
  on public.professional_client_relationships (professional_id, status, updated_at desc);
create index professional_access_audit_relationship_idx
  on public.professional_access_audit (relationship_id, created_at desc);

alter table public.professional_profiles enable row level security;
alter table public.professional_invites enable row level security;
alter table public.professional_client_relationships enable row level security;
alter table public.professional_client_permissions enable row level security;
alter table public.professional_access_audit enable row level security;

create policy "professional_profiles_select_own"
on public.professional_profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "professional_invites_select_own"
on public.professional_invites for select to authenticated
using ((select auth.uid()) = professional_id);

create policy "professional_relationships_select_participant"
on public.professional_client_relationships for select to authenticated
using ((select auth.uid()) in (professional_id, client_id));

create policy "professional_permissions_select_participant"
on public.professional_client_permissions for select to authenticated
using (
  exists (
    select 1
    from public.professional_client_relationships relationship
    where relationship.id = relationship_id
      and (select auth.uid()) in (relationship.professional_id, relationship.client_id)
  )
);

create policy "professional_permissions_update_client"
on public.professional_client_permissions for update to authenticated
using (
  exists (
    select 1
    from public.professional_client_relationships relationship
    where relationship.id = relationship_id
      and relationship.client_id = (select auth.uid())
      and relationship.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.professional_client_relationships relationship
    where relationship.id = relationship_id
      and relationship.client_id = (select auth.uid())
      and relationship.status = 'active'
  )
);

create policy "professional_audit_select_participant"
on public.professional_access_audit for select to authenticated
using (
  exists (
    select 1
    from public.professional_client_relationships relationship
    where relationship.id = relationship_id
      and (select auth.uid()) in (relationship.professional_id, relationship.client_id)
  )
);

create or replace function public.upsert_professional_profile(
  p_profession text,
  p_public_name text,
  p_country_code text default null,
  p_organization_name text default null,
  p_license_number text default null
)
returns public.professional_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_profile public.professional_profiles%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_profession not in ('nutritionist', 'personal_trainer') then raise exception 'Invalid profession'; end if;
  if char_length(trim(p_public_name)) not between 1 and 80 then raise exception 'Invalid public name'; end if;
  if p_country_code is not null and upper(p_country_code) !~ '^[A-Z]{2}$' then raise exception 'Invalid country code'; end if;

  insert into public.professional_profiles (
    user_id, profession, public_name, country_code, organization_name, license_number
  )
  values (
    current_user_id,
    p_profession,
    trim(p_public_name),
    case when p_country_code is null then null else upper(p_country_code) end,
    nullif(trim(p_organization_name), ''),
    nullif(trim(p_license_number), '')
  )
  on conflict (user_id) do update set
    profession = excluded.profession,
    public_name = excluded.public_name,
    country_code = excluded.country_code,
    organization_name = excluded.organization_name,
    license_number = excluded.license_number,
    verification_status = case
      when public.professional_profiles.profession is distinct from excluded.profession
        or public.professional_profiles.country_code is distinct from excluded.country_code
        or public.professional_profiles.license_number is distinct from excluded.license_number
      then 'unverified'
      else public.professional_profiles.verification_status
    end,
    updated_at = now()
  returning * into saved_profile;

  return saved_profile;
end;
$$;

create or replace function public.create_professional_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  raw_token text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.professional_profiles where user_id = current_user_id) then
    raise exception 'Professional profile required';
  end if;
  if (
    select count(*)
    from public.professional_invites
    where professional_id = current_user_id
      and accepted_at is null
      and revoked_at is null
      and expires_at > now()
  ) >= 10 then
    raise exception 'Too many active invitations';
  end if;

  raw_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.professional_invites (professional_id, token_hash, expires_at)
  values (
    current_user_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    now() + interval '7 days'
  );
  return raw_token;
end;
$$;

create or replace function public.preview_professional_invite(p_token text)
returns table (
  professional_name text,
  profession text,
  verification_status text,
  organization_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.public_name,
    profile.profession,
    profile.verification_status,
    profile.organization_name,
    invite.expires_at
  from public.professional_invites invite
  join public.professional_profiles profile on profile.user_id = invite.professional_id
  where invite.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and invite.accepted_at is null
    and invite.revoked_at is null
    and invite.expires_at > now()
    and auth.uid() is not null;
$$;

create or replace function public.accept_professional_invite(
  p_token text,
  p_share_diary boolean,
  p_share_weight boolean,
  p_share_goals boolean,
  p_share_photos boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  matched_invite public.professional_invites%rowtype;
  saved_relationship public.professional_client_relationships%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select * into matched_invite
  from public.professional_invites
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  for update;

  if matched_invite.id is null then raise exception 'Invitation is invalid or expired'; end if;
  if matched_invite.professional_id = current_user_id then raise exception 'A professional cannot invite their own account'; end if;

  update public.professional_invites
  set accepted_by = current_user_id, accepted_at = now()
  where id = matched_invite.id;

  insert into public.professional_client_relationships (professional_id, client_id)
  values (matched_invite.professional_id, current_user_id)
  on conflict (professional_id, client_id) do update set
    status = 'active',
    ended_at = null,
    updated_at = now()
  returning * into saved_relationship;

  insert into public.professional_client_permissions (
    relationship_id, share_diary, share_weight, share_goals, share_photos, updated_at
  )
  values (
    saved_relationship.id,
    p_share_diary,
    p_share_weight,
    p_share_goals,
    p_share_photos,
    now()
  )
  on conflict (relationship_id) do update set
    share_diary = excluded.share_diary,
    share_weight = excluded.share_weight,
    share_goals = excluded.share_goals,
    share_photos = excluded.share_photos,
    updated_at = now();

  insert into public.professional_access_audit (relationship_id, actor_user_id, action)
  values (saved_relationship.id, current_user_id, 'relationship_started');

  return saved_relationship.id;
end;
$$;

create or replace function public.revoke_professional_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  update public.professional_invites
  set revoked_at = now()
  where id = p_invite_id
    and professional_id = current_user_id
    and accepted_at is null
    and revoked_at is null;
  if not found then raise exception 'Active invitation not found'; end if;
end;
$$;

create or replace function public.end_professional_relationship(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  relationship public.professional_client_relationships%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select * into relationship
  from public.professional_client_relationships
  where id = p_relationship_id
    and current_user_id in (professional_id, client_id)
    and status = 'active'
  for update;
  if relationship.id is null then raise exception 'Active relationship not found'; end if;

  update public.professional_client_relationships
  set status = 'ended', ended_at = now(), updated_at = now()
  where id = relationship.id;

  insert into public.professional_access_audit (relationship_id, actor_user_id, action)
  values (relationship.id, current_user_id, 'relationship_ended');
end;
$$;

create or replace function public.audit_professional_permission_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.professional_access_audit (relationship_id, actor_user_id, action, details)
  values (
    new.relationship_id,
    auth.uid(),
    case when tg_op = 'INSERT' then 'permissions_created' else 'permissions_updated' end,
    jsonb_build_object(
      'share_diary', new.share_diary,
      'share_weight', new.share_weight,
      'share_goals', new.share_goals,
      'share_photos', new.share_photos
    )
  );
  return new;
end;
$$;

create trigger professional_permissions_audit_after_write
after insert or update on public.professional_client_permissions
for each row execute procedure public.audit_professional_permission_change();

revoke all on function public.upsert_professional_profile(text, text, text, text, text) from public;
revoke all on function public.create_professional_invite() from public;
revoke all on function public.preview_professional_invite(text) from public;
revoke all on function public.accept_professional_invite(text, boolean, boolean, boolean, boolean) from public;
revoke all on function public.revoke_professional_invite(uuid) from public;
revoke all on function public.end_professional_relationship(uuid) from public;

grant execute on function public.upsert_professional_profile(text, text, text, text, text) to authenticated;
grant execute on function public.create_professional_invite() to authenticated;
grant execute on function public.preview_professional_invite(text) to authenticated;
grant execute on function public.accept_professional_invite(text, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.revoke_professional_invite(uuid) to authenticated;
grant execute on function public.end_professional_relationship(uuid) to authenticated;
