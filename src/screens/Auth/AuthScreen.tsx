// src/screens/Auth/AuthScreen.tsx (MIS À JOUR)
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert, // Importez Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../context/AuthContext';

const logo = require('../../assets/images/logo_marmiton.png');

interface AuthScreenProps extends NativeStackScreenProps<RootStackParamList, 'Auth'> {}

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre email et votre mot de passe.');
      return;
    }
    try {
      await login(email, password);
      // La navigation est gérée par RootNavigator après succès de la connexion et vérification du profil.
    } catch (error: any) {
      let errorMessage = 'Une erreur est survenue lors de la connexion.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adresse email invalide.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Cet utilisateur a été désactivé.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Email ou mot de passe incorrect.';
      }
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    Alert.alert('Fonctionnalité à venir', 'La récupération de mot de passe sera bientôt disponible.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Se connecter</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OU</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={handleCreateAccount}
            disabled={isLoading}
          >
            <Text style={styles.createAccountButtonText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  logo: {
    width: 150,
    height: 60,
  },
  formContainer: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#FF6F61',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  createAccountButton: {
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AuthScreen;