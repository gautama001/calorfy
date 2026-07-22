import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getAuthErrorMessage, getPostAuthPath } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import AuthScreen from '@/components/AuthScreen';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!supabase || !isSupabaseConfigured) return setError(t('auth_setup_missing'));
    if (!email.trim() || !password) return setError(t('auth_enter_credentials'));

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (loginError) throw loginError;
      if (!data.user) throw new Error(t('auth_session_failed'));
      router.replace(await getPostAuthPath(data.user.id));
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <Text style={styles.eyebrow}>CALORFY</Text>
      <Text style={[styles.title, { color: textColor }]}>{t('welcome_back')}</Text>
      <TextInput style={[styles.input, { backgroundColor: cardColor, borderColor, color: textColor }]} placeholder="Email" placeholderTextColor={mutedColor} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      <TextInput style={[styles.input, { backgroundColor: cardColor, borderColor, color: textColor }]} placeholder={t('password')} placeholderTextColor={mutedColor} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" onSubmitEditing={handleLogin} />
      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} style={[styles.button, submitting && styles.disabled]} onPress={handleLogin} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('sign_in')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={() => router.push('/forgot-password' as Href)}>
        <Text style={styles.forgotLink}>{t('forgot_password')}</Text>
      </TouchableOpacity>
      <Text style={[styles.text, { color: mutedColor }]}>{t('no_account_yet')}</Text>
      <TouchableOpacity accessibilityRole="button" style={[styles.button, styles.secondaryButton, { backgroundColor: cardColor }]} onPress={() => router.push('/signup')}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('create_account')}</Text>
      </TouchableOpacity>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: '#008F6D', fontWeight: '800', fontSize: 12, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 6, marginBottom: 28, textAlign: 'center', color: '#173C32' },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: '#00A77D', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  text: { textAlign: 'center', marginTop: 22, color: '#557068', fontSize: 15 },
  forgotLink: { color: '#008F6D', textAlign: 'center', marginTop: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#00A77D' },
  secondaryButtonText: { color: '#00A77D' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
});
