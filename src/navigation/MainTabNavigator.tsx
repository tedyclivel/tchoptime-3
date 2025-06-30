// src/navigation/MainTabNavigator.tsx (MIS À JOUR - AVEC ONGLET STOCK)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text, View, StyleSheet, Platform } from 'react-native';

// Importez tous les écrans qui seront dans les onglets
import HomeScreen from '../screens/Home/HomeScreen';
import RecipesStackNavigator from './RecipesStackNavigator';
import PlanningScreen from '../screens/Planning/PlanningScreen';
import ShoppingListScreen from '../screens/ShoppingList/ShoppingListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import FamilyManagementScreen from '../screens/FamilyManagement/FamilyManagementScreen';
//import MarketsScreen from '../screens/Markets/MarketsScreen';
import StockManagementScreen from '../screens/StockManagement/StockManagementScreen'; // ⭐ Importez le nouvel écran StockManagementScreen ⭐

// Définition des types pour les paramètres des routes de l'onglet principal
export type MainTabParamList = {
  HomeTab: undefined;
  RecipesTab: undefined;
  PlanningTab: undefined;
  ShoppingListTab: undefined;
  ProfileTab: undefined;
  FamilyManagementTab: undefined;
  MarketsTab: undefined;
  StockTab: undefined; // ⭐ Ajoutez la nouvelle route pour le stock ⭐
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6F61',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 0,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 10 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: Platform.OS === 'ios' ? 0 : 3,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          if (route.name === 'HomeTab') {
            iconName = 'home';
          } else if (route.name === 'RecipesTab') {
            iconName = 'food-fork-drink';
          } else if (route.name === 'PlanningTab') {
            iconName = 'calendar-month';
          } else if (route.name === 'ShoppingListTab') {
            iconName = 'cart';
          } else if (route.name === 'ProfileTab') {
            iconName = 'account-circle';
          } else if (route.name === 'FamilyManagementTab') {
            iconName = 'account-group';
          } else if (route.name === 'MarketsTab') {
            iconName = 'store';
          } else if (route.name === 'StockTab') { // ⭐ Nouvelle condition pour l'onglet Stock ⭐
            iconName = 'archive'; // Ou 'food-variant'
          } else {
            iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="RecipesTab"
        component={RecipesStackNavigator}
        options={{ tabBarLabel: 'Recettes' }}
      />
      <Tab.Screen
        name="PlanningTab"
        component={PlanningScreen}
        options={{ tabBarLabel: 'Planning' }}
      />
      <Tab.Screen
        name="ShoppingListTab"
        component={ShoppingListScreen}
        options={{ tabBarLabel: 'Courses' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
      <Tab.Screen
        name="FamilyManagementTab"
        component={FamilyManagementScreen}
        options={{ tabBarLabel: 'Famille' }}
      />
      {/*<Tab.Screen
        name="MarketsTab"
       // component={MarketsScreen}
        options={{ tabBarLabel: 'Marchés' }}
      />*/}
      <Tab.Screen
        name="StockTab" // ⭐ Nouvel onglet pour le stock ⭐
        component={StockManagementScreen}
        options={{ tabBarLabel: 'Stock' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
});

export default MainTabNavigator;
