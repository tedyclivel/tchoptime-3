// src/navigation/RootDrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, Linking, Platform, StatusBar, Alert } from 'react-native'; // Import Alert et StatusBar
import MainTabNavigator from './MainTabNavigator'; // Votre navigateur d'onglets principal
import ProfileScreen from '../screens/Profile/ProfileScreen'; // Écran de Profil
import FamilyManagementScreen from '../screens/FamilyManagement/FamilyManagementScreen'; // Écran de Gestion de la Famille
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext'; // Pour la déconnexion et les infos utilisateur

// Définition des types pour les routes du Drawer
export type RootDrawerParamList = {
  HomeDrawer: undefined; // Le MainTabNavigator sera ici
  Profile: undefined;
  FamilyManagement: undefined;
  // Ajoutez d'autres écrans ou liens du Drawer ici selon le cahier des charges
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

// Composant personnalisé pour le contenu du Drawer
const CustomDrawerContent: React.FC<any> = (props) => {
  const { user, logout } = useAuth(); // Récupère l'utilisateur et la fonction de déconnexion

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
              await logout(); // Appelle la fonction de déconnexion du contexte
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

  // Calcule la hauteur du padding supérieur pour l'en-tête du tiroir
  // Prend en compte StatusBar.currentHeight pour Android, sinon une valeur fixe pour iOS/autres
  const paddingTopForHeader = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0) + 20
    : 40;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={[styles.drawerHeader, { paddingTop: paddingTopForHeader }]}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.drawerAvatar} />
        ) : (
          <Icon name="account-circle" size={80} color="#FFF" style={styles.drawerDefaultAvatar} />
        )}
        <Text style={styles.drawerUsername}>
          {user?.displayName || user?.email || 'Invité'}
        </Text>
        <Text style={styles.drawerEmail}>{user?.email || ''}</Text>
      </View>
      <DrawerItemList {...props} />
      {/* Ajout des liens spécifiques du cahier des charges */}
      <DrawerItem
        label="Gestion de la Famille"
        icon={({ color, size }) => <Icon name="account-group" size={size} color={color} />}
        onPress={() => props.navigation.navigate('FamilyManagement')}
        labelStyle={styles.drawerItemLabel}
      />
      <DrawerItem
        label="Gestion du Stock"
        icon={({ color, size }) => <Icon name="archive-outline" size={size} color={color} />}
        onPress={() => Alert.alert("Fonctionnalité future", "Gestion du Stock à venir.")}
        labelStyle={styles.drawerItemLabel}
      />
      <DrawerItem
        label="Paramètres de Notifications"
        icon={({ color, size }) => <Icon name="bell-cog-outline" size={size} color={color} />}
        onPress={() => Alert.alert("Fonctionnalité future", "Paramètres de Notifications à venir.")}
        labelStyle={styles.drawerItemLabel}
      />
      <DrawerItem
        label="Aide / FAQ"
        icon={({ color, size }) => <Icon name="help-circle-outline" size={size} color={color} />}
        onPress={() => Alert.alert("Fonctionnalité future", "Aide / FAQ à venir.")}
        labelStyle={styles.drawerItemLabel}
      />
      <DrawerItem
        label="À propos de l'application"
        icon={({ color, size }) => <Icon name="information-outline" size={size} color={color} />}
        onPress={() => Alert.alert("Fonctionnalité future", "Informations sur l'application à venir.")}
        labelStyle={styles.drawerItemLabel}
      />
       {/* Bouton de déconnexion dans le Drawer */}
      <DrawerItem
        label="Se déconnecter"
        icon={({ color, size }) => <Icon name="logout" size={size} color={color} />}
        onPress={handleLogout}
        labelStyle={styles.drawerItemLabel}
        style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#EEE' }}
      />
    </DrawerContentScrollView>
  );
};

const RootDrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false, // Cache le header par défaut
        drawerActiveTintColor: '#FF6F61',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: styles.drawerItemLabel,
      }}
    >
      {/* Écran principal (le MainTabNavigator) */}
      <Drawer.Screen
        name="HomeDrawer"
        component={MainTabNavigator}
        options={{
          title: 'Accueil', // Titre affiché dans le Drawer pour le MainTabNavigator
          drawerIcon: ({ color, size }) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
        }}
      />
      {/* L'écran de Profil peut être aussi ici ou juste dans le Tab Navigator */}
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mon Profil',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Le nouvel écran de Gestion de la Famille */}
      <Drawer.Screen
        name="FamilyManagement"
        component={FamilyManagementScreen}
        options={{
          title: 'Gestion de la Famille',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    backgroundColor: '#6A5ACD', // Couleur de l'en-tête du Drawer
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
    // Le paddingTop est maintenant calculé dynamiquement dans le composant CustomDrawerContent
  },
  drawerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 10,
  },
  drawerDefaultAvatar: {
    marginBottom: 10,
  },
  drawerUsername: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  drawerEmail: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  drawerItemLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RootDrawerNavigator;
