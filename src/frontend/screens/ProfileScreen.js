import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Card,
  Button,
  useTheme,
  Avatar,
  List,
  Portal,
  Modal,
  Paragraph,
} from 'react-native-paper';
import { getUserProfile, updateProfile } from '../services/profileService';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../backend/firebase';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const [profile, setProfile] = useState({
    displayName: '',
    photoURL: '',
    familyMembers: [],
  });
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    alias: '',
    universe: '',
    age: '',
    gender: '',
    consumptionFactor: '',
  });
  const theme = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile || {});
    } catch (error) {
      console.error('❌ Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        displayName: profile.displayName,
        photoURL: profile.photoURL,
      });
      await auth.currentUser?.updateProfile({
        displayName: profile.displayName,
      });
      console.log('✅ Profil mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Désolé, nous avons besoin de permissions pour accéder à votre galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfile({
        ...profile,
        photoURL: result.assets[0].uri,
      });
    }
  };

  const handleAddMember = async () => {
    try {
      await updateProfile({
        familyMembers: [...profile.familyMembers, newMember],
      });
      setNewMember({
        name: '',
        alias: '',
        universe: '',
        age: '',
        gender: '',
        consumptionFactor: '',
      });
      setShowMemberModal(false);
      console.log('✅ Membre ajouté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du membre:', error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await updateProfile({
        familyMembers: profile.familyMembers.filter(m => m.id !== memberId),
      });
      console.log('✅ Membre supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du membre:', error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickImage}>
              <Avatar.Image
                source={{ uri: profile.photoURL }}
                size={100}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <TextInput
              label="Nom d'affichage"
              value={profile.displayName}
              onChangeText={(text) => setProfile({ ...profile, displayName: text })}
              style={styles.input}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              style={styles.updateButton}
            >
              Mettre à jour
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.familyCard}>
        <Card.Title title="Membres de la Famille" />
        <Card.Content>
          {profile.familyMembers.map((member) => (
            <List.Item
              key={member.id}
              title={member.name}
              description={`${member.age} ans - ${member.universe}`}
              right={(props) => (
                <List.Icon
                  {...props}
                  icon="delete"
                  color={theme.colors.error}
                  onPress={() => handleDeleteMember(member.id)}
                />
              )}
            />
          ))}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="text"
            onPress={() => setShowMemberModal(true)}
            style={styles.addButton}
          >
            Ajouter un membre
          </Button>
        </Card.Actions>
      </Card>

      <Portal>
        <Modal
          visible={showMemberModal}
          onDismiss={() => setShowMemberModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <TextInput
                label="Nom"
                value={newMember.name}
                onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Surnom"
                value={newMember.alias}
                onChangeText={(text) => setNewMember({ ...newMember, alias: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Préférences alimentaires"
                value={newMember.universe}
                onChangeText={(text) => setNewMember({ ...newMember, universe: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Âge"
                value={newMember.age}
                onChangeText={(text) => setNewMember({ ...newMember, age: text })}
                keyboardType="numeric"
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Sexe"
                value={newMember.gender}
                onChangeText={(text) => setNewMember({ ...newMember, gender: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Facteur de consommation"
                value={newMember.consumptionFactor}
                onChangeText={(text) => setNewMember({ ...newMember, consumptionFactor: text })}
                keyboardType="numeric"
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowMemberModal(false)}>Annuler</Button>
              <Button onPress={handleAddMember}>Ajouter</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#2D2C3E',
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    width: width - 64,
  },
  updateButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
  },
  familyCard: {
    backgroundColor: '#2D2C3E',
  },
  addButton: {
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: '#2D2C3E',
    padding: 16,
  },
  modalInput: {
    marginBottom: 16,
    width: width - 64,
  },
});

export default ProfileScreen;
