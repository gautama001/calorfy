import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LegalScreen, LegalSection } from '@/components/LegalScreen';
import { useAppTheme } from '@/hooks/useAppTheme';

const SUPPORT_URL = 'https://github.com/gautama001/calorfy/issues/new';

export default function SupportScreen() {
  const { t, i18n } = useTranslation();
  const { textColor } = useAppTheme();
  const portuguese = i18n.resolvedLanguage?.startsWith('pt');
  const english = i18n.resolvedLanguage?.startsWith('en');
  const body = english ? 'Tell us what happened, what you expected and your iPhone model. Do not include passwords, medical records or other sensitive information.' : portuguese ? 'Conte o que aconteceu, o que você esperava e o modelo do seu iPhone. Não inclua senhas, prontuários médicos ou outras informações sensíveis.' : 'Contanos qué ocurrió, qué esperabas y el modelo de tu iPhone. No incluyas contraseñas, historias clínicas ni otra información sensible.';
  return <LegalScreen title={t('support')}><LegalSection title="Calorfy Support">{body}</LegalSection><TouchableOpacity style={styles.button} onPress={() => Linking.openURL(SUPPORT_URL)} accessibilityRole="link"><Text style={styles.buttonText}>{english ? 'Open support request' : portuguese ? 'Abrir solicitação de suporte' : 'Abrir solicitud de soporte'}</Text></TouchableOpacity><Text style={[styles.note, { color: textColor }]}>{SUPPORT_URL}</Text></LegalScreen>;
}

const styles = StyleSheet.create({
  button: { minHeight: 50, borderRadius: 14, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  note: { fontSize: 10, marginTop: 10, opacity: 0.65 },
});
