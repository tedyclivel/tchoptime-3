import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getOnboardingImages } from '../services/api';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [images, setImages] = useState({});
  const navigation = useNavigation();

  const slides = [
    {
      title: 'Planification Simplifiée',
      description: 'Organisez vos menus hebdomadaires en quelques clics.',
      imageType: 'background',
      imagePath: 'planning',
    },
    {
      title: 'Courses Intelligentes',
      description: 'Générez vos listes de courses automatiquement et économisez du temps.',
      imageType: 'background',
      imagePath: 'shopping',
    },
    {
      title: 'Cuisine Assistée',
      description: 'Laissez l\'IA vous guider dans la cuisine avec des tutoriels vidéo.',
      imageType: 'background',
      imagePath: 'cooking',
    },
  ];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getOnboardingImages();
        setImages(data);
      } catch (error) {
        console.error('Erreur lors du chargement des images d\'onboarding:', error);
      }
    };
    fetchImages();
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.replace('Auth');
    }
  };

  const handleSkip = () => {
    navigation.replace('Auth');
  };

  const currentSlideData = slides[currentSlide];
  const backgroundImage = images[currentSlideData.imagePath];

  return (
    <LinearGradient
      colors={['#4F46E5', '#818CF8']}
      style={styles.container}
    >
      <View style={styles.content}>
        {backgroundImage && (
          <ImageBackground
            source={{ uri: backgroundImage }}
            style={styles.background}
            resizeMode="cover"
          >
            <View style={styles.overlay}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.title}>{currentSlideData.title}</Text>
                  <Text style={styles.description}>{currentSlideData.description}</Text>
                </Card.Content>
              </Card>
            </View>
          </ImageBackground>
        )}
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextText}>
            {currentSlide < slides.length - 1 ? 'Suivant' : 'Commencer'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
  },
  card: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#4F46E5',
    fontSize: 16,
  },
  nextButton: {
    padding: 10,
  },
  nextText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
