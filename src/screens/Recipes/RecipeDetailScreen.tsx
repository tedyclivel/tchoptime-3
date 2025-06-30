// src/screens/Recipes/RecipeDetailScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform, // Import Platform for StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecipesStackParamList } from '../../navigation/RecipesStackNavigator'; // Importez la liste des paramètres de la pile des recettes
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Définition des props de navigation pour RecipeDetailScreen
type RecipeDetailScreenProps = NativeStackScreenProps<RecipesStackParamList, 'RecipeDetail'>;

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ route, navigation }) => {
  // Récupère les données de la recette passées via les paramètres de navigation
  const { name, image, time, difficulty, rating, ingredients, steps } = route.params;

  const handleGoBack = () => {
    navigation.goBack(); // Retourne à l'écran précédent (RecipesScreen)
  };

  const handleGenerateVideo = () => {
    // Logique pour générer le tutoriel vidéo IA (à implémenter plus tard)
    alert(`Génération du tutoriel vidéo IA pour "${name}"...`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* En-tête avec bouton retour et titre */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <View style={{ width: 24 }} /> {/* Placeholder pour alignement */}
        </View>

        {/* Image de la recette */}
        <Image source={image} style={styles.recipeImage} />

        {/* Informations générales */}
        <View style={styles.infoContainer}>
          <Text style={styles.recipeName}>{name}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}><Icon name="clock-outline" size={16} color="#666" /> {time}</Text>
            <Text style={styles.metaText}><Icon name="tools" size={16} color="#666" /> {difficulty}</Text>
            <Text style={styles.metaText}>⭐️ {rating}</Text>
          </View>
        </View>

        {/* Ingrédients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          {ingredients.map((item, index) => (
            <Text key={index.toString()} style={styles.listItem}>• {item}</Text>
          ))}
        </View>

        {/* Étapes de préparation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préparation</Text>
          {steps.map((item, index) => (
            <Text key={index.toString()} style={styles.listItem}>
              <Text style={styles.stepNumber}>{index + 1}. </Text>{item}
            </Text>
          ))}
        </View>

        {/* Bouton pour le tutoriel vidéo IA */}
        <TouchableOpacity style={styles.videoButton} onPress={handleGenerateVideo}>
          <Icon name="video-outline" size={24} color="#FFF" />
          <Text style={styles.videoButtonText}>Générer Tutoriel Vidéo IA</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20, // Correction StatusBar.currentHeight
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  recipeImage: {
    width: '100%',
    height: width * 0.6,
    resizeMode: 'cover',
  },
  infoContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 15,
    marginTop: -30,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 20,
  },
  recipeName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    lineHeight: 24,
  },
  stepNumber: {
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  videoButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6F61',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  videoButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default RecipeDetailScreen;

function alert(arg0: string) {
    throw new Error('Function not implemented.');
}
