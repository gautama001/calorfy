import type { EmailOtpType } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { isGoalProfileComplete, readCachedGoalProfile, syncGoalProfile } from '@/lib/goals';

const RECOVERY_INTENT_TTL_MS = 30 * 60 * 1000;

function recoveryIntentKey(userId: string) {
  return `auth:password-recovery:${userId}`;
}

export async function markPasswordRecoveryIntent(userId: string) {
  await AsyncStorage.setItem(recoveryIntentKey(userId), String(Date.now() + RECOVERY_INTENT_TTL_MS));
}

export async function hasPasswordRecoveryIntent(userId: string) {
  const value = await AsyncStorage.getItem(recoveryIntentKey(userId));
  const expiresAt = Number(value);
  if (Number.isFinite(expiresAt) && expiresAt > Date.now()) return true;
  if (value) await AsyncStorage.removeItem(recoveryIntentKey(userId));
  return false;
}

export async function clearPasswordRecoveryIntent(userId: string) {
  await AsyncStorage.removeItem(recoveryIntentKey(userId));
}

export function getEmailRedirectTo(path = '/callback') {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return Linking.createURL(path);
}

export async function getPostAuthPath(userId: string) {
  try {
    const cached = await readCachedGoalProfile(userId);
    if (isGoalProfileComplete(cached)) return '/(tabs)' as const;
  } catch {
    // A storage issue must not invalidate an otherwise valid remote session.
  }
  try {
    const profile = await syncGoalProfile(userId, { migrateLegacy: false });
    return isGoalProfileComplete(profile) ? '/(tabs)' as const : '/onboarding' as const;
  } catch {
    // An existing user must still be able to enter with a valid persisted
    // session while temporarily offline. Screens retain their cached fallbacks.
    return '/(tabs)' as const;
  }
}

export async function createSessionFromUrl(url: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const [urlWithoutHash, hash = ''] = url.split('#', 2);
  const query = urlWithoutHash.includes('?') ? urlWithoutHash.split('?', 2)[1] : '';
  const params = new URLSearchParams(query);
  new URLSearchParams(hash).forEach((value, key) => params.set(key, value));

  const authError = params.get('error_description') ?? params.get('error');
  if (authError) throw new Error(decodeURIComponent(authError.replace(/\+/g, ' ')));

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return data.session;
  }

  const code = params.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) throw error;
    return data.session;
  }

  throw new Error('El enlace no contiene una sesión válida. Pedí un correo nuevo e intentá otra vez.');
}

export function getAuthErrorMessage(error: unknown, t?: TFunction) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) return t?.('auth_invalid_credentials') ?? 'El email o la contraseña no son correctos.';
  if (normalized.includes('email not confirmed')) return t?.('auth_email_not_confirmed') ?? 'Primero confirmá tu email desde el enlace que te enviamos.';
  if (normalized.includes('user already registered')) return t?.('auth_user_exists') ?? 'Ya existe una cuenta con ese email. Probá iniciar sesión.';
  if (normalized.includes('rate limit')) return t?.('auth_rate_limit') ?? 'Se enviaron demasiados correos. Esperá unos minutos y volvé a intentar.';
  if (normalized.includes('password')) return t?.('auth_password_security') ?? 'La contraseña no cumple los requisitos de seguridad.';
  if (normalized.includes('network') || normalized.includes('fetch')) return t?.('auth_network_error') ?? 'No pudimos conectar con el servidor. Revisá tu conexión.';
  if (normalized.includes('supabase no est')) return t?.('auth_setup_missing') ?? 'Supabase no está configurado.';
  if (normalized.includes('no contiene una sesi')) return t?.('auth_invalid_link') ?? 'El enlace no contiene una sesión válida. Pedí un correo nuevo e intentá otra vez.';
  if (normalized.includes('enlace venci') || normalized.includes('not valid')) return t?.('auth_expired_link') ?? 'El enlace venció o no es válido. Solicitá uno nuevo.';
  if (normalized.includes('no se pudo iniciar la sesi')) return t?.('auth_session_failed') ?? 'No se pudo iniciar la sesión.';
  return message;
}
