import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

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

  const selectAsset = (asset: ImagePicker.ImagePickerAsset) => {
    setImageUri(asset.uri);
    setImageMimeType(asset.mimeType ?? 'image/jpeg');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) selectAsset(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('camera_permission_title'), t('camera_permission_body'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) selectAsset(result.assets[0]);
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
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
    <ImageBackground source={require('@/assets/images/scan-bg.png')} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <Text style={styles.title}>{t('upload_meal').toUpperCase()}</Text>
        {imageUri ? (
          <View style={styles.preview}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {isAnalyzing && <View style={styles.overlay}><ActivityIndicator size="large" color="#fff" /><Text style={styles.overlayText}>{t('analyzing')}</Text></View>}
          </View>
        ) : <Text style={styles.placeholder}>{t('no_image_selected')}</Text>}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.pillButton} onPress={pickImage} disabled={isAnalyzing}><Text style={styles.pillText}>{t('choose_from_gallery')}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.pillButton} onPress={takePhoto} disabled={isAnalyzing}><Text style={styles.pillText}>{t('take_photo')}</Text></TouchableOpacity>
          {imageUri && <TouchableOpacity style={styles.pillButton} onPress={handleAnalyze} disabled={isAnalyzing}><Text style={styles.pillText}>{t('analyze')}</Text></TouchableOpacity>}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.78)' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 30, color: '#222', textAlign: 'center' },
  placeholder: { fontSize: 16, color: '#666', marginBottom: 20 },
  preview: { position: 'relative', marginBottom: 24 },
  image: { width: 250, height: 250, borderRadius: 16 },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  overlayText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 10 },
  buttonRow: { gap: 12, width: '100%', alignItems: 'center' },
  pillButton: { backgroundColor: '#00C896', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 32, alignItems: 'center', width: '80%' },
  pillText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
