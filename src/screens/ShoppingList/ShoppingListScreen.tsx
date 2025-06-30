// src/screens/ShoppingList/ShoppingListScreen.tsx (MIS À JOUR - Avec Envoi d'Email)
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
  Modal, // Import Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface ShoppingListItem {
  id: string; // Firestore document ID
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  userId: string;
  createdAt?: FirebaseFirestoreTypes.FieldValue;
  updatedAt?: FirebaseFirestoreTypes.FieldValue;
}

const ShoppingListScreen: React.FC = () => {
  const { user } = useAuth();
  const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQuantity, setNewItemQuantity] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ⭐ États pour l'envoi d'email ⭐
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  // Remplacez cette URL par l'URL de votre Cloud Function après déploiement
  // Exemple: https://REGION-YOUR_PROJECT_ID.cloudfunctions.net/sendShoppingListEmail
  const CLOUD_FUNCTION_SEND_EMAIL_URL = 'https://YOUR_CLOUD_FUNCTION_REGION-YOUR_PROJECT_ID.cloudfunctions.net/sendShoppingListEmail'; // ⭐ À REMPLACER ⭐

  const getShoppingListCollectionRef = () => {
    if (!user?.uid) {
      console.error("User not authenticated to access shopping list collection.");
      return null;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return firestore().collection(`artifacts/${appId}/users/${user.uid}/shoppingList`);
  };

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setShoppingListItems([]);
      return;
    }

    const collectionRef = getShoppingListCollectionRef();
    if (!collectionRef) return;

    const unsubscribe = collectionRef
      .orderBy('createdAt', 'asc')
      .onSnapshot(
        (snapshot) => {
          const items: ShoppingListItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Omit<ShoppingListItem, 'id'>;
            items.push({
              id: doc.id,
              ...data,
              quantity: Number(data.quantity),
              isPurchased: data.isPurchased || false,
            });
          });
          setShoppingListItems(items);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching shopping list items: ", error);
          setIsLoading(false);
          Alert.alert("Erreur", "Impossible de charger la liste de courses.");
        }
      );

    return () => unsubscribe();
  }, [user]);

  const handleAddOrUpdateItem = async () => {
    if (!user?.uid) {
      Alert.alert('Erreur', 'Vous devez être connecté pour gérer la liste de courses.');
      return;
    }
    if (newItemName.trim().length === 0 || !newItemQuantity || isNaN(Number(newItemQuantity)) || newItemUnit.trim().length === 0) {
      Alert.alert('Erreur', 'Veuillez saisir un nom, une quantité et une unité valides.');
      return;
    }

    setIsSaving(true);
    try {
      const collectionRef = getShoppingListCollectionRef();
      if (!collectionRef) return;

      const itemData = {
        name: newItemName.trim(),
        quantity: parseFloat(newItemQuantity),
        unit: newItemUnit.trim(),
        isPurchased: false, // Nouvel article n'est pas encore acheté
        userId: user.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (editingItemId) {
        await collectionRef.doc(editingItemId).update(itemData);
        Alert.alert('Succès', 'Article mis à jour !');
      } else {
        await collectionRef.add({
          ...itemData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert('Succès', 'Nouvel article ajouté à la liste !');
      }

      resetForm();
    } catch (error) {
      console.error('Erreur lors de l\'ajout/mise à jour de l\'article:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'article.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePurchased = async (item: ShoppingListItem) => {
    if (!user?.uid) return;
    try {
      const collectionRef = getShoppingListCollectionRef();
      if (!collectionRef) return;
      await collectionRef.doc(item.id).update({
        isPurchased: !item.isPurchased,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'état d\'achat:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'article.');
    }
  };

  const handleEditItem = (item: ShoppingListItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemQuantity(String(item.quantity));
    setNewItemUnit(item.unit);
    setIsAdding(true);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Supprimer l\'article',
      'Voulez-vous vraiment supprimer cet article de la liste ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            if (!user?.uid) return;
            setIsLoading(true);
            try {
              const collectionRef = getShoppingListCollectionRef();
              if (!collectionRef) return;
              await collectionRef.doc(itemId).delete();
              Alert.alert('Succès', 'Article supprimé !');
            } catch (error) {
              console.error('Erreur lors de la suppression de l\'article:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'article.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // ⭐ Fonction d'envoi d'email ⭐
  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email valide.');
      return;
    }
    if (!user?.email) {
      Alert.alert('Erreur', 'Votre adresse email n\'est pas disponible pour l\'expéditeur. Assurez-vous d\'être connecté avec un email.');
      return;
    }
    if (shoppingListItems.length === 0) {
      Alert.alert('Info', 'Votre liste de courses est vide. Ajoutez des articles avant d\'envoyer.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const emailContent = {
        to: recipientEmail.trim(),
        from: user.email, // L'expéditeur sera l'email de l'utilisateur connecté
        subject: 'Votre liste de courses TchopTime',
        html: `
          <h1>Liste de courses pour vous !</h1>
          <p>Voici votre liste de courses envoyée par ${user.displayName || user.email} depuis TchopTime :</p>
          <ul>
            ${shoppingListItems.map(item => `<li>${item.name} (${item.quantity} ${item.unit}) ${item.isPurchased ? ' - ACHETÉ' : ''}</li>`).join('')}
          </ul>
          <p>Bonnes courses avec TchopTime !</p>
        `,
        // Pourrait aussi inclure une version texte brut
        text: `Voici votre liste de courses envoyée par ${user.displayName || user.email} depuis TchopTime:\n\n` +
              shoppingListItems.map(item => `- ${item.name} (${item.quantity} ${item.unit}) ${item.isPurchased ? ' - ACHETÉ' : ''}`).join('\n') +
              `\n\nBonnes courses avec TchopTime !`,
      };

      // ⭐ Appel de la Cloud Function ⭐
      const response = await fetch(CLOUD_FUNCTION_SEND_EMAIL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Vous pouvez ajouter un token d'authentification Firebase ici si votre CF le sécurise
          // 'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(emailContent),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Liste de courses envoyée par email !');
        setShowEmailModal(false);
        setRecipientEmail('');
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', `Échec de l'envoi: ${errorData.message || response.statusText}`);
        console.error('Erreur réponse Cloud Function:', errorData);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email. Vérifiez votre connexion.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('');
    setIsAdding(false);
    setEditingItemId(null);
  };

  const renderShoppingListItem = ({ item }: { item: ShoppingListItem }) => (
    <View style={styles.shoppingItem}>
      <TouchableOpacity onPress={() => handleTogglePurchased(item)} style={styles.checkbox}>
        <Icon
          name={item.isPurchased ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={24}
          color={item.isPurchased ? '#4CAF50' : '#FF6F61'}
        />
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.isPurchased && styles.purchasedText]}>
          {item.name}
        </Text>
        <Text style={[styles.itemQuantity, item.isPurchased && styles.purchasedText]}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleEditItem(item)} style={styles.editButton}>
        <Icon name="pencil" size={22} color="#6A5ACD" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.deleteButton}>
        <Icon name="delete" size={22} color="#FF6F61" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Chargement de la liste de courses...</Text>
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
          <Text style={styles.headerTitle}>Ma Liste de Courses</Text>
        </View>

        {isAdding || shoppingListItems.length === 0 ? (
          <ScrollView contentContainerStyle={styles.formScrollView}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingItemId ? 'Modifier un article' : 'Ajouter un article'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom de l'article (ex: Lait, Œufs)"
                placeholderTextColor="#999"
                value={newItemName}
                onChangeText={setNewItemName}
                autoCapitalize="sentences"
              />
              <TextInput
                style={styles.input}
                placeholder="Quantité (ex: 2, 500)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
              />
              <TextInput
                style={styles.input}
                placeholder="Unité (ex: litres, g, pièces)"
                placeholderTextColor="#999"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddOrUpdateItem}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{editingItemId ? 'Sauvegarder' : 'Ajouter à la liste'}</Text>
                )}
              </TouchableOpacity>
              {(isAdding || editingItemId) && (
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: '#FF6F61', marginTop: 10 }]}
                  onPress={resetForm}
                  disabled={isSaving}
                >
                  <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : (
          <>
            <FlatList
              data={shoppingListItems}
              renderItem={renderShoppingListItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>Votre liste de courses est vide.</Text>
                  <Text style={styles.emptyListHint}>Appuyez sur le bouton '+' pour ajouter des articles.</Text>
                </View>
              )}
            />
            <TouchableOpacity style={styles.fab} onPress={() => setIsAdding(true)}>
              <Icon name="plus" size={30} color="#FFF" />
            </TouchableOpacity>

            {/* ⭐ Bouton d'envoi d'email ⭐ */}
            <TouchableOpacity
              style={styles.sendEmailButton}
              onPress={() => setShowEmailModal(true)}
            >
              <Icon name="email-send-outline" size={24} color="#FFF" />
              <Text style={styles.sendEmailButtonText}>Envoyer par Email</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>

      {/* ⭐ Modal d'envoi d'email ⭐ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEmailModal}
        onRequestClose={() => setShowEmailModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.emailModalContainer}>
            <Text style={styles.emailModalTitle}>Envoyer la Liste de Courses</Text>
            <Text style={styles.inputLabel}>Email du destinataire:</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@domaine.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEmailModal(false)}
                disabled={isSendingEmail}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: '#4CAF50', // Vert pour sauvegarder
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
  shoppingItem: {
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
  checkbox: {
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  purchasedText: {
    textDecorationLine: 'line-through',
    color: '#999',
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
  // ⭐ Styles pour l'envoi d'email ⭐
  sendEmailButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#6A5ACD', // Une couleur différente pour ce bouton
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sendEmailButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emailModalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  emailModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
});

export default ShoppingListScreen;
