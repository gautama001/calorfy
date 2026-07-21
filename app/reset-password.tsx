import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { createSessionFromUrl, getAuthErrorMessage } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import AuthScreen from '@/components/AuthScreen';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const inputStyle = [styles.input, { backgroundColor: cardColor, borderColor, color: textColor }];
  const url = Linking.useURL();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!supabase) throw new Error('Supabase no está configurado.');
        const { data } = await supabase.auth.getSession();
        if (!data.session && url) await createSessionFromUrl(url);
        const current = await supabase.auth.getSession();
        if (!current.data.session) throw new Error('El enlace venció o no es válido. Solicitá uno nuevo.');
        if (active) setReady(true);
      } catch (sessionError) { if (active) setError(getAuthErrorMessage(sessionError, t)); }
    })();
    return () => { active = false; };
  }, [url]);

  const updatePassword = async () => {
    if (!supabase) return;
    if (password.length < 8) return setError(t('auth_password_min'));
    if (password !== confirmation) return setError(t('auth_password_mismatch'));
    setSubmitting(true); setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace('/(tabs)');
    } catch (updateError) { setError(getAuthErrorMessage(updateError, t)); }
    finally { setSubmitting(false); }
  };

  if (!ready && !error) return <AuthScreen><ActivityIndicator size="large" color="#00A77D" /><Text style={[styles.description, { color: mutedColor }]}>{t('validating_secure_link')}</Text></AuthScreen>;
  return <AuthScreen><Text style={styles.eyebrow}>{t('security').toUpperCase()}</Text><Text style={[styles.title, { color: textColor }]}>{t('new_password')}</Text>{ready ? <><TextInput style={inputStyle} placeholder={t('new_password_placeholder')} placeholderTextColor={mutedColor} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" /><TextInput style={inputStyle} placeholder={t('repeat_password')} placeholderTextColor={mutedColor} value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" onSubmitEditing={updatePassword} />{error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}<TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} style={[styles.button, submitting && styles.disabled]} onPress={updatePassword} disabled={submitting}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('save_password')}</Text>}</TouchableOpacity></> : <><Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => router.replace('/forgot-password' as Href)}><Text style={styles.buttonText}>{t('request_another_link')}</Text></TouchableOpacity></>}</AuthScreen>;
}

const styles = StyleSheet.create({
  eyebrow: { color: '#008F6D', fontWeight: '800', fontSize: 12, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 6, marginBottom: 24, textAlign: 'center', color: '#173C32' },
  description: { color: '#557068', fontSize: 15, textAlign: 'center', marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: '#00A77D', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  disabled: { opacity: 0.6 }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
});
