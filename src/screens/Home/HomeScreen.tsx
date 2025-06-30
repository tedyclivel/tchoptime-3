// src/screens/Home/HomeScreen.tsx (RESTAURÉ - SANS BOUTON DRAWER)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
// Plus besoin d'importer useNavigation ou DrawerActions
// Plus besoin de BottomTabScreenProps non plus ici, le composant est juste un composant de l'onglet.
// type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'HomeTab'>; // Supprimer ou commenter

const { width } = Dimensions.get('window');

// Importez vos images de recette locales
const recipeOfTheDayImage = require('../../assets/images/recipe_of_the_day.jpg');
const topRecipe1 = require('../../assets/images/top_recipe1.jpg');
const topRecipe2 = require('../../assets/images/top_recipe2.jpg');
const topRecipe3 = require('../../assets/images/top_recipe3.jpg');

const HomeScreen: React.FC = () => { // Type de props simplifié
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      alert('Échec de la déconnexion.');
    }
  };

  // Données de recettes simulées pour l'exemple
  const dailyRecipe = {
    id: '1',
    name: 'Lasagnes à la bolognaise',
    image: recipeOfTheDayImage,
    description: 'Un classique réconfortant pour toute la famille.',
    rating: 4.8,
  };

  const topRecipes = [
    {
      id: '2',
      name: 'Curry de légumes express',
      image: topRecipe1,
      time: '30 min',
      difficulty: 'Facile',
    },
    {
      id: '3',
      name: 'Gâteau au chocolat fondant',
      image: topRecipe2,
      time: '45 min',
      difficulty: 'Moyenne',
    },
    {
      id: '4',
      name: 'Salade César revisitée',
      image: topRecipe3,
      time: '20 min',
      difficulty: 'Facile',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* En-tête de bienvenue (restauré sans bouton drawer) */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Bonjour {user?.email ? user.email.split('@')[0] : '!'}</Text>
          <Text style={styles.taglineText}>Prêt(e) à cuisiner ?</Text>
        </View>

        {/* Section Recette du jour */}
        <Text style={styles.sectionTitle}>Recette du jour</Text>
        <TouchableOpacity style={styles.dailyRecipeCard}>
          <Image source={dailyRecipe.image} style={styles.dailyRecipeImage} />
          <View style={styles.dailyRecipeInfo}>
            <Text style={styles.dailyRecipeName}>{dailyRecipe.name}</Text>
            <Text style={styles.dailyRecipeDescription}>{dailyRecipe.description}</Text>
            <Text style={styles.dailyRecipeRating}>⭐️ {dailyRecipe.rating}</Text>
          </View>
        </TouchableOpacity>

        {/* Section Vos Top Recettes */}
        <Text style={styles.sectionTitle}>Vos Top Recettes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topRecipesScroll}>
          {topRecipes.map(recipe => (
            <TouchableOpacity key={recipe.id} style={styles.topRecipeCard}>
              <Image source={recipe.image} style={styles.topRecipeImage} />
              <View style={styles.topRecipeInfo}>
                <Text style={styles.topRecipeName} numberOfLines={2}>{recipe.name}</Text>
                <Text style={styles.topRecipeDetails}>{recipe.time} • {recipe.difficulty}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bouton de déconnexion */}
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.logoutButtonText}>Déconnexion</Text>
            )}
          </TouchableOpacity>
        </View>
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
  welcomeContainer: { // RESTAURÉ
    padding: 20,
    backgroundColor: '#FF6F61',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  taglineText: {
    fontSize: 18,
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  dailyRecipeCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  dailyRecipeImage: {
    width: '100%',
    height: width * 0.5,
    resizeMode: 'cover',
  },
  dailyRecipeInfo: {
    padding: 15,
  },
  dailyRecipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dailyRecipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  dailyRecipeRating: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  topRecipesScroll: {
    paddingLeft: 20,
    paddingBottom: 10,
  },
  topRecipeCard: {
    backgroundColor: '#FFF',
    width: width * 0.4,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  topRecipeImage: {
    width: '100%',
    height: width * 0.3,
    resizeMode: 'cover',
  },
  topRecipeInfo: {
    padding: 10,
  },
  topRecipeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  topRecipeDetails: {
    fontSize: 12,
    color: '#666',
  },
  topRecipeRating: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 5,
  },
  bottomButtonsContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

function alert(arg0: string) {
  throw new Error('Function not implemented.');
}
