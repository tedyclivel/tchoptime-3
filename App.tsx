// App.tsx (MIS À JOUR - SANS ROOTDRAWERNAVIGATOR)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStackNavigator from './src/navigation/AuthStackNavigator';
import OnboardingScreen from './src/screens/Onboarding/OnboardingScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator'; // ⭐ Re-import direct du MainTabNavigator ⭐
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

const RootNavigator: React.FC = () => {
  const { user, isLoading, isProfileSetup, authInitialized } = useAuth();

  if (!authInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Préparation de l'application...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthStackNavigator />;
  }

  if (!isProfileSetup) {
    return <OnboardingScreen />;
  }

  // ⭐ Navigue directement vers MainTabNavigator après l'onboarding ⭐
  return <MainTabNavigator />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default App;