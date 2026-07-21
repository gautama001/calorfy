import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type AlertButton,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/lib/supabase';

async function readImageAsBase64(uri: string) {
  if (Platform.OS !== 'web') {
    return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  }

  const blob = await (await fetch(uri)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const value = String(reader.result ?? '');
      resolve(value.includes(',') ? value.split(',', 2)[1] : value);
    };
    reader.readAsDataURL(blob);
  });
}

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { t } = useTranslation();
  const { backgroundColor, cardColor, textColor, borderColor, primaryColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A9BBB5' : '#5F736C';
  const softColor = isDarkMode ? '#13271F' : '#E8F7F2';

  const selectAsset = (asset: ImagePicker.ImagePickerAsset) => {
    setImageUri(asset.uri);
    setImageMimeType(asset.mimeType ?? 'image/jpeg');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled) selectAsset(result.assets[0]);
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert(t('error'), t('image_picker_failed'));
    }
  };

  const takePhoto = async () => {
    try {
      const currentPermission = await ImagePicker.getCameraPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        const buttons: AlertButton[] = [{ text: t('cancel'), style: 'cancel' }];
        if (!permission.canAskAgain && Platform.OS !== 'web') {
          buttons.push({ text: t('open_settings'), onPress: () => void Linking.openSettings() });
        }
        Alert.alert(
          t('camera_permission_title'),
          permission.canAskAgain ? t('camera_permission_body') : t('camera_permission_settings_body'),
          buttons,
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (!result.canceled) selectAsset(result.assets[0]);
    } catch (error) {
      console.error('Camera picker error:', error);
      Alert.alert(t('error'), t('image_picker_failed'));
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri || isAnalyzing) return;
    if (!supabase) {
      Alert.alert(t('scan_setup_title'), t('scan_setup_body'));
      return;
    }

    try {
      setIsAnalyzing(true);
      const imageBase64 = await readImageAsBase64(imageUri);
      const { data, error } = await supabase.functions.invoke('analyze-meal', {
        body: { imageBase64, mimeType: imageMimeType },
      });

      if (error) throw error;
      if (!data?.name || !data?.nutrients) throw new Error('Respuesta de análisis incompleta');

      router.push({
        pathname: '/scan/results',
        params: {
          image: imageUri,
          category,
          name: data.name,
          nutrients: JSON.stringify(data.nutrients),
          totalWeight: String(data.totalWeight ?? ''),
        },
      });
    } catch (error) {
      console.error('Meal analysis error:', error);
      Alert.alert(t('scan_failed_title'), t('scan_failed_body'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={{ backgroundColor }}
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: softColor }]}>
            <Ionicons name="camera-outline" size={25} color={primaryColor} />
          </View>
          <Text style={[styles.eyebrow, { color: primaryColor }]}>{t('scan').toUpperCase()}</Text>
          <Text style={[styles.title, { color: textColor }]}>{t('upload_meal')}</Text>
          <Text style={[styles.intro, { color: mutedColor }]}>{t('scan_intro')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          {imageUri ? (
            <View style={styles.preview}>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
                accessible
                accessibilityLabel={t('upload_meal')}
              />
              {isAnalyzing && (
                <View style={styles.overlay} accessibilityLiveRegion="polite">
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.overlayText}>{t('analyzing')}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: softColor, borderColor }]}>
              <Ionicons name="image-outline" size={38} color={mutedColor} />
              <Text style={[styles.placeholder, { color: textColor }]}>{t('no_image_selected')}</Text>
              <Text style={[styles.placeholderDetail, { color: mutedColor }]}>{t('scan_privacy_note')}</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing }}
              style={[styles.secondaryButton, { borderColor, backgroundColor: softColor }]}
              onPress={pickImage}
              disabled={isAnalyzing}
            >
              <Ionicons name="images-outline" size={20} color={primaryColor} />
              <Text style={[styles.secondaryText, { color: textColor }]}>
                {imageUri ? t('replace_photo') : t('choose_from_gallery')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing }}
              style={[styles.secondaryButton, { borderColor, backgroundColor: softColor }]}
              onPress={takePhoto}
              disabled={isAnalyzing}
            >
              <Ionicons name="camera-outline" size={20} color={primaryColor} />
              <Text style={[styles.secondaryText, { color: textColor }]}>{t('take_photo')}</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing, busy: isAnalyzing }}
              style={[styles.primaryButton, { backgroundColor: primaryColor }, isAnalyzing && styles.disabled]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />}
              <Text style={styles.primaryText}>{isAnalyzing ? t('analyzing') : t('analyze')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="shield-checkmark-outline" size={17} color={mutedColor} />
          <Text style={[styles.privacyText, { color: mutedColor }]}>{t('scan_privacy_note')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 },
  header: { alignItems: 'center', marginBottom: 22 },
  iconBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', textAlign: 'center' },
  intro: { maxWidth: 440, fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 16, borderRadius: 24, borderWidth: 1 },
  preview: { position: 'relative', width: '100%', aspectRatio: 1.12, marginBottom: 16 },
  image: { width: '100%', height: '100%', borderRadius: 18 },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(4,22,16,0.72)', justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  overlayText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptyState: { minHeight: 230, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 24, marginBottom: 16 },
  placeholder: { fontSize: 17, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  placeholderDetail: { fontSize: 13, lineHeight: 18, marginTop: 6, textAlign: 'center', maxWidth: 280 },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, minHeight: 58, borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 5 },
  secondaryText: { fontSize: 13, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  primaryButton: { minHeight: 56, marginTop: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 20 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.65 },
  privacyRow: { maxWidth: 480, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingHorizontal: 12, marginTop: 14 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
