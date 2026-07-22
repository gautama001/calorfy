import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, type ColorValue } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/useAppTheme';
import {
  acceptProfessionalInvite,
  endProfessionalRelationship,
  listProfessionalRelationships,
  previewProfessionalInvite,
  updateProfessionalPermissions,
  type ProfessionalInvitePreview,
  type ProfessionalPermissions,
  type ProfessionalRelationship,
} from '@/lib/professionals';

const emptyPermissions: ProfessionalPermissions = { shareDiary: false, shareWeight: false, shareGoals: false, sharePhotos: false };

const translations = {
  es: {
    eyebrow: 'PRIVACIDAD Y ACOMPAÑAMIENTO', title: 'Conexiones profesionales', intro: 'Vos decidís quién puede acompañarte y qué información puede consultar.',
    connect: 'Conectar un profesional', link: 'Enlace privado de invitación', placeholder: 'Pegá el enlace que recibiste', review: 'Revisar invitación', active: 'Profesionales conectados', empty: 'Todavía no tenés profesionales conectados.',
    sharing: 'Información compartida', diary: 'Diario de comidas', weight: 'Progreso de peso', goals: 'Objetivos y metas', photos: 'Fotos de comidas',
    accept: 'Aceptar y conectar', save: 'Guardar permisos', disconnect: 'Desconectar', connected: 'Profesional conectado', connectedBody: 'Podés modificar o revocar el acceso cuando quieras.',
    invalid: 'Ingresá un enlace válido de invitación profesional.', expired: 'La invitación no es válida, venció o ya fue utilizada.', error: 'No pudimos completar la operación.',
    disconnectTitle: '¿Desconectar a este profesional?', disconnectBody: 'Perderá inmediatamente el acceso a la información que compartiste.', cancel: 'Cancelar', confirm: 'Desconectar', verified: 'Verificado', unverified: 'Sin verificar', nutritionist: 'Nutricionista', trainer: 'Entrenador/a personal',
  },
  en: {
    eyebrow: 'PRIVACY AND SUPPORT', title: 'Professional connections', intro: 'You decide who can support you and which information they can access.',
    connect: 'Connect a professional', link: 'Private invitation link', placeholder: 'Paste the link you received', review: 'Review invitation', active: 'Connected professionals', empty: 'You have no connected professionals yet.',
    sharing: 'Information shared', diary: 'Meal diary', weight: 'Weight progress', goals: 'Goals and targets', photos: 'Meal photos',
    accept: 'Accept and connect', save: 'Save permissions', disconnect: 'Disconnect', connected: 'Professional connected', connectedBody: 'You can change or revoke access whenever you want.',
    invalid: 'Enter a valid professional invitation link.', expired: 'This invitation is invalid, expired or has already been used.', error: 'We could not complete the operation.',
    disconnectTitle: 'Disconnect this professional?', disconnectBody: 'They will immediately lose access to the information you shared.', cancel: 'Cancel', confirm: 'Disconnect', verified: 'Verified', unverified: 'Unverified', nutritionist: 'Nutritionist', trainer: 'Personal trainer',
  },
  pt: {
    eyebrow: 'PRIVACIDADE E ACOMPANHAMENTO', title: 'Conexões profissionais', intro: 'Você decide quem pode acompanhar você e quais informações pode consultar.',
    connect: 'Conectar um profissional', link: 'Link privado de convite', placeholder: 'Cole o link que você recebeu', review: 'Revisar convite', active: 'Profissionais conectados', empty: 'Você ainda não tem profissionais conectados.',
    sharing: 'Informações compartilhadas', diary: 'Diário alimentar', weight: 'Progresso de peso', goals: 'Objetivos e metas', photos: 'Fotos das refeições',
    accept: 'Aceitar e conectar', save: 'Salvar permissões', disconnect: 'Desconectar', connected: 'Profissional conectado', connectedBody: 'Você pode alterar ou revogar o acesso quando quiser.',
    invalid: 'Insira um link válido de convite profissional.', expired: 'O convite é inválido, expirou ou já foi utilizado.', error: 'Não foi possível concluir a operação.',
    disconnectTitle: 'Desconectar este profissional?', disconnectBody: 'Ele perderá imediatamente o acesso às informações compartilhadas.', cancel: 'Cancelar', confirm: 'Desconectar', verified: 'Verificado', unverified: 'Não verificado', nutritionist: 'Nutricionista', trainer: 'Personal trainer',
  },
} as const;

