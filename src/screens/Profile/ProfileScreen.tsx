// src/screens/Profile/ProfileScreen.tsx (MIS À JOUR - ÉDITION DE PROFIL ET SÉLECTION D'IMAGE)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput, // Pour le champ de saisie du nom d'utilisateur
  PermissionsAndroid, // Pour les permissions Android
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker'; // Importez la fonction de sélection d'image

interface UserProfile {
  username: string;
  email: string;
  avatarUrl?: string;
}

const ProfileScreen: React.FC = () => {
  const { user, signOut, updateUserProfile } = useAuth(); // Récupère la fonction updateUserProfile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false); // État pour basculer en mode édition
  const [newUsername, setNewUsername] = useState<string>('');
  const [newAvatarUri, setNewAvatarUri] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState<boolean>(false); // Pour l'état de sauvegarde

  const getUsersCollectionRef = useCallback(() => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return firestore().collection(`artifacts/${appId}/users`);
  }, []);

  // Fonction pour charger le profil utilisateur depuis Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) {
        setIsLoadingProfile(false);
        setUserProfile(null);
        return;
      }

      try {
        const userDocRef = getUsersCollectionRef().doc(user.uid);
        const docSnap = await userDocRef.get();

        let profileData: UserProfile;
        if (docSnap.exists()) {
          const data = docSnap.data();
          profileData = {
            username: data?.username || user.displayName || 'Utilisateur',
            email: user.email || data?.email || 'Non renseigné',
            avatarUrl: data?.avatarUrl || user.photoURL || undefined,
          };
        } else {
          profileData = {
            username: user.displayName || 'Utilisateur',
            email: user.email || 'Non renseigné',
            avatarUrl: user.photoURL || undefined,
          };
        }
        setUserProfile(profileData);
        setNewUsername(profileData.username); // Initialise le champ d'édition
        setNewAvatarUri(profileData.avatarUrl); // Initialise l'URI d'édition
      } catch (error) {
        console.error("Erreur lors du chargement du profil utilisateur:", error);
        Alert.alert("Erreur", "Impossible de charger votre profil.");
        // Utiliser les infos de base en cas d'erreur
        setUserProfile({
          username: user.displayName || 'Utilisateur',
          email: user.email || 'Non renseigné',
          avatarUrl: user.photoURL || undefined,
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user, getUsersCollectionRef]); // Ajout de getUsersCollectionRef à la dépendance pour useCallback

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error("Erreur lors de la déconnexion:", error);
              Alert.alert("Erreur", "Impossible de se déconnecter.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleChoosePhoto = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Permission de la Galerie Photo',
            message: 'TchopTime a besoin d\'accéder à votre galerie pour votre photo de profil.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission refusée', 'L\'accès à la galerie est nécessaire pour choisir une photo.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) {
        console.log('Sélection de photo annulée');
      } else if (response.errorCode) {
        console.log('Erreur ImagePicker: ', response.errorCode);
        Alert.alert('Erreur de Galerie', 'Impossible de choisir une photo. Code: ' + response.errorCode);
      } else if (response.assets && response.assets.length > 0) {
        const source = response.assets[0].uri;
        setNewAvatarUri(source);
      }
    });
  };

  const handleSaveChanges = async () => {
    if (!user || !userProfile) return;

    if (newUsername.trim().length === 0) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur ne peut pas être vide.');
      return;
    }

    setIsSaving(true);
    try {
      // Appelle la fonction de mise à jour du contexte d'authentification
      await updateUserProfile(newUsername.trim(), newAvatarUri);
      setUserProfile(prev => prev ? { ...prev, username: newUsername.trim(), avatarUrl: newAvatarUri } : null);
      setIsEditing(false); // Quitte le mode édition après sauvegarde réussie
      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du profil:", error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!user || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.noProfileText}>Vous n'êtes pas connecté ou le profil n'est pas disponible.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={isEditing ? handleChoosePhoto : undefined} disabled={!isEditing} style={styles.avatarTouchable}>
            {newAvatarUri ? (
              <Image source={{ uri: newAvatarUri }} style={styles.avatar} />
            ) : (
              <Icon name="account-circle" size={120} color="#CCC" style={styles.defaultAvatar} />
            )}
            {isEditing && (
              <View style={styles.cameraIconOverlay}>
                <Icon name="camera" size={30} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TextInput
              style={styles.usernameInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#999"
            />
          ) : (
            <Text style={styles.username}>{userProfile.username}</Text>
          )}

          <View style={styles.infoRow}>
            <Icon name="email" size={24} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{userProfile.email}</Text>
          </View>

          {user.uid && (
            <View style={styles.infoRow}>
              <Icon name="identifier" size={24} color="#666" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>ID Utilisateur:</Text>
              <Text style={styles.infoValue}>{user.uid}</Text>
            </View>
          )}

          {isEditing ? (
            <TouchableOpacity
              style={styles.saveProfileButton}
              onPress={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="content-save" size={20} color="#FFF" />
                  <Text style={styles.saveProfileButtonText}>Sauvegarder</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setIsEditing(true)}
            >
              <Icon name="account-edit" size={20} color="#FFF" />
              <Text style={styles.editProfileButtonText}>Modifier le profil</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FFF" />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noProfileText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 20,
  },
  avatarTouchable: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6F61',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    resizeMode: 'cover',
  },
  defaultAvatar: {
    // Si l'icône est plus grande, ajustez la taille ici
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 5,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  usernameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 5,
    marginBottom: 10,
    textAlign: 'center',
    width: '80%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 5,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 100,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  editProfileButton: {
    flexDirection: 'row',
    backgroundColor: '#6A5ACD',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  editProfileButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveProfileButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50', // Vert pour sauvegarder
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveProfileButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6F61',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;
