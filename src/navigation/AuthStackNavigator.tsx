// src/navigation/AuthStackNavigator.tsx (Code complet et à jour)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importez les écrans d'authentification avec leurs noms de fichiers corrects.
// Assurez-vous que ces fichiers (AuthScreen.tsx et SignUpScreen.tsx) existent
// dans le dossier '../screens/Auth/'.
import AuthScreen from '../screens/Auth/AuthScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';

// Définition des types pour les paramètres de la pile d'authentification.
// Ces noms de route ('Auth', 'SignUp') doivent correspondre aux noms utilisés
// dans les composants AuthStack.Screen ci-dessous et dans les navigations.
export type AuthStackParamList = {
  Auth: undefined;     // Route pour l'écran d'authentification/connexion
  SignUp: undefined;   // Route pour l'écran d'inscription
};

// Créez une instance du Stack Navigator avec les types définis.
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Le composant AuthStackNavigator qui encapsule les écrans d'authentification.
const AuthStackNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Écran principal d'authentification (connexion) */}
      <AuthStack.Screen name="Auth" component={AuthScreen} />
      {/* Écran d'inscription */}
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

// Exportation par défaut du navigateur de pile d'authentification.
// C'est cette exportation qui est importée dans App.tsx.
export default AuthStackNavigator;
