// src/screens/Onboarding/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext'; // Pour accéder à updateUserProfile et isProfileSetup

const OnboardingScreen: React.FC = () => {
  const { user, isLoading, updateUserProfile } = useAuth();
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleCompleteOnboarding = async () => {
    if (usernameInput.trim().length === 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'utilisateur.');
      return;
    }

    setIsSaving(true);
    try {
      // Utilisez la fonction updateUserProfile du AuthContext pour sauvegarder le nom
      // Cela marquera aussi isProfileSetup à true automatiquement dans le contexte
      await updateUserProfile(usernameInput.trim(), user?.photoURL || undefined); // Conserve l'avatar existant si il y en a un
      Alert.alert('Bienvenue !', 'Votre profil a été configuré avec succès.');
    } catch (error) {
      console.error("Erreur lors de la configuration du profil d'onboarding:", error);
      Alert.alert('Erreur', 'Impossible de configurer votre profil. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Icon name="chef-hat" size={100} color="#FF6F61" style={styles.icon} />
          <Text style={styles.title}>Bienvenue sur TchopTime !</Text>
          <Text style={styles.subtitle}>
            Avant de commencer, aidez-nous à configurer votre profil.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Quel est votre nom ?"
              placeholderTextColor="#999"
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCompleteOnboarding}
            disabled={isSaving || isLoading} // Désactive le bouton pendant la sauvegarde ou le chargement global de l'authentification
          >
            {isSaving || isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>C'est parti !</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textInput: {
    height: 50,
    fontSize: 18,
    color: '#333',
  },
  button: {
    backgroundColor: '#FF6F61',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;