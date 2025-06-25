import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Écrans
import LoadingScreen from '../screens/LoadingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/Auth/SignInScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RecipesScreen from '../screens/RecipesScreen';
import FamilyConfigScreen from '../screens/FamilyConfigScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Navigation principale avec Drawer
const MainDrawer = () => (
  <Drawer.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#171624' },
      headerTintColor: '#E2E1F2',
      drawerStyle: { backgroundColor: '#2D2C3E' },
      drawerActiveTintColor: '#4F46E5',
      drawerInactiveTintColor: '#E2E1F2',
    }}
  >
    <Drawer.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{
        title: 'Accueil',
        drawerIcon: ({ color }) => (
          <MaterialCommunityIcons name="home" size={24} color={color} />
        ),
      }}
    />
    <Drawer.Screen 
      name="FamilyConfig" 
      component={FamilyConfigScreen} 
      options={{
        title: 'Configuration Familiale',
        drawerIcon: ({ color }) => (
          <MaterialCommunityIcons name="account-group" size={24} color={color} />
        ),
      }}
    />
    <Drawer.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{
        title: 'Mon Profil',
        drawerIcon: ({ color }) => (
          <MaterialCommunityIcons name="account" size={24} color={color} />
        ),
      }}
    />
  </Drawer.Navigator>
);

// Navigation avec Tabs pour la section principale
const MainTab = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#171624' },
      tabBarActiveTintColor: '#4F46E5',
      tabBarInactiveTintColor: '#E2E1F2',
    }}
  >
    <Tab.Screen 
      name="Planning" 
      component={DashboardScreen} 
      options={{
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="calendar" size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="ShoppingList" 
      component={RecipesScreen} 
      options={{
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="cart" size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Recipes" 
      component={RecipesScreen} 
      options={{
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="food" size={24} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Navigation Authentification
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#171624' },
      headerTintColor: '#E2E1F2',
    }}
  >
    <Stack.Screen 
      name="Welcome" 
      component={WelcomeScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="SignIn" 
      component={SignInScreen} 
      options={{ title: 'Se connecter' }}
    />
    <Stack.Screen 
      name="SignUp" 
      component={SignUpScreen} 
      options={{ title: 'Créer un compte' }}
    />
  </Stack.Navigator>
);

// Navigation App
const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Loading" 
        component={LoadingScreen}
      />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
      />
      <Stack.Screen 
        name="Auth" 
        component={AuthStack}
      />
      <Stack.Screen 
        name="Main" 
        component={MainDrawer}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
