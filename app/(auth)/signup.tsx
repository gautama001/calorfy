import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { getAuthErrorMessage, getEmailRedirectTo } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import AuthScreen from '@/components/AuthScreen';

export default function SignupScreen() {
  const { t } = useTranslation();
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      if (data.session) return router.replace('/onboarding');
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
      <Text style={styles.eyebrow}>{t('your_calorfy_account')}</Text>
      <Text style={[styles.title, { color: textColor }]}>{t('create_account')}</Text>
      <Text style={[styles.description, { color: mutedColor }]}>{t('auth_signup_intro')}</Text>
      <Text style={[styles.label, { color: textColor }]}>{t('name')}</Text>
      <View style={[styles.inputShell, { backgroundColor: cardColor, borderColor }]}><Ionicons name="person-outline" size={19} color={mutedColor} /><TextInput style={[styles.field, { color: textColor }]} placeholder={t('name_placeholder')} placeholderTextColor={mutedColor} value={displayName} onChangeText={setDisplayName} autoCapitalize="words" autoComplete="name" /></View>
      <Text style={[styles.label, { color: textColor }]}>{t('email')}</Text>
      <View style={[styles.inputShell, { backgroundColor: cardColor, borderColor }]}><Ionicons name="mail-outline" size={19} color={mutedColor} /><TextInput style={[styles.field, { color: textColor }]} placeholder={t('email_placeholder')} placeholderTextColor={mutedColor} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" /></View>
      <Text style={[styles.label, { color: textColor }]}>{t('password')}</Text>
      <View style={[styles.inputShell, { backgroundColor: cardColor, borderColor }]}><Ionicons name="lock-closed-outline" size={19} color={mutedColor} /><TextInput style={[styles.field, { color: textColor }]} placeholder={t('password_min_placeholder')} placeholderTextColor={mutedColor} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="new-password" /><TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? t('hide_password') : t('show_password')} hitSlop={8} onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={mutedColor} /></TouchableOpacity></View>
      <Text style={[styles.label, { color: textColor }]}>{t('repeat_password')}</Text>
      <View style={[styles.inputShell, { backgroundColor: cardColor, borderColor }]}><Ionicons name="shield-checkmark-outline" size={19} color={mutedColor} /><TextInput style={[styles.field, { color: textColor }]} placeholder={t('repeat_password')} placeholderTextColor={mutedColor} value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry={!showPassword} autoComplete="new-password" onSubmitEditing={handleSignup} /></View>
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
  eyebrow: { color: '#009F79', fontWeight: '900', fontSize: 11, letterSpacing: 1.5, textAlign: 'center', textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '900', marginTop: 7, textAlign: 'center', color: '#173C32', letterSpacing: -1 },
  description: { color: '#557068', fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  label: { fontWeight: '800', fontSize: 13, marginBottom: 7, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16, marginBottom: 12 },
  inputShell: { borderWidth: 1, borderRadius: 15, minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  field: { flex: 1, minHeight: 52, fontSize: 16, paddingVertical: 0 },
  button: { backgroundColor: '#00A77D', minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#008F6D', textAlign: 'center', marginTop: 24, fontWeight: '700' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  notice: { color: '#087A5E', backgroundColor: '#E2F4ED', borderRadius: 12, padding: 12, textAlign: 'center', lineHeight: 20 },
});
