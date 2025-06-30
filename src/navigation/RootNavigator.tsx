// src/navigation/RootNavigator.tsx (RESTAURÉ - SANS DRAWER NAVIGATOR)
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';

// Importez vos écrans
import AuthScreen from '../screens/Auth/AuthScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import UserProfileScreen from '../screens/Profile/UserProfileScreen';
import MainTabNavigator from './MainTabNavigator'; // Importez MainTabNavigator

// Définir les types des paramètres pour chaque route de la stack principale
export type RootStackParamList = {
  Auth: undefined;
  SignUp: undefined;
  UserProfile: undefined;
  MainTabs: undefined; // La route pour le MainTabNavigator (plus AuthenticatedApp)
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUserAndProfile = async () => {
      if (authLoading) {
        return;
      }

      if (user) {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            setInitialRoute('MainTabs'); // Redirige directement vers le navigateur principal par onglets
          } else {
            setInitialRoute('UserProfile');
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du profil:", error);
          setInitialRoute('UserProfile');
        } finally {
          setIsProfileLoading(false);
        }
      } else {
        setInitialRoute('Auth');
        setIsProfileLoading(false);
      }
    };

    checkUserAndProfile();
  }, [user, authLoading]);

  if (initialRoute === null || authLoading || isProfileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Préparation de l'application...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      {/* Écrans non-authentifiés */}
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />

      {/* Écran de profil (accessible même sans profil si redirection nécessaire) */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />

      {/* Le flux authentifié entier est encapsulé dans le MainTabNavigator */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
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
});

export default RootNavigator;