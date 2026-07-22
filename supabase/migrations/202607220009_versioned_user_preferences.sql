-- Partial, versioned preference writes for safe multi-device synchronization.

alter table public.profiles
  add column if not exists preferences_revision bigint not null default 0,
  add column if not exists preferences_field_versions jsonb not null default
    '{"preferred_language":0,"theme":0,"reminder_time":0,"nutrition_targets_mode":0}'::jsonb;

create or replace function public.patch_user_preferences(
  p_patch jsonb,
  p_expected_versions jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  preferred_language text,
  theme text,
  reminder_time time,
  nutrition_targets_mode text,
  preferences_initialized boolean,
  preferences_revision bigint,
  preferences_field_versions jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.profiles%rowtype;
  next_revision bigint;
  next_versions jsonb;
  invalid_key text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then raise exception 'Invalid preference patch'; end if;

  select candidate.key into invalid_key
  from jsonb_object_keys(p_patch) as candidate(key)
  where candidate.key not in ('preferred_language', 'theme', 'reminder_time', 'nutrition_targets_mode')
  limit 1;
  if invalid_key is not null then raise exception 'Invalid preference field: %', invalid_key; end if;

  select * into current_row from public.profiles where profiles.id = auth.uid() for update;
  if current_row.id is null then raise exception 'Profile not found'; end if;

  if p_patch ? 'preferred_language' and p_patch->>'preferred_language' not in ('es', 'en', 'pt') then raise exception 'Invalid language'; end if;
  if p_patch ? 'theme' and p_patch->>'theme' not in ('light', 'dark') then raise exception 'Invalid theme'; end if;
  if p_patch ? 'reminder_time' and not ((p_patch->>'reminder_time') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then raise exception 'Invalid reminder time'; end if;
  if p_patch ? 'nutrition_targets_mode' and p_patch->>'nutrition_targets_mode' not in ('auto', 'manual') then raise exception 'Invalid nutrition mode'; end if;

  if p_patch ? 'nutrition_targets_mode'
    and p_expected_versions ? 'nutrition_targets_mode'
    and (p_expected_versions->>'nutrition_targets_mode')::bigint
      <> coalesce((current_row.preferences_field_versions->>'nutrition_targets_mode')::bigint, 0)
  then
    raise exception using errcode = '40001', message = 'PREFERENCE_CONFLICT:nutritionTargetsMode';
  end if;

  if p_patch = '{}'::jsonb then
    return query select current_row.id, current_row.preferred_language, current_row.theme,
      current_row.reminder_time, current_row.nutrition_targets_mode,
      current_row.preferences_initialized, current_row.preferences_revision,
      current_row.preferences_field_versions;
    return;
  end if;

  next_revision := current_row.preferences_revision + 1;
  next_versions := current_row.preferences_field_versions;
  if p_patch ? 'preferred_language' then next_versions := next_versions || jsonb_build_object('preferred_language', next_revision); end if;
  if p_patch ? 'theme' then next_versions := next_versions || jsonb_build_object('theme', next_revision); end if;
  if p_patch ? 'reminder_time' then next_versions := next_versions || jsonb_build_object('reminder_time', next_revision); end if;
  if p_patch ? 'nutrition_targets_mode' then next_versions := next_versions || jsonb_build_object('nutrition_targets_mode', next_revision); end if;

  return query
  update public.profiles profile set
    preferred_language = case when p_patch ? 'preferred_language' then p_patch->>'preferred_language' else profile.preferred_language end,
    theme = case when p_patch ? 'theme' then p_patch->>'theme' else profile.theme end,
    reminder_time = case when p_patch ? 'reminder_time' then (p_patch->>'reminder_time')::time else profile.reminder_time end,
    nutrition_targets_mode = case when p_patch ? 'nutrition_targets_mode' then p_patch->>'nutrition_targets_mode' else profile.nutrition_targets_mode end,
    preferences_initialized = true,
    preferences_revision = next_revision,
    preferences_field_versions = next_versions,
    updated_at = now()
  where profile.id = auth.uid()
  returning profile.id, profile.preferred_language, profile.theme, profile.reminder_time,
    profile.nutrition_targets_mode, profile.preferences_initialized,
    profile.preferences_revision, profile.preferences_field_versions;
end;
$$;

revoke all on function public.patch_user_preferences(jsonb, jsonb) from public;
grant execute on function public.patch_user_preferences(jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
