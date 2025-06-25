import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../backend/firebase';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await sendPasswordResetEmail(auth, email);
      setSuccess('Un email de réinitialisation a été envoyé.');
    } catch (error) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Réinitialiser le mot de passe
          </Text>
          
          {success && (
            <Text style={[styles.text, { color: colors.primary }]}>
              {success}
            </Text>
          )}

          {error && (
            <Text style={[styles.text, { color: colors.error }]}>
              {error}
            </Text>
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={loading}
            style={styles.button}
          >
            Envoyer l'email de réinitialisation
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('SignIn')}
            style={styles.linkButton}
          >
            Retour à la connexion
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
    padding: 20,
  },
  card: {
    flex: 1,
    marginVertical: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 16,
  },
  linkButton: {
    alignSelf: 'center',
  },
  text: {
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default ForgotPasswordScreen;
