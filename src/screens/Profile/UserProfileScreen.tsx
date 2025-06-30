// src/screens/Profile/UserProfileScreen.tsx (CORRIGÉ - Redirection vers AuthenticatedApp)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../context/AuthContext';
import firestore from '@react-native-firebase/firestore';

type UserProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

interface UserProfileData {
  name: string;
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ navigation }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [profileName, setProfileName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState<boolean>(true);

  useEffect(() => {
    if (user && !authLoading) {
      const fetchUserProfile = async () => {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfileData;
            setProfileName(data.name || '');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil utilisateur:', error);
          Alert.alert('Erreur', 'Impossible de récupérer votre profil.');
        } finally {
          setIsFetchingProfile(false);
        }
      };
      fetchUserProfile();
    } else if (!user && !authLoading) {
      setIsFetchingProfile(false);
    }
  }, [user, authLoading]);

  const handleSaveProfile = async () => {
    if (!user || !user.uid) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté pour sauvegarder le profil.');
      return;
    }
    if (!profileName.trim()) {
      Alert.alert('Erreur', 'Le nom du profil ne peut pas être vide.');
      return;
    }

    setIsSaving(true);
    try {
      await firestore().collection('users').doc(user.uid).set(
        {
          name: profileName.trim(),
          email: user.email,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      Alert.alert('Succès', 'Profil enregistré !');
      // **LA LIGNE CORRIGÉE EST ICI :**
      navigation.replace('AuthenticatedApp'); // Naviguer vers la route qui contient le Drawer Navigator
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le profil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isFetchingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Compléter votre profil</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Section Photo de profil (placeholder pour l'instant) */}
          <TouchableOpacity style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>Ajouter une photo</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Nom ou Pseudo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: John Doe"
            placeholderTextColor="#999"
            value={profileName}
            onChangeText={setProfileName}
            autoCapitalize="words"
            editable={!isSaving}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer le profil</Text>
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
    backgroundColor: '#FFF',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  header: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#CCC',
  },
  avatarText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  label: {
    width: '100%',
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#FF6F61',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserProfileScreen;