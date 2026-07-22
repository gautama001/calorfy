import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { clearPasswordRecoveryIntent, getAuthErrorMessage, getPostAuthPath } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import AuthScreen from '@/components/AuthScreen';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { deleted } = useLocalSearchParams<{ deleted?: string }>();

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
      await clearPasswordRecoveryIntent(data.user.id);
      router.replace(await getPostAuthPath(data.user.id));
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <Text style={styles.eyebrow}>{t('auth_member_access')}</Text>
      <Text style={[styles.title, { color: textColor }]}>{t('welcome_back')}</Text>
      <Text style={[styles.description, { color: mutedColor }]}>{t('auth_login_intro')}</Text>
      <Text style={[styles.label, { color: textColor }]}>{t('email')}</Text>
      <View style={[styles.inputShell, { backgroundColor: cardColor, borderColor }]}>
        <Ionicons name="mail-outline" size={19} color={mutedColor} />
        <TextInput style={[styles.input, { color: textColor }]} placeholder={t('email_placeholder')} placeholderTextColor={mutedColor} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      </View>
      <Text style={[styles.label, { color: textColor }]}>{t('password')}</Text>
      <View style={[styles.inputShell, { backgroundColor: cardColor, borderColor }]}>
        <Ionicons name="lock-closed-outline" size={19} color={mutedColor} />
        <TextInput style={[styles.input, { color: textColor }]} placeholder={t('password')} placeholderTextColor={mutedColor} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="current-password" onSubmitEditing={handleLogin} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? t('hide_password') : t('show_password')} hitSlop={8} onPress={() => setShowPassword((value) => !value)}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={mutedColor} />
        </TouchableOpacity>
      </View>
      {deleted === '1' ? <Text style={styles.notice} accessibilityLiveRegion="polite">{t('account_deleted_body')}</Text> : null}
      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} style={[styles.button, submitting && styles.disabled]} onPress={handleLogin} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('sign_in')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" hitSlop={8} style={styles.forgotButton} onPress={() => router.push('/forgot-password' as Href)}>
        <Text style={styles.forgotLink}>{t('forgot_password')}</Text>
      </TouchableOpacity>
      <View style={styles.dividerRow}><View style={[styles.divider, { backgroundColor: borderColor }]} /><Text style={[styles.dividerText, { color: mutedColor }]}>{t('auth_new_here')}</Text><View style={[styles.divider, { backgroundColor: borderColor }]} /></View>
      <TouchableOpacity accessibilityRole="button" style={[styles.button, styles.secondaryButton, { backgroundColor: cardColor }]} onPress={() => router.push('/signup')}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('create_account')}</Text>
      </TouchableOpacity>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: '#009F79', fontWeight: '900', fontSize: 11, letterSpacing: 1.5, textAlign: 'center', textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '900', marginTop: 7, textAlign: 'center', color: '#173C32', letterSpacing: -1 },
  description: { fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  label: { fontWeight: '800', fontSize: 13, marginBottom: 7, marginLeft: 2 },
  inputShell: { borderWidth: 1, borderRadius: 15, minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  input: { flex: 1, minHeight: 52, fontSize: 16, paddingVertical: 0 },
  button: { backgroundColor: '#00A77D', minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  forgotButton: { alignSelf: 'center', marginTop: 14 },
  forgotLink: { color: '#008F6D', textAlign: 'center', fontWeight: '800', fontSize: 13 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 5 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#00A77D' },
  secondaryButtonText: { color: '#00A77D' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  notice: { color: '#087A5E', backgroundColor: '#E2F4ED', borderRadius: 12, padding: 12, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
});
