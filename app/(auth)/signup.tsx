import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getAuthErrorMessage, getEmailRedirectTo } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function SignupScreen() {
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
    if (!supabase || !isSupabaseConfigured) return setError('Faltan las variables públicas de Supabase.');
    if (!displayName.trim()) return setError('Ingresá tu nombre.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Ingresá un email válido.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== passwordConfirmation) return setError('Las contraseñas no coinciden.');

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
      setError(getAuthErrorMessage(signupError));
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
      setNotice('Te enviamos un correo nuevo. Revisá también Spam o No deseado.');
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>ÚLTIMO PASO</Text>
        <Text style={styles.title}>Confirmá tu email</Text>
        <Text style={styles.description}>Enviamos un enlace a {email.trim().toLowerCase()}. Abrilo desde este iPhone para activar tu cuenta.</Text>
        {notice && <Text style={styles.notice}>{notice}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={[styles.button, submitting && styles.disabled]} onPress={resendConfirmation} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reenviar correo</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.link}>Ya confirmé: ingresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TU CUENTA CALORFY</Text>
      <Text style={styles.title}>Crear cuenta</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" autoComplete="name" />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      <TextInput style={styles.input} placeholder="Contraseña (mínimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <TextInput style={styles.input} placeholder="Repetir contraseña" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry autoComplete="new-password" onSubmitEditing={handleSignup} />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={[styles.button, submitting && styles.disabled]} onPress={handleSignup} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.link}>Ya tengo una cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F7FBF9' },
  eyebrow: { color: '#008F6D', fontWeight: '800', fontSize: 12, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 6, marginBottom: 24, textAlign: 'center', color: '#173C32' },
  description: { color: '#557068', fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 18 },
  input: { borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16, marginBottom: 12, backgroundColor: '#fff' },
  button: { backgroundColor: '#00A77D', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#008F6D', textAlign: 'center', marginTop: 24, fontWeight: '700' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  notice: { color: '#087A5E', backgroundColor: '#E2F4ED', borderRadius: 12, padding: 12, textAlign: 'center', lineHeight: 20 },
});
