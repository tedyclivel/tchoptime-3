import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Searchbar,
  Card,
  Text,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { getGlobalRecipes } from '../services/api';

const RecipesScreen = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await getGlobalRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des recettes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRecipeItem = ({ item }) => (
    <Card
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
    >
      <Card.Content>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{item.name}</Text>
          <View style={styles.recipeMeta}>
            <Text style={styles.recipeTime}>{item.prepTime} min</Text>
            <Text style={styles.recipeDifficulty}>
              {item.difficulty || 'Facile'}
            </Text>
          </View>
        </View>
        <View style={styles.recipeDescription}>
          <Text style={styles.recipeText} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <IconButton
          icon="plus"
          onPress={() => handleAddToPlanning(item)}
          color={theme.colors.primary}
        />
        <IconButton
          icon="eye"
          onPress={() => handleViewDetails(item)}
          color={theme.colors.primary}
        />
      </Card.Actions>
    </Card>
  );

  const handleRecipePress = (recipe) => {
    // À implémenter : navigation vers l'écran de détails de la recette
  };

  const handleAddToPlanning = (recipe) => {
    // À implémenter : ajout de la recette au planning
  };

  const handleViewDetails = (recipe) => {
    // À implémenter : navigation vers l'écran de détails de la recette
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher une recette..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
        theme={{ colors: { primary: theme.colors.primary } }}
      />
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#2D2C3E',
  },
  listContainer: {
    padding: 8,
  },
  recipeCard: {
    marginVertical: 8,
    backgroundColor: '#2D2C3E',
  },
  recipeHeader: {
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E1F2',
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  recipeTime: {
    color: '#818CF8',
  },
  recipeDifficulty: {
    color: '#E2E1F2',
  },
  recipeDescription: {
    marginTop: 8,
  },
  recipeText: {
    color: '#E2E1F2',
  },
});

export default RecipesScreen;
