// src/screens/Planning/PlanningScreen.tsx (CORRECTION DÉFINITIVE DE L'ESPACE DE NOMS FIRESTORE)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

// TRÈS IMPORTANT : Importez le type 'FirebaseFirestoreTypes' explicitement
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Importez les recettes factices depuis RecipesScreen pour la sélection
import { DUMMY_RECIPES } from '../Recipes/RecipesScreen';

const { width } = Dimensions.get('window');

interface Recipe {
  id: string;
  name: string;
  image: any;
  time: string;
  difficulty: string;
  rating: number;
  ingredients: string[];
  steps: string[];
}

interface PlannedMeal {
  id: string;
  recipeId: string;
  recipeName: string;
  type: 'Déjeuner' | 'Dîner' | 'Petit-déjeuner' | string;
  date: string;
  userId: string;
  createdAt?: FirebaseFirestoreTypes.FieldValue; // Utilisation du type explicitement importé
  updatedAt?: FirebaseFirestoreTypes.FieldValue; // Utilisation du type explicitement importé
}

interface DailyPlan {
  date: Date;
  meals: PlannedMeal[];
}

const MealTypes = ['Petit-déjeuner', 'Déjeuner', 'Dîner'];

const PlanningScreen: React.FC = () => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddMealModal, setShowAddMealModal] = useState<boolean>(false);
  const [selectedDateForPlanning, setSelectedDateForPlanning] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchRecipeQuery, setSearchRecipeQuery] = useState<string>('');

  const getPlannedMealsCollectionRef = () => {
    if (!user?.uid) {
      console.error("User not authenticated to access planned meals collection.");
      return null;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return firestore().collection(`artifacts/${appId}/users/${user.uid}/plannedMeals`);
  };

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setPlannedMeals([]);
      return;
    }

    const collectionRef = getPlannedMealsCollectionRef();
    if (!collectionRef) return;

    const unsubscribe = collectionRef
      .onSnapshot(
        (snapshot) => {
          const meals: PlannedMeal[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Omit<PlannedMeal, 'id'>;
            meals.push({ id: doc.id, ...data });
          });
          setPlannedMeals(meals);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching planned meals: ", error);
          setIsLoading(false);
          Alert.alert("Erreur", "Impossible de charger votre planning de repas.");
        }
      );

    return () => unsubscribe();
  }, [user]);

  const getDaysOfWeek = (startDay: Date) => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startDay, i));
  };

  const daysOfWeek = getDaysOfWeek(currentWeekStart);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const getMealsForDay = (date: Date): PlannedMeal[] => {
    return plannedMeals.filter(meal => isSameDay(parseISO(meal.date), date));
  };

  const handleOpenAddMealModal = (date: Date) => {
    setSelectedDateForPlanning(date);
    setSelectedMealType('');
    setSelectedRecipe(null);
    setSearchRecipeQuery('');
    setShowAddMealModal(true);
  };

  const handleCloseAddMealModal = () => {
    setShowAddMealModal(false);
    setSelectedDateForPlanning(null);
    setSelectedMealType('');
    setSelectedRecipe(null);
    setSearchRecipeQuery('');
  };

  const handleSavePlannedMeal = async () => {
    if (!user?.uid) {
      Alert.alert('Erreur', 'Vous devez être connecté pour planifier un repas.');
      return;
    }
    if (!selectedDateForPlanning || !selectedMealType || !selectedRecipe) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date, un type de repas et une recette.');
      return;
    }

    setIsLoading(true);
    try {
      const collectionRef = getPlannedMealsCollectionRef();
      if (!collectionRef) return;

      await collectionRef.add({
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.name,
        type: selectedMealType,
        date: format(selectedDateForPlanning, 'yyyy-MM-dd'),
        userId: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(), // Toujours firestore.FieldValue
        updatedAt: firestore.FieldValue.serverTimestamp(), // Toujours firestore.FieldValue
      });
      Alert.alert('Succès', 'Repas planifié avec succès !');
      handleCloseAddMealModal();
    } catch (error) {
      console.error('Erreur lors de la planification du repas:', error);
      Alert.alert('Erreur', 'Impossible de planifier le repas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlannedMeal = (mealId: string) => {
    Alert.alert(
      'Supprimer le repas',
      'Voulez-vous vraiment supprimer ce repas planifié ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            if (!user?.uid) return;
            setIsLoading(true);
            try {
              const collectionRef = getPlannedMealsCollectionRef();
              if (!collectionRef) return;
              await collectionRef.doc(mealId).delete();
              Alert.alert('Succès', 'Repas supprimé !');
            } catch (error) {
              console.error('Erreur lors de la suppression du repas:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le repas.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const filteredRecipes = DUMMY_RECIPES.filter((recipe: Recipe) =>
    recipe.name.toLowerCase().includes(searchRecipeQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Chargement du planning...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Planning Repas</Text>
      </View>

      <View style={styles.weekNavigator}>
        <TouchableOpacity onPress={handlePreviousWeek} style={styles.arrowButton}>
          <Icon name="chevron-left" size={30} color="#FF6F61" />
        </TouchableOpacity>
        <Text style={styles.weekRange}>
          {format(currentWeekStart, 'dd MMMM', { locale: fr })} -{' '}
          {format(addDays(currentWeekStart, 6), 'dd MMMM', { locale: fr })}
        </Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.arrowButton}>
          <Icon name="chevron-right" size={30} color="#FF6F61" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.dailyPlansContainer}>
        {daysOfWeek.map((day, index) => {
          const meals = getMealsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <View key={index} style={styles.dayCard}>
              <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
                <Text style={[styles.dayName, isToday && styles.dayName]}>
                  {format(day, 'EEEE', { locale: fr })}
                </Text>
                <Text style={[styles.dayDate, isToday && styles.dayDate]}>
                  {format(day, 'dd/MM', { locale: fr })}
                </Text>
              </View>
              <View style={styles.mealsList}>
                {meals.length > 0 ? (
                  meals.map((meal) => (
                    <View key={meal.id} style={styles.mealItem}>
                      <Text style={styles.mealType}>{meal.type}:</Text>
                      <Text style={styles.mealName}>{meal.recipeName}</Text>
                      <TouchableOpacity onPress={() => handleDeletePlannedMeal(meal.id)} style={styles.deleteMealButton}>
                        <Icon name="close-circle" size={20} color="#FF6F61" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noMealText}>Aucun repas planifié</Text>
                )}
                <TouchableOpacity style={styles.addMealButton} onPress={() => handleOpenAddMealModal(day)}>
                  <Icon name="plus-circle" size={24} color="#6A5ACD" />
                  <Text style={styles.addMealButtonText}>Ajouter un repas</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal d'ajout de repas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddMealModal}
        onRequestClose={handleCloseAddMealModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Planifier un repas</Text>
            <Text style={styles.modalDate}>Pour le {format(selectedDateForPlanning || new Date(), 'dd MMMM', { locale: fr })}</Text>

            <Text style={styles.inputLabel}>Type de repas:</Text>
            <View style={styles.mealTypeContainer}>
              {MealTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealTypePill, selectedMealType === type && styles.selectedMealTypePill]}
                  onPress={() => setSelectedMealType(type)}
                >
                  <Text style={[styles.mealTypePillText, selectedMealType === type && styles.selectedMealTypePillText]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Rechercher une recette:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Poulet Yassa"
              value={searchRecipeQuery}
              onChangeText={setSearchRecipeQuery}
            />

            <ScrollView style={styles.recipeListScrollView}>
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipeItem: Recipe) => (
                  <TouchableOpacity
                    key={recipeItem.id}
                    style={[styles.recipeSelectionItem, selectedRecipe?.id === recipeItem.id && styles.selectedRecipeSelectionItem]}
                    onPress={() => setSelectedRecipe(recipeItem)}
                  >
                    <Image source={recipeItem.image} style={styles.recipeSelectionImage} />
                    <Text style={styles.recipeSelectionText}>{recipeItem.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noRecipeFound}>Aucune recette trouvée.</Text>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleCloseAddMealModal} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePlannedMeal} style={[styles.modalButton, styles.saveButton]} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Planifier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  weekNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  arrowButton: {
    padding: 10,
  },
  weekRange: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dailyPlansContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  dayCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dayHeader: {
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayHeader: {
    backgroundColor: '#6A5ACD',
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  dayDate: {
    fontSize: 16,
    color: '#FFF',
  },
  mealsList: {
    padding: 15,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  mealType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  mealName: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  deleteMealButton: {
    marginLeft: 10,
    padding: 5,
  },
  noMealText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6EE9C',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  addMealButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#689F38',
  },

  // Styles pour la Modal d'ajout de repas
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    marginTop: 15,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    justifyContent: 'space-around',
  },
  mealTypePill: {
    backgroundColor: '#EEE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedMealTypePill: {
    backgroundColor: '#FF6F61',
    borderColor: '#FF6F61',
  },
  mealTypePillText: {
    color: '#333',
    fontWeight: 'bold',
  },
  selectedMealTypePillText: {
    color: '#FFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  recipeListScrollView: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    paddingVertical: 5,
    marginBottom: 15,
  },
  recipeSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFF',
  },
  selectedRecipeSelectionItem: {
    backgroundColor: '#FFECB3',
  },
  recipeSelectionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  recipeSelectionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  noRecipeFound: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#FF6F61',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlanningScreen;