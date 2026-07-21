import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getAuthErrorMessage, getEmailRedirectTo } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import AuthScreen from '@/components/AuthScreen';

export default function SignupScreen() {
  const { t } = useTranslation();
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const inputStyle = [styles.input, { backgroundColor: cardColor, borderColor, color: textColor }];
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async () => {
    setError(null);
    setNotice(null);
    if (!supabase || !isSupabaseConfigured) return setError(t('auth_setup_missing'));
    if (!displayName.trim()) return setError(t('auth_enter_name'));
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('auth_valid_email'));
    if (password.length < 8) return setError(t('auth_password_min'));
    if (password !== passwordConfirmation) return setError(t('auth_password_mismatch'));

    setSubmitting(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: getEmailRedirectTo(),
        },
      });
      if (signupError) throw signupError;
      if (data.session) return router.replace('/(tabs)');
      setConfirmationSent(true);
    } catch (signupError) {
      setError(getAuthErrorMessage(signupError, t));
    } finally {
      setSubmitting(false);
    }
  };

  const resendConfirmation = async () => {
    if (!supabase) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: getEmailRedirectTo() },
      });
      if (resendError) throw resendError;
      setNotice(t('confirmation_resent'));
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError, t));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <AuthScreen>
        <Text style={styles.eyebrow}>{t('last_step').toUpperCase()}</Text>
        <Text style={[styles.title, { color: textColor }]}>{t('confirm_email')}</Text>
        <Text style={[styles.description, { color: mutedColor }]}>{t('confirmation_sent_to', { email: email.trim().toLowerCase() })}</Text>
        {notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
        {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} style={[styles.button, submitting && styles.disabled]} onPress={resendConfirmation} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('resend_email')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={() => router.replace('/login')}>
          <Text style={styles.link}>{t('already_confirmed')}</Text>
        </TouchableOpacity>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <Text style={styles.eyebrow}>{t('your_calorfy_account').toUpperCase()}</Text>
      <Text style={[styles.title, { color: textColor }]}>{t('create_account')}</Text>
      <TextInput style={inputStyle} placeholder={t('name')} placeholderTextColor={mutedColor} value={displayName} onChangeText={setDisplayName} autoCapitalize="words" autoComplete="name" />
      <TextInput style={inputStyle} placeholder="Email" placeholderTextColor={mutedColor} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      <TextInput style={inputStyle} placeholder={t('password_min_placeholder')} placeholderTextColor={mutedColor} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <TextInput style={inputStyle} placeholder={t('repeat_password')} placeholderTextColor={mutedColor} value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry autoComplete="new-password" onSubmitEditing={handleSignup} />
      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} style={[styles.button, submitting && styles.disabled]} onPress={handleSignup} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('create_account')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={() => router.replace('/login')}>
        <Text style={styles.link}>{t('already_have_account')}</Text>
      </TouchableOpacity>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: '#008F6D', fontWeight: '800', fontSize: 12, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 6, marginBottom: 24, textAlign: 'center', color: '#173C32' },
  description: { color: '#557068', fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 18 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: '#00A77D', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#008F6D', textAlign: 'center', marginTop: 24, fontWeight: '700' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  notice: { color: '#087A5E', backgroundColor: '#E2F4ED', borderRadius: 12, padding: 12, textAlign: 'center', lineHeight: 20 },
});
