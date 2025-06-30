// src/navigation/RecipesStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importez les écrans du flux de recettes
import RecipesScreen from '../screens/Recipes/RecipesScreen';
import RecipeDetailScreen from '../screens/Recipes/RecipeDetailScreen'; // Nous allons créer cet écran

// Définir les types des paramètres pour la pile des recettes
export type RecipesStackParamList = {
  RecipesList: undefined; // Le premier écran de la liste
  RecipeDetail: {
    id: string;
    name: string;
    image: any;
    time: string;
    difficulty: string;
    rating: number;
    ingredients: string[]; // Ajout pour les détails
    steps: string[]; // Ajout pour les détails
  };
};

const Stack = createNativeStackNavigator<RecipesStackParamList>();

const RecipesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecipesList" component={RecipesScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
};

export default RecipesStackNavigator;