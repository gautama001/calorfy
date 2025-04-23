import { useState } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function UploadScreen() {
  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload your meal photo</Text>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <Text style={styles.placeholder}>No image selected</Text>
      )}
      <Button title="Pick Image" onPress={pickImage} />
      {image && (
        <View style={{ marginTop: 20 }}>
          <Button
            title="Analyze"
            onPress={() => router.push('/results')}
            color="#00C896"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  placeholder: {
    marginBottom: 20,
    color: '#999',
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: 'cover',
    marginBottom: 20,
    borderRadius: 12,
  },
});
