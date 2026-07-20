import { View, Text, Image, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();

  const SLIDES = [
    {
      key: '1',
      image: require('@/assets/images/img1.png'),
      textKey: 'Scan your meals and get instant nutrition insights',
    },
    {
      key: '2',
      image: require('@/assets/images/img2.png'),
      textKey: 'Track your calories and macros with precision',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % SLIDES.length;
      scrollRef.current?.scrollTo({ x: width * nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={styles.slide}>
            <Image source={slide.image} style={styles.image} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.textContainer}>
        <Text style={styles.text}>{t(SLIDES[currentIndex].textKey)}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>{t('Log In')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
            <Text style={styles.signupText}>{t('Sign Up')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 0,
  },
  slide: {
    width,
    height: height * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width,
    height: height * 0.75,
    resizeMode: 'cover',
  },
  textContainer: {
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#444',
    fontFamily: 'Roboto',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 14,
  },
  loginButton: {
    backgroundColor: '#00C896',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  signupButton: {
    borderColor: '#00C896',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  signupText: {
    color: '#00C896',
    fontSize: 16,
    fontWeight: '600',
  },
});
