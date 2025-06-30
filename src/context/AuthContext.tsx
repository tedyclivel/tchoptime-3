// src/context/AuthContext.tsx (MIS À JOUR - authInitialized ajouté au type)
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { ActivityIndicator, View, Text, StyleSheet, Alert } from 'react-native';
import { Platform } from 'react-native';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isProfileSetup: boolean;
  authInitialized: boolean; // ⭐ AJOUTÉ ICI : Déclare la propriété 'authInitialized' ⭐
  signInAnonymously: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (username: string, avatarUri?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileSetup, setIsProfileSetup] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false); // État interne du fournisseur

  const getUsersCollectionRef = () => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return firestore().collection(`artifacts/${appId}/users`);
  };

  const getAvatarStorageRef = (userId: string, fileName: string) => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return storage().ref(`artifacts/${appId}/users/${userId}/avatars/${fileName}`);
  };

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
      setAuthInitialized(true); // Est défini à 'true' une fois l'état d'authentification initial vérifié

      if (firebaseUser) {
        try {
          const userDocRef = getUsersCollectionRef().doc(firebaseUser.uid);
          const docSnap = await userDocRef.get();
          setIsProfileSetup(docSnap.exists() && !!docSnap.data()?.username);
        } catch (error) {
          console.error("Erreur lors de la vérification du profil:", error);
          setIsProfileSetup(false);
        }
      } else {
        setIsProfileSetup(false);
      }
    });
    return subscriber;
  }, []);

  const signInAnonymously = async () => {
    setIsLoading(true);
    try {
      await auth().signInAnonymously();
    } catch (error: any) {
      console.error("Erreur de connexion anonyme:", error);
      Alert.alert('Erreur de Connexion', error.message || 'Échec de la connexion anonyme.');
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      Alert.alert('Erreur d\'Inscription', error.message || 'Échec de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      Alert.alert('Erreur de Connexion', error.message || 'Échec de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await auth().signOut();
    } catch (error: any) {
      console.error("Erreur de déconnexion:", error);
      Alert.alert('Erreur de Déconnexion', error.message || 'Échec de la déconnexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (username: string, avatarUri?: string) => {
    if (!user) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté pour mettre à jour le profil.');
      return;
    }
    setIsLoading(true);
    let finalAvatarUrl: string | null = null;

    try {
      if (avatarUri) {
        if (avatarUri.startsWith('file://') || (Platform.OS === 'android' && !avatarUri.startsWith('http'))) {
          const fileName = `avatar_${user.uid}_${Date.now()}.jpg`;
          const storageRef = getAvatarStorageRef(user.uid, fileName);
          const task = storageRef.putFile(avatarUri);
          task.on('state_changed', snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload est à ${progress}%`);
          });
          await task;
          finalAvatarUrl = await storageRef.getDownloadURL();
          console.log("Image téléchargée, URL:", finalAvatarUrl);
        } else {
          finalAvatarUrl = avatarUri;
        }
      }

      const userDocRef = getUsersCollectionRef().doc(user.uid);
      await userDocRef.set({
        username: username,
        email: user.email || null,
        avatarUrl: finalAvatarUrl,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      setIsProfileSetup(true);
    } catch (error: any) {
      console.error("Erreur de mise à jour du profil:", error);
      Alert.alert('Erreur de Profil', error.message || 'Échec de la mise à jour du profil.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Important : La logique de chargement initial de l'application est dans App.tsx (RootNavigator)
  // Le authInitialized ici est pour le contexte, non le splash screen initial.
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isProfileSetup,
    authInitialized, // ⭐ FOURNI ICI : La valeur de 'authInitialized' ⭐
    signInAnonymously,
    signUpWithEmail,
    signInWithEmail,
    login: signInWithEmail,
    signOut,
    logout: signOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
