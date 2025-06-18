import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

const App = () => {
  const [meals, setMeals] = useState([]);
  const [db, setDb] = useState(null);
  const [authInstance, setAuthInstance] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuthInstance(firebaseAuth);

      const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
            } else {
              await signInAnonymously(firebaseAuth);
            }
          } catch (error) {
            console.error("Erreur de connexion Firebase:", error);
          }
        }
        setLoading(false);
      });

      return () => unsubscribeAuth();
    } catch (error) {
      console.error("Erreur d'initialisation Firebase:", error);
      setLoading(false);
    }
  }, []);

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

  const DashboardScreen = () => (
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

  switch (currentPage) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'MealPlanningScreen':
      return <MealPlanningScreen mealId={null} />;
    case 'ShoppingListScreen':
      return <ShoppingListScreen />;
    case 'ManageMealsScreen':
      return <ManageMealsScreen />;
    default:
      return <DashboardScreen />;
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#111827',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#c7d2fe',
    fontWeight: 'bold',
    marginBottom: 20,
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
