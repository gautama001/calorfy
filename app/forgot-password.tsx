import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getAuthErrorMessage, getEmailRedirectTo } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendReset = async () => {
    if (!supabase) return setError(t('auth_setup_missing'));
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('auth_valid_email'));
    setSubmitting(true); setError(null); setMessage(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: getEmailRedirectTo(),
      });
      if (resetError) throw resetError;
      setMessage(t('reset_email_sent'));
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError, t));
    } finally { setSubmitting(false); }
  };

  return <View style={[styles.container, { backgroundColor }]}><Text style={styles.eyebrow}>{t('security').toUpperCase()}</Text><Text style={[styles.title, { color: textColor }]}>{t('recover_password')}</Text><Text style={[styles.description, { color: mutedColor }]}>{t('recover_password_intro')}</Text><TextInput style={[styles.input, { backgroundColor: cardColor, borderColor, color: textColor }]} placeholder="Email" placeholderTextColor={mutedColor} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" onSubmitEditing={sendReset} />{message ? <Text style={styles.notice}>{message}</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}<TouchableOpacity style={[styles.button, submitting && styles.disabled]} onPress={sendReset} disabled={submitting}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('send_link')}</Text>}</TouchableOpacity><TouchableOpacity onPress={() => router.replace('/login')}><Text style={styles.link}>{t('back_to_sign_in')}</Text></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  eyebrow: { color: '#008F6D', fontWeight: '800', fontSize: 12, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 6, textAlign: 'center', color: '#173C32' },
  description: { color: '#557068', fontSize: 15, lineHeight: 22, textAlign: 'center', marginVertical: 22 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16 },
  button: { backgroundColor: '#00A77D', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  disabled: { opacity: 0.6 }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#008F6D', textAlign: 'center', marginTop: 24, fontWeight: '700' },
  notice: { color: '#087A5E', backgroundColor: '#E2F4ED', borderRadius: 12, padding: 12, textAlign: 'center', lineHeight: 20, marginTop: 12 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginTop: 12 },
});
