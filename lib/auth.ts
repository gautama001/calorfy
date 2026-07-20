import type { EmailOtpType } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export function getEmailRedirectTo() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/callback`;
  }
  return Linking.createURL('/callback');
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

export function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) return 'El email o la contraseña no son correctos.';
  if (normalized.includes('email not confirmed')) return 'Primero confirmá tu email desde el enlace que te enviamos.';
  if (normalized.includes('user already registered')) return 'Ya existe una cuenta con ese email. Probá iniciar sesión.';
  if (normalized.includes('rate limit')) return 'Se enviaron demasiados correos. Esperá unos minutos y volvé a intentar.';
  if (normalized.includes('password')) return 'La contraseña no cumple los requisitos de seguridad.';
  if (normalized.includes('network') || normalized.includes('fetch')) return 'No pudimos conectar con el servidor. Revisá tu conexión.';
  return message;
}