type Copy = { [Key in keyof typeof translations.es]: string };

function inviteToken(value: string) {
  const input = value.trim();
  const fromUrl = input.match(/\/connect\/([^/?#]+)/i)?.[1];
  const token = decodeURIComponent(fromUrl ?? input);
  return /^[a-f0-9]{32,}$/i.test(token) ? token : null;
}

function errorText(reason: unknown, copy: Copy) {
  const message = reason instanceof Error ? reason.message : reason && typeof reason === 'object' && 'message' in reason ? String(reason.message) : '';
  if (message.includes('invalid or expired') || message.includes('0 rows')) return copy.expired;
  return message || copy.error;
}

function PermissionRows({ value, onChange, disabled, colors, copy }: {
  value: ProfessionalPermissions;
  onChange: (next: ProfessionalPermissions) => void;
  disabled?: boolean;
  colors: { card: ColorValue; border: ColorValue; text: ColorValue; muted: ColorValue };
  copy: Copy;
}) {
  const items = [
    ['shareDiary', 'restaurant-outline', copy.diary],
    ['shareWeight', 'trending-down-outline', copy.weight],
    ['shareGoals', 'flag-outline', copy.goals],
    ['sharePhotos', 'images-outline', copy.photos],
  ] as const;
  return <View style={styles.permissions}>{items.map(([key, icon, label]) => <View key={key} style={[styles.permissionRow, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={icon} size={19} color="#00A77D"/><Text style={[styles.permissionText, { color: colors.text }]}>{label}</Text><Switch disabled={disabled} value={value[key]} onValueChange={(checked) => onChange({ ...value, [key]: checked })} trackColor={{ false: '#AFC0BA', true: '#00A77D' }} thumbColor="#FFFFFF"/></View>)}</View>;
}

export default function ProfessionalConnectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : i18n.resolvedLanguage?.startsWith('pt') ? 'pt' : 'es';
  const copy = translations[language];
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#61776F';
  const softColor = isDarkMode ? '#18362D' : '#E9F7F2';
  const colors = useMemo(() => ({ card: isDarkMode ? '#173129' : '#F8FBFA', border: borderColor, text: textColor, muted: mutedColor }), [borderColor, isDarkMode, mutedColor, textColor]);
  const [link, setLink] = useState(params.token ?? '');
  const [preview, setPreview] = useState<ProfessionalInvitePreview | null>(null);
  const [permissions, setPermissions] = useState<ProfessionalPermissions>(emptyPermissions);
  const [relationships, setRelationships] = useState<ProfessionalRelationship[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ProfessionalPermissions>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRelationships = async () => {
    try {
      const data = await listProfessionalRelationships();
      setRelationships(data);
      setDrafts(Object.fromEntries(data.map((relationship) => [relationship.id, relationship.permissions ?? emptyPermissions])));
    } catch (reason) {
      setMessage(errorText(reason, copy));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadRelationships(); }, []);

  const review = async () => {
    const token = inviteToken(link);
    if (!token) return setMessage(copy.invalid);
    setBusy(true); setMessage(null);
    try {
      const result = await previewProfessionalInvite(token);
      if (!result) throw new Error('Invitation is invalid or expired');
      setPreview(result);
      setPermissions(emptyPermissions);
    } catch (reason) { setPreview(null); setMessage(errorText(reason, copy)); }
    finally { setBusy(false); }
  };

  const accept = async () => {
    const token = inviteToken(link);
    if (!token) return setMessage(copy.invalid);
    setBusy(true); setMessage(null);
    try {
      await acceptProfessionalInvite(token, permissions);
      setPreview(null); setLink('');
      await loadRelationships();
      Alert.alert(copy.connected, copy.connectedBody);
    } catch (reason) { setMessage(errorText(reason, copy)); }
    finally { setBusy(false); }
  };

  const savePermissions = async (relationshipId: string) => {
    setBusy(true); setMessage(null);
    try {
      const saved = await updateProfessionalPermissions(relationshipId, drafts[relationshipId]);
      setDrafts((current) => ({ ...current, [relationshipId]: saved }));
      await loadRelationships();
    } catch (reason) { setMessage(errorText(reason, copy)); }
    finally { setBusy(false); }
  };

  const disconnect = (relationship: ProfessionalRelationship) => Alert.alert(copy.disconnectTitle, copy.disconnectBody, [
    { text: copy.cancel, style: 'cancel' },
    { text: copy.confirm, style: 'destructive', onPress: async () => {
      setBusy(true); setMessage(null);
      try { await endProfessionalRelationship(relationship.id); await loadRelationships(); }
      catch (reason) { setMessage(errorText(reason, copy)); }
      finally { setBusy(false); }
    } },
  ]);

  return <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><TouchableOpacity style={[styles.back, { backgroundColor: softColor }]} onPress={() => router.back()} accessibilityLabel={copy.cancel}><Ionicons name="chevron-back" size={23} color="#00A77D"/></TouchableOpacity><View style={{ flex: 1 }}><Text style={styles.eyebrow}>{copy.eyebrow}</Text><Text style={[styles.title, { color: textColor }]}>{copy.title}</Text></View></View>
    <Text style={[styles.intro, { color: mutedColor }]}>{copy.intro}</Text>
    {message ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={19} color="#B42318"/><Text style={styles.errorText}>{message}</Text></View> : null}

    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.cardHeading}><View style={[styles.icon, { backgroundColor: softColor }]}><Ionicons name="link-outline" size={22} color="#00A77D"/></View><View><Text style={[styles.cardTitle, { color: textColor }]}>{copy.connect}</Text><Text style={[styles.cardSubtitle, { color: mutedColor }]}>{copy.link}</Text></View></View>
      <TextInput style={[styles.input, { color: textColor, backgroundColor: colors.card, borderColor }]} value={link} onChangeText={(value) => { setLink(value); setPreview(null); }} autoCapitalize="none" autoCorrect={false} placeholder={copy.placeholder} placeholderTextColor={mutedColor}/>
      <TouchableOpacity style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={review}>{busy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.primaryText}>{copy.review}</Text>}</TouchableOpacity>
      {preview ? <View style={styles.preview}>
        <View style={styles.professional}><View style={styles.avatar}><Text style={styles.avatarText}>{preview.professionalName.charAt(0).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={[styles.professionalName, { color: textColor }]}>{preview.professionalName}</Text><Text style={[styles.professionalMeta, { color: mutedColor }]}>{preview.profession === 'nutritionist' ? copy.nutritionist : copy.trainer}{preview.organizationName ? ` · ${preview.organizationName}` : ''}</Text></View><Text style={[styles.badge, preview.verificationStatus === 'verified' && styles.badgeVerified]}>{preview.verificationStatus === 'verified' ? copy.verified : copy.unverified}</Text></View>
        <Text style={[styles.shareTitle, { color: textColor }]}>{copy.sharing}</Text><PermissionRows value={permissions} onChange={setPermissions} colors={colors} copy={copy}/>
        <TouchableOpacity style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={accept}><Text style={styles.primaryText}>{copy.accept}</Text></TouchableOpacity>
      </View> : null}
    </View>

    <Text style={[styles.sectionTitle, { color: textColor }]}>{copy.active}</Text>
    {loading ? <ActivityIndicator style={styles.loader} color="#00A77D"/> : relationships.length === 0 ? <View style={[styles.empty, { backgroundColor: cardColor, borderColor }]}><Ionicons name="people-outline" size={28} color="#00A77D"/><Text style={[styles.emptyText, { color: mutedColor }]}>{copy.empty}</Text></View> : relationships.map((relationship) => {
      const draft = drafts[relationship.id] ?? relationship.permissions ?? emptyPermissions;
      return <View key={relationship.id} style={[styles.card, { backgroundColor: cardColor, borderColor }]}><View style={styles.professional}><View style={styles.avatar}><Text style={styles.avatarText}>{relationship.professionalName.charAt(0).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={[styles.professionalName, { color: textColor }]}>{relationship.professionalName}</Text><Text style={[styles.professionalMeta, { color: mutedColor }]}>{relationship.profession === 'nutritionist' ? copy.nutritionist : copy.trainer}{relationship.organizationName ? ` · ${relationship.organizationName}` : ''}</Text></View></View><Text style={[styles.shareTitle, { color: textColor }]}>{copy.sharing}</Text><PermissionRows value={draft} onChange={(next) => setDrafts((current) => ({ ...current, [relationship.id]: next }))} colors={colors} copy={copy}/><TouchableOpacity style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={() => savePermissions(relationship.id)}><Text style={styles.primaryText}>{copy.save}</Text></TouchableOpacity><TouchableOpacity style={styles.disconnect} disabled={busy} onPress={() => disconnect(relationship)}><Ionicons name="unlink-outline" size={17} color="#B42318"/><Text style={styles.disconnectText}>{copy.disconnect}</Text></TouchableOpacity></View>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingTop: 22, paddingBottom: 130 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#00A77D', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, title: { marginTop: 2, fontSize: 28, fontWeight: '900' }, intro: { marginTop: 10, marginBottom: 18, fontSize: 13, lineHeight: 20 },
  card: { marginBottom: 14, padding: 16, borderWidth: 1, borderRadius: 21 }, cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 15 }, icon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontSize: 17, fontWeight: '900' }, cardSubtitle: { marginTop: 2, fontSize: 12 },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderRadius: 14, fontSize: 13 }, primary: { minHeight: 49, marginTop: 11, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B4A3D' }, primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' }, disabled: { opacity: .6 },
  preview: { marginTop: 18, paddingTop: 17, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#AFC0BA' }, professional: { flexDirection: 'row', alignItems: 'center', gap: 11 }, avatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#39DDB4' }, avatarText: { color: '#07382F', fontSize: 18, fontWeight: '900' }, professionalName: { fontSize: 15, fontWeight: '900' }, professionalMeta: { marginTop: 3, fontSize: 11 }, badge: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, color: '#8A641D', backgroundColor: '#FFF1CF', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }, badgeVerified: { color: '#087356', backgroundColor: '#DFF8F0' },
  shareTitle: { marginTop: 18, marginBottom: 9, fontSize: 12, fontWeight: '900' }, permissions: { gap: 7 }, permissionRow: { minHeight: 54, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 13 }, permissionText: { flex: 1, fontSize: 12, fontWeight: '700' },
  sectionTitle: { marginTop: 8, marginBottom: 10, fontSize: 18, fontWeight: '900' }, loader: { marginVertical: 30 }, empty: { minHeight: 145, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderRadius: 21 }, emptyText: { maxWidth: 320, textAlign: 'center', fontSize: 13, lineHeight: 19 },
  disconnect: { minHeight: 43, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, disconnectText: { color: '#B42318', fontSize: 12, fontWeight: '800' },
  error: { marginBottom: 13, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderColor: '#F0B7B2', borderRadius: 13, backgroundColor: '#FDECEA' }, errorText: { flex: 1, color: '#8C211A', fontSize: 12, lineHeight: 18 },
});
