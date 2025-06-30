// src/screens/FamilyManagement/FamilyManagementScreen.tsx (CORRIGÉ - isSaving)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface FamilyMember {
  id: string; // Firestore document ID
  name: string;
  alias?: string; // Nickname or role
  universe?: string; // General food preferences (e.g., "Omnivore", "Vegetarian")
  age: number;
  gender?: 'Homme' | 'Femme' | 'Autre';
  consumptionFactor: number; // Factor to adjust quantities (e.g., 1.0 for adult, 0.5 for child)
  userId: string; // The UID of the owning user
  createdAt?: FirebaseFirestoreTypes.FieldValue;
  updatedAt?: FirebaseFirestoreTypes.FieldValue;
}

const FamilyManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state for initial fetch
  const [isAdding, setIsAdding] = useState<boolean>(false); // State to toggle add/edit form visibility
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberAge, setNewMemberAge] = useState<string>('');
  const [newMemberGender, setNewMemberGender] = useState<string>('');
  const [newMemberAlias, setNewMemberAlias] = useState<string>('');
  const [newMemberUniverse, setNewMemberUniverse] = useState<string>('');
  const [newMemberConsumptionFactor, setNewMemberConsumptionFactor] = useState<string>('1.0');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null); // To identify which member is being edited
  const [isSaving, setIsSaving] = useState<boolean>(false); // ⭐ isSaving state declared here ⭐

  // Firestore collection reference for user's family members
  const getFamilyMembersCollectionRef = () => {
    if (!user?.uid) {
      console.error("User not authenticated to access family members collection.");
      return null;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return firestore().collection(`artifacts/${appId}/users/${user.uid}/familyMembers`);
  };

  // Load family members from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setFamilyMembers([]);
      return;
    }

    const collectionRef = getFamilyMembersCollectionRef();
    if (!collectionRef) return;

    // Use onSnapshot listener for real-time updates
    const unsubscribe = collectionRef
      .orderBy('createdAt', 'asc') // Sort by creation date, oldest first
      .onSnapshot(
        (snapshot) => {
          const members: FamilyMember[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Omit<FamilyMember, 'id'>;
            members.push({ id: doc.id, ...data, age: Number(data.age), consumptionFactor: Number(data.consumptionFactor) });
          });
          setFamilyMembers(members);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching family members: ", error);
          setIsLoading(false);
          Alert.alert("Erreur", "Impossible de charger les membres de la famille.");
        }
      );

    return () => unsubscribe();
  }, [user]);

  // Function to handle adding or updating a family member
  const handleAddOrUpdateMember = async () => {
    if (!user?.uid) {
      Alert.alert('Erreur', 'Vous devez être connecté pour gérer la famille.');
      return;
    }
    if (newMemberName.trim().length === 0 || !newMemberAge || isNaN(Number(newMemberAge))) {
      Alert.alert('Erreur', 'Veuillez saisir un nom et un âge valide.');
      return;
    }

    setIsSaving(true); // Activate saving indicator
    try {
      const collectionRef = getFamilyMembersCollectionRef();
      if (!collectionRef) return;

      const memberData = {
        name: newMemberName.trim(),
        age: parseInt(newMemberAge, 10),
        gender: newMemberGender || undefined,
        alias: newMemberAlias.trim() || undefined,
        universe: newMemberUniverse.trim() || undefined,
        consumptionFactor: parseFloat(newMemberConsumptionFactor) || 1.0,
        userId: user.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (editingMemberId) {
        // Edit mode
        await collectionRef.doc(editingMemberId).update(memberData);
        Alert.alert('Succès', 'Membre de la famille mis à jour !');
      } else {
        // Add mode
        await collectionRef.add({
          ...memberData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert('Succès', 'Nouveau membre de la famille ajouté !');
      }

      // Reset form and UI state
      setNewMemberName('');
      setNewMemberAge('');
      setNewMemberGender('');
      setNewMemberAlias('');
      setNewMemberUniverse('');
      setNewMemberConsumptionFactor('1.0');
      setIsAdding(false);
      setEditingMemberId(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout/mise à jour du membre:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le membre.');
    } finally {
      setIsSaving(false); // Deactivate saving indicator
    }
  };

  // Function to set up the form for editing an existing member
  const handleEditMember = (member: FamilyMember) => {
    setEditingMemberId(member.id);
    setNewMemberName(member.name);
    setNewMemberAge(String(member.age));
    setNewMemberGender(member.gender || '');
    setNewMemberAlias(member.alias || '');
    setNewMemberUniverse(member.universe || '');
    setNewMemberConsumptionFactor(String(member.consumptionFactor));
    setIsAdding(true); // Open the form in edit mode
  };

  // Function to handle deleting a family member
  const handleDeleteMember = (memberId: string) => {
    Alert.alert(
      'Supprimer le membre',
      'Voulez-vous vraiment supprimer ce membre de la famille ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            if (!user?.uid) return;
            setIsLoading(true); // Activate global loading for deletion
            try {
              const collectionRef = getFamilyMembersCollectionRef();
              if (!collectionRef) return;
              await collectionRef.doc(memberId).delete();
              Alert.alert('Succès', 'Membre supprimé !');
            } catch (error) {
              console.error('Erreur lors de la suppression du membre:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le membre.');
            } finally {
              setIsLoading(false); // Deactivate global loading
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Render function for each family member item in the FlatList
  const renderMemberItem = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberItem}>
      <Icon name="account" size={30} color="#6A5ACD" style={styles.memberIcon} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name} {item.alias ? `(${item.alias})` : ''}</Text>
        <Text style={styles.memberDetails}>
          {item.age} ans {item.gender ? `• ${item.gender}` : ''}
          {item.universe ? ` • ${item.universe}` : ''}
        </Text>
        <Text style={styles.memberDetails}>Facteur de consommation: {item.consumptionFactor}</Text>
      </View>
      <TouchableOpacity onPress={() => handleEditMember(item)} style={styles.editButton}>
        <Icon name="pencil" size={22} color="#6A5ACD" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteMember(item.id)} style={styles.deleteButton}>
        <Icon name="delete" size={22} color="#FF6F61" />
      </TouchableOpacity>
    </View>
  );

  // Display a loading spinner if data is being fetched initially
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Chargement des membres de la famille...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestion de la Famille</Text>
        </View>

        {isAdding || familyMembers.length === 0 ? ( // Display form if adding or no members exist
          <ScrollView contentContainerStyle={styles.formScrollView}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingMemberId ? 'Modifier un membre' : 'Ajouter un membre'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom (ex: Papa, Maman, Jean)"
                placeholderTextColor="#999"
                value={newMemberName}
                onChangeText={setNewMemberName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Âge (ex: 35)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newMemberAge}
                onChangeText={setNewMemberAge}
              />
              <TextInput
                style={styles.input}
                placeholder="Sexe (ex: Homme, Femme)"
                placeholderTextColor="#999"
                value={newMemberGender}
                onChangeText={setNewMemberGender}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Surnom/Rôle (ex: Maître du barbecue)"
                placeholderTextColor="#999"
                value={newMemberAlias}
                onChangeText={setNewMemberAlias}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Univers (ex: Végétarien, Sans Gluten)"
                placeholderTextColor="#999"
                value={newMemberUniverse}
                onChangeText={setNewMemberUniverse}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Facteur de consommation (ex: 1.0, 0.75)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newMemberConsumptionFactor}
                onChangeText={setNewMemberConsumptionFactor}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddOrUpdateMember}
                disabled={isSaving} // Disable button while saving
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{editingMemberId ? 'Sauvegarder les modifications' : 'Ajouter le membre'}</Text>
                )}
              </TouchableOpacity>
              {(isAdding || editingMemberId) && ( // Show cancel button only if in add/edit mode
                <TouchableOpacity
                  style={[styles.saveButton, {backgroundColor: '#FF6F61', marginTop: 10}]}
                  onPress={() => {
                    setIsAdding(false);
                    setEditingMemberId(null);
                    setNewMemberName('');
                    setNewMemberAge('');
                    setNewMemberGender('');
                    setNewMemberAlias('');
                    setNewMemberUniverse('');
                    setNewMemberConsumptionFactor('1.0');
                  }}
                  disabled={isSaving}
                >
                  <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : (
          // Display the list of family members
          <>
            <FlatList
              data={familyMembers}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>Aucun membre de la famille ajouté.</Text>
                  <Text style={styles.emptyListHint}>Appuyez sur le bouton '+' pour en ajouter un.</Text>
                </View>
              )}
            />
            <TouchableOpacity style={styles.fab} onPress={() => setIsAdding(true)}>
              <Icon name="plus" size={30} color="#FFF" />
            </TouchableOpacity>
          </>
        )}
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
  formScrollView: {
    flexGrow: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  saveButton: {
    backgroundColor: '#4CAF50', // Green for save
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  memberIcon: {
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  memberDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 5,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  emptyListHint: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6F61',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default FamilyManagementScreen;
