// src/screens/Auth/SignUpScreen.tsx (Correction Mot de Passe)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView, // Assurez-vous que ScrollView est importé
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStackNavigator';
import { useAuth } from '../../context/AuthContext'; // Importez votre hook useAuth
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Importez Icon

type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>; // Type de route 'SignUp'

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { signUpWithEmail, isLoading } = useAuth(); // Utilisez la fonction 'signUpWithEmail' et l'état 'isLoading'
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const handleSignUp = async () => {
    // Trim les espaces blancs des emails
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      // Message d'erreur plus spécifique si les mots de passe ne correspondent pas
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas. Veuillez vérifier votre saisie.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      await signUpWithEmail(trimmedEmail, password); // Utilisez l'email nettoyé
      // L'inscription réussie mènera automatiquement à l'Onboarding ou au MainTabNavigator via App.tsx
      // Pas besoin de navigation.navigate('Auth') ici car le AuthContext gère la transition.
    } catch (error) {
      // Les erreurs sont déjà gérées et affichées via Alert dans AuthContext
      console.error("Erreur d'inscription dans SignUpScreen:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image
            source={require('../../assets/images/logo_marmiton.png')} // Assurez-vous que le logo existe
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Créez votre compte TchopTime</Text>
          <Text style={styles.subtitle}>Rejoignez notre communauté gourmande !</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email:</Text>
            <TextInput
              style={styles.input}
              placeholder="votre.email@exemple.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mot de passe:</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimum 6 caractères"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmer le mot de passe:</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignUp}
            disabled={isLoading} // Désactive le bouton pendant le chargement
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
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
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  signupButton: {
    backgroundColor: '#4CAF50', // Vert pour l'inscription
    borderRadius: 30,
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  loginText: {
    fontSize: 15,
    color: '#666',
    marginRight: 5,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
});

export default SignUpScreen;
