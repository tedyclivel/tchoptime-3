import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  FAB,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { firestore } from '../../backend/firebase';

const MealPlanningScreen = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(firestore, 'mealPlans'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      setMeals(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })));
    } catch (error) {
      console.error('Erreur lors de la récupération des repas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMeals();
    setRefreshing(false);
  }, []);

  const handleAddMeal = () => {
    // TODO: Implement meal addition logic
    navigation.navigate('AddMeal');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddMeal}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {meals.map((meal) => (
          <Card
            key={meal.id}
            style={styles.mealCard}
          >
            <Card.Content>
              <Text variant="titleMedium">{meal.name}</Text>
              <Text>{meal.date}</Text>
              <Text>{meal.time}</Text>
              <Text>{meal.description}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
  },
  scrollView: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  mealCard: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171624',
  },
});

export default MealPlanningScreen;
