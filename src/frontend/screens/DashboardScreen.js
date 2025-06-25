import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { auth, firestore } from '../../backend/firebase';
import { useTheme } from '@react-navigation/native';

const DashboardScreen = ({ navigation }) => {
  const [meals, setMeals] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { colors } = useTheme();

  useEffect(() => {
    // Utilisation de l'auth et firestore centralisés
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Souscription aux données des repas
        const unsubscribeMeals = onSnapshot(
          collection(firestore, 'users', user.uid, 'mealPlans'),
          (snapshot) => {
            const mealsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMeals(mealsData);
            setLoading(false);
          },
          (error) => {
            console.error('Erreur lors de la récupération des repas:', error);
            setLoading(false);
          }
        );

        return () => unsubscribeMeals();
      } else {
        setMeals([]);
        setUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleMealPress = (meal) => {
    navigation.navigate('MealPlanning', { mealId: meal.id });
  };

  useEffect(() => {
    if (!db || !userId) return;

    const collectionPath = `/artifacts/${__app_id || 'default-app-id'}/users/${userId}/123456_A_Groupe10_plat37`;
    const mealsCollectionRef = collection(db, collectionPath);

    const unsubscribe = onSnapshot(mealsCollectionRef, (snapshot) => {
      try {
        const fetchedMeals = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().recipeName,
          date: doc.data().date,
          image: doc.data().imageURL || 'https://res.cloudinary.com/dvznrkhu4/image/upload/v1750028383/123456_A_Groupe10_plat37.jpg\'image',
        }));
        setMeals(fetchedMeals);
      } catch (error) {
        console.error("Erreur Firestore:", error);
      }
    }, (error) => {
      console.error("Erreur snapshot Firestore:", error);
    });

    return () => unsubscribe();
  }, [db, userId]);

  const navigate = (page, params = {}) => {
    setCurrentPage(page);
    console.log(`Navigation vers ${page}`, params);
  };

  const DashboardContent = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🍽️ Mes repas planifiés</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : meals.length > 0 ? (
        meals.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.mealItem}
            onPress={() => navigate("MealPlanningScreen", { mealId: item.id })}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.mealImage}
              onError={(e) => (e.nativeEvent.target.src = 'https://res.cloudinary.com/dvznrkhu4/image/upload/v1750028383/123456_A_Groupe10_plat37.jpg\'image')}
            />
            <View style={styles.mealTextContainer}>
              <Text style={styles.mealDate}>{item.date}</Text>
              <Text style={styles.mealName}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noMealText}>Aucun repas planifié pour le moment.</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={() => navigate("ManageMealsScreen")}>
        <Text style={styles.buttonText}>Gérer mes repas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#0d9488' }]} onPress={() => navigate("ShoppingListScreen")}>
        <Text style={styles.buttonText}>Voir ma liste de courses</Text>
      </TouchableOpacity>

      <Text style={styles.userId}>ID Utilisateur: {userId || 'Authentification...'}</Text>
    </ScrollView>
  );

  const MealPlanningScreen = ({ mealId }) => (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Détails de planification pour : {mealId}</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  const ShoppingListScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Écran liste de courses</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  const ManageMealsScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Écran de gestion des repas</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {currentPage === 'dashboard' && <DashboardContent />}
      {currentPage === 'MealPlanningScreen' && <MealPlanningScreen mealId={null} />}
      {currentPage === 'ShoppingListScreen' && <ShoppingListScreen />}
      {currentPage === 'ManageMealsScreen' && <ManageMealsScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#4F46E5',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    color: '#4F46E5',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
  },
  mealItem: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  mealTextContainer: {
    flex: 1,
  },
  mealDate: {
    color: '#a5b4fc',
    fontSize: 14,
  },
  mealName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noMealText: {
    marginTop: 20,
    color: '#9ca3af',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userId: {
    marginTop: 20,
    color: '#9ca3af',
    fontSize: 12,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  screenTitle: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});

export default App;
