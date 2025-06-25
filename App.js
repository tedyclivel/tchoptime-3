import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import lightTheme from './src/frontend/themes/lightTheme';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "tchoptime-2.firebaseapp.com",
  projectId: "tchoptime-2",
  storageBucket: "tchoptime-2.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Auth Screens
import SignInScreen from './src/frontend/screens/Auth/SignInScreen';
import SignUpScreen from './src/frontend/screens/Auth/SignUpScreen';
import ForgotPasswordScreen from './src/frontend/screens/Auth/ForgotPasswordScreen';

// Main App Screens
import DashboardScreen from './src/frontend/screens/DashboardScreen';
import ShoppingListScreen from './src/frontend/screens/ShoppingListScreen';
import MealPlanningScreen from './src/frontend/screens/MealPlanningScreen';
import FamilyMembersScreen from './src/frontend/screens/FamilyMembersScreen';
import SettingsScreen from './src/frontend/screens/SettingsScreen';

// Auth Stack
const AuthStack = createStackNavigator();
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: '#fff',
      }}
    >
      <AuthStack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: 'Connexion' }}
      />
      <AuthStack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: 'Inscription' }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Mot de passe oublié' }}
      />
    </AuthStack.Navigator>
  );
};

// Main App Stack
const MainStack = createStackNavigator();
const MainNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: '#fff',
      }}
    >
      <MainStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Tableau de bord' }}
      />
    </MainStack.Navigator>
  );
};

// Main App Tabs
const Tab = createBottomTabNavigator();
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#818CF8',
        tabBarStyle: {
          backgroundColor: '#171624',
          borderTopColor: '#2D2C3E',
        },
      }}
    >
      <Tab.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{
          title: 'Liste de courses',
        }}
      />
      <Tab.Screen
        name="MealPlanning"
        component={MealPlanningScreen}
        options={{
          title: 'Planification',
        }}
      />
      <Tab.Screen
        name="FamilyMembers"
        component={FamilyMembersScreen}
        options={{
          title: 'Famille',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Paramètres',
        }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  // TODO: Add authentication state management
  const isAuthenticated = false; // Replace with actual auth state

  return (
    <PaperProvider theme={lightTheme}>
      <NavigationContainer>
        {isAuthenticated ? (
          <TabNavigator />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
