import { supabase } from '@/lib/supabase';

export type Profession = 'nutritionist' | 'personal_trainer';
export type ProfessionalVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ProfessionalRelationshipStatus = 'active' | 'ended';

export type ProfessionalProfile = {
  userId: string;
  profession: Profession;
  publicName: string;
  countryCode: string | null;
  organizationName: string | null;
  licenseNumber: string | null;
  verificationStatus: ProfessionalVerificationStatus;
};

export type ProfessionalPermissions = {
  shareDiary: boolean;
  shareWeight: boolean;
  shareGoals: boolean;
  sharePhotos: boolean;
};

export type ProfessionalInvitePreview = {
  professionalName: string;
  profession: Profession;
  verificationStatus: ProfessionalVerificationStatus;
  organizationName: string | null;
  expiresAt: string;
};

export type ProfessionalRelationship = {
  id: string;
  professionalId: string;
  clientId: string;
  status: ProfessionalRelationshipStatus;
  startedAt: string;
  endedAt: string | null;
  permissions: ProfessionalPermissions | null;
};

type ProfileRow = {
  user_id: string;
  profession: Profession;
  public_name: string;
  country_code: string | null;
  organization_name: string | null;
  license_number: string | null;
  verification_status: ProfessionalVerificationStatus;
};

type PermissionsRow = {
  share_diary: boolean;
  share_weight: boolean;
  share_goals: boolean;
  share_photos: boolean;
};

type RelationshipRow = {
  id: string;
  professional_id: string;
  client_id: string;
  status: ProfessionalRelationshipStatus;
  started_at: string;
  ended_at: string | null;
  professional_client_permissions: PermissionsRow | null;
};

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function mapProfile(row: ProfileRow): ProfessionalProfile {
  return {
    userId: row.user_id,
    profession: row.profession,
    publicName: row.public_name,
    countryCode: row.country_code,
    organizationName: row.organization_name,
    licenseNumber: row.license_number,
    verificationStatus: row.verification_status,
  };
}

function mapPermissions(row: PermissionsRow | null): ProfessionalPermissions | null {
  if (!row) return null;
  return {
    shareDiary: row.share_diary,
    shareWeight: row.share_weight,
    shareGoals: row.share_goals,
    sharePhotos: row.share_photos,
  };
}

export async function getProfessionalProfile(userId: string) {
  const { data, error } = await client()
    .from('professional_profiles')
    .select('user_id,profession,public_name,country_code,organization_name,license_number,verification_status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function saveProfessionalProfile(
  userId: string,
  input: Omit<ProfessionalProfile, 'userId' | 'verificationStatus'>,
) {
  const { data, error } = await client().rpc('upsert_professional_profile', {
    p_profession: input.profession,
    p_public_name: input.publicName,
    p_country_code: input.countryCode,
    p_organization_name: input.organizationName,
    p_license_number: input.licenseNumber,
  }).single();
  if (error) throw error;
  const saved = data as ProfileRow;
  if (saved.user_id !== userId) throw new Error('Session changed while saving the professional profile');
  return mapProfile(saved);
}

export async function createProfessionalInvite() {
  const { data, error } = await client().rpc('create_professional_invite');
  if (error) throw error;
  if (typeof data !== 'string' || data.length < 32) throw new Error('The invitation could not be created');
  return data;
}

export async function previewProfessionalInvite(token: string) {
  const { data, error } = await client().rpc('preview_professional_invite', { p_token: token }).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as {
    professional_name: string;
    profession: Profession;
    verification_status: ProfessionalVerificationStatus;
    organization_name: string | null;
    expires_at: string;
  };
  return {
    professionalName: row.professional_name,
    profession: row.profession,
    verificationStatus: row.verification_status,
    organizationName: row.organization_name,
    expiresAt: row.expires_at,
  } satisfies ProfessionalInvitePreview;
}

export async function acceptProfessionalInvite(token: string, permissions: ProfessionalPermissions) {
  const { data, error } = await client().rpc('accept_professional_invite', {
    p_token: token,
    p_share_diary: permissions.shareDiary,
    p_share_weight: permissions.shareWeight,
    p_share_goals: permissions.shareGoals,
    p_share_photos: permissions.sharePhotos,
  });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('The professional relationship could not be created');
  return data;
}

export async function listProfessionalRelationships() {
  const { data, error } = await client()
    .from('professional_client_relationships')
    .select('id,professional_id,client_id,status,started_at,ended_at,professional_client_permissions(share_diary,share_weight,share_goals,share_photos)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as RelationshipRow[]).map((row) => ({
    id: row.id,
    professionalId: row.professional_id,
    clientId: row.client_id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    permissions: mapPermissions(row.professional_client_permissions),
  } satisfies ProfessionalRelationship));
}

export async function updateProfessionalPermissions(relationshipId: string, permissions: ProfessionalPermissions) {
  const { data, error } = await client()
    .from('professional_client_permissions')
    .update({
      share_diary: permissions.shareDiary,
      share_weight: permissions.shareWeight,
      share_goals: permissions.shareGoals,
      share_photos: permissions.sharePhotos,
      updated_at: new Date().toISOString(),
    })
    .eq('relationship_id', relationshipId)
    .select('share_diary,share_weight,share_goals,share_photos')
    .single();
  if (error) throw error;
  return mapPermissions(data as PermissionsRow)!;
}

export async function endProfessionalRelationship(relationshipId: string) {
  const { error } = await client().rpc('end_professional_relationship', { p_relationship_id: relationshipId });
  if (error) throw error;
}

export async function revokeProfessionalInvite(inviteId: string) {
  const { error } = await client().rpc('revoke_professional_invite', { p_invite_id: inviteId });
  if (error) throw error;
}
