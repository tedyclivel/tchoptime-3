// src/navigation/CustomDrawerContent.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';

// Placeholder pour la photo de profil si l'utilisateur n'en a pas
const defaultAvatar = require('../assets/images/logo_marmiton.png'); // Créez cette image ou utilisez un cercle simple

// Définition des types pour les données de profil Firestore
interface UserProfileData {
  name: string;
  avatarUrl?: string; // Optionnel
}

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [profileName, setProfileName] = useState<string>('Chargement...');
  const [profileAvatar, setProfileAvatar] = useState<any>(defaultAvatar); // Ou string pour URL
  const [isProfileFetching, setIsProfileFetching] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.uid && !authLoading) {
        setIsProfileFetching(true);
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfileData;
            setProfileName(data.name || user.email?.split('@')[0] || 'Utilisateur');
            // Si vous aviez des URLs d'avatar, vous les chargeriez ici
            // if (data.avatarUrl) { setProfileAvatar({ uri: data.avatarUrl }); }
          } else {
            setProfileName(user.email?.split('@')[0] || 'Nouvel Utilisateur');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil Drawer:', error);
          setProfileName(user.email?.split('@')[0] || 'Erreur Profil');
        } finally {
          setIsProfileFetching(false);
        }
      } else if (!user && !authLoading) {
        setProfileName('Non connecté');
        setIsProfileFetching(false);
      }
    };
    fetchUserProfile();
  }, [user, authLoading]);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              Alert.alert('Déconnecté', 'Vous avez été déconnecté avec succès.');
            } catch (error) {
              console.error('Échec de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Image source={profileAvatar} style={styles.avatar} />
          {isProfileFetching ? (
            <ActivityIndicator size="small" color="#FFF" style={styles.profileLoading} />
          ) : (
            <Text style={styles.userName}>{profileName}</Text>
          )}
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Liens de navigation principaux du Drawer */}
        <DrawerItemList {...props} />

        {/* Liens supplémentaires et paramètres */}
        <View style={styles.drawerSection}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('UserProfile')} // Navigue vers l'écran de profil
          >
            <Icon name="account" size={24} color="#333" />
            <Text style={styles.drawerItemText}>Profil utilisateur</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Icon name="account-group" size={24} color="#333" />
            <Text style={styles.drawerItemText}>Gestion de la Famille</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Icon name="warehouse" size={24} color="#333" />
            <Text style={styles.drawerItemText}>Gestion du Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Icon name="bell-ring" size={24} color="#333" />
            <Text style={styles.drawerItemText}>Paramètres de Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drawerSection}>
          <TouchableOpacity style={styles.drawerItem}>
            <Icon name="help-circle" size={24} color="#333" />
            <Text style={styles.drawerItemText}>Aide / FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Icon name="information" size={24} color="#333" />
            <Text style={styles.drawerItemText}>À propos de l'application</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Bouton de déconnexion en bas du tiroir */}
      <View style={styles.bottomDrawerSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="logout" size={24} color="#FFF" style={styles.logoutIcon} />
              <Text style={styles.logoutButtonText}>Se déconnecter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollViewContent: {
    paddingTop: 0, // Pour éviter l'espace en haut
  },
  header: {
    padding: 20,
    backgroundColor: '#FF6F61', // Couleur d'en-tête du tiroir
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 40, // Plus d'espace en haut pour le statut bar
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFF',
  },
  profileLoading: {
    marginTop: 5,
  },
  drawerSection: {
    marginTop: 15,
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  bottomDrawerSection: {
    padding: 20,
    borderTopColor: '#F0F0F0',
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6F61',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;