import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  FAB,
  Portal,
  Modal,
  TextInput,
  List,
  Avatar,
  Paragraph,
} from 'react-native-paper';
import moment from 'moment';
import 'moment/locale/fr';
import { getGlobalRecipes, getUserProfile } from '../services/firestoreService';
import { auth } from '../backend/firebase';

const { width } = Dimensions.get('window');

const PlanningScreen = () => {
  const [meals, setMeals] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    loadMeals();
    loadRecipes();
  }, []);

  const loadMeals = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const profile = await getUserProfile();
      setMeals(profile?.mealPlans || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des repas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      const recipes = await getGlobalRecipes();
      setAllRecipes(recipes || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des recettes:', error);
    }
  };

  const addMeal = async (date, recipe) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const newMeal = {
        date: date.toISOString(),
        recipeId: recipe.id,
        recipeName: recipe.name,
        type: 'dinner',
        id: Date.now().toString(),
      };

      await updateDocument('users', userId, {
        mealPlans: [...meals, newMeal],
      });

      setMeals([...meals, newMeal]);
      setShowAddMealModal(false);
      setSelectedRecipe(null);

      console.log('✅ Repas ajouté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du repas:', error);
    }
  };

  const deleteMeal = async (mealId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const updatedMeals = meals.filter(meal => meal.id !== mealId);
      await updateDocument('users', userId, {
        mealPlans: updatedMeals,
      });

      setMeals(updatedMeals);
      console.log('✅ Repas supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du repas:', error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>
            {moment(selectedDate).format('MMMM YYYY')}
          </Text>
          <View style={styles.calendarControls}>
            <Button
              icon="chevron-left"
              onPress={() => setSelectedDate(moment(selectedDate).subtract(1, 'month').toDate())}
            >
              Précédent
            </Button>
            <Button
              icon="chevron-right"
              onPress={() => setSelectedDate(moment(selectedDate).add(1, 'month').toDate())}
            >
              Suivant
            </Button>
          </View>
        </View>

        <View style={styles.calendarGrid}>
          {moment.weekdaysShort().map((day) => (
            <Text key={day} style={styles.dayHeader}>
              {day}
            </Text>
          ))}

          {moment(selectedDate).daysInMonth() > 0 &&
            moment(selectedDate).daysInMonth().map((day, index) => {
              const date = moment(selectedDate).date(day);
              const meal = meals.find(m => moment(m.date).isSame(date, 'day'));

              return (
                <View key={index} style={styles.dayCell}>
                  <Text style={styles.dayNumber}>{day}</Text>
                  {meal && (
                    <List.Item
                      title={meal.recipeName}
                      left={(props) => (
                        <Avatar.Icon
                          {...props}
                          icon="food"
                          size={40}
                          style={styles.mealAvatar}
                        />
                      )}
                      right={(props) => (
                        <List.Icon
                          {...props}
                          icon="delete"
                          color={theme.colors.error}
                          onPress={() => deleteMeal(meal.id)}
                        />
                      )}
                    />
                  )}
                </View>
              );
            })}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={showAddMealModal}
          onDismiss={() => setShowAddMealModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title
              title="Ajouter un repas"
              subtitle={moment(selectedDate).format('dddd D MMMM')}
            />
            <Card.Content>
              <View style={styles.recipeList}>
                {allRecipes.map((recipe) => (
                  <List.Item
                    key={recipe.id}
                    title={recipe.name}
                    description={recipe.description}
                    left={(props) => (
                      <Avatar.Image
                        {...props}
                        source={{ uri: recipe.image }}
                        size={40}
                      />
                    )}
                    right={(props) => (
                      <List.Icon
                        {...props}
                        icon="plus"
                        color={theme.colors.primary}
                        onPress={() => {
                          addMeal(selectedDate, recipe);
                        }}
                      />
                    )}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          setSelectedDate(new Date());
          setShowAddMealModal(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
  },
  calendarHeader: {
    padding: 16,
    backgroundColor: '#2D2C3E',
    borderBottomWidth: 1,
    borderBottomColor: '#4F46E5',
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E1F2',
    textAlign: 'center',
    marginBottom: 16,
  },
  calendarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  calendarGrid: {
    backgroundColor: '#2D2C3E',
    padding: 8,
  },
  dayHeader: {
    width: width / 7,
    textAlign: 'center',
    color: '#E2E1F2',
    fontWeight: 'bold',
  },
  dayCell: {
    width: width / 7,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4F46E5',
  },
  dayNumber: {
    textAlign: 'center',
    color: '#E2E1F2',
  },
  mealAvatar: {
    backgroundColor: '#4F46E5',
  },
  modalContainer: {
    backgroundColor: '#2D2C3E',
    padding: 16,
  },
  recipeList: {
    maxHeight: 400,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
  },
});

export default PlanningScreen;
