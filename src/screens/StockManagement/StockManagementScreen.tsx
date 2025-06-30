// src/screens/StockManagement/StockManagementScreen.tsx
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

interface StockItem {
  id: string; // ID Firestore du document
  name: string; // Nom de l'ingrédient
  quantity: number;
  unit: string; // Ex: "kg", "g", "pièce", "litre", "ml"
  expirationDate?: string; // Format YYYY-MM-DD
  userId: string; // L'UID de l'utilisateur propriétaire
  createdAt?: FirebaseFirestoreTypes.FieldValue;
  updatedAt?: FirebaseFirestoreTypes.FieldValue;
}

const StockManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false); // Pour le formulaire d'ajout/édition
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQuantity, setNewItemQuantity] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<string>('');
  const [newItemExpirationDate, setNewItemExpirationDate] = useState<string>(''); // YYYY-MM-DD
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // Pour l'édition
  const [isSaving, setIsSaving] = useState<boolean>(false); // Pour l'état de sauvegarde

  // Référence à la sous-collection userStock de l'utilisateur
  const getUserStockCollectionRef = () => {
    if (!user?.uid) {
      console.error("User not authenticated to access stock collection.");
      return null;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return firestore().collection(`artifacts/${appId}/users/${user.uid}/userStock`);
  };

  // Charger les articles en stock depuis Firestore
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setStockItems([]);
      return;
    }

    const collectionRef = getUserStockCollectionRef();
    if (!collectionRef) return;

    const unsubscribe = collectionRef
      .orderBy('expirationDate', 'asc') // Trie par date de péremption, les plus proches en premier
      .onSnapshot(
        (snapshot) => {
          const items: StockItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Omit<StockItem, 'id'>;
            items.push({
              id: doc.id,
              ...data,
              quantity: Number(data.quantity), // S'assurer que c'est un nombre
            });
          });
          setStockItems(items);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching stock items: ", error);
          setIsLoading(false);
          Alert.alert("Erreur", "Impossible de charger les articles en stock.");
        }
      );

    return () => unsubscribe();
  }, [user]);

  const handleAddOrUpdateItem = async () => {
    if (!user?.uid) {
      Alert.alert('Erreur', 'Vous devez être connecté pour gérer le stock.');
      return;
    }
    if (newItemName.trim().length === 0 || !newItemQuantity || isNaN(Number(newItemQuantity)) || newItemUnit.trim().length === 0) {
      Alert.alert('Erreur', 'Veuillez saisir un nom, une quantité et une unité valides.');
      return;
    }
    if (newItemExpirationDate.trim().length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(newItemExpirationDate)) {
      Alert.alert('Erreur', 'Le format de la date de péremption doit être YYYY-MM-DD.');
      return;
    }

    setIsSaving(true);
    try {
      const collectionRef = getUserStockCollectionRef();
      if (!collectionRef) return;

      const itemData = {
        name: newItemName.trim(),
        quantity: parseFloat(newItemQuantity),
        unit: newItemUnit.trim(),
        expirationDate: newItemExpirationDate.trim() || undefined, // Peut être null si non renseigné
        userId: user.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (editingItemId) {
        // Mode édition
        await collectionRef.doc(editingItemId).update(itemData);
        Alert.alert('Succès', 'Article en stock mis à jour !');
      } else {
        // Mode ajout
        await collectionRef.add({
          ...itemData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert('Succès', 'Nouvel article ajouté au stock !');
      }

      // Réinitialiser le formulaire
      resetForm();
    } catch (error) {
      console.error('Erreur lors de l\'ajout/mise à jour de l\'article:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'article.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItem = (item: StockItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemQuantity(String(item.quantity));
    setNewItemUnit(item.unit);
    setNewItemExpirationDate(item.expirationDate || '');
    setIsAdding(true); // Ouvre le formulaire en mode édition
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Supprimer l\'article',
      'Voulez-vous vraiment supprimer cet article du stock ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            if (!user?.uid) return;
            setIsLoading(true); // Active le chargement global pour la suppression
            try {
              const collectionRef = getUserStockCollectionRef();
              if (!collectionRef) return;
              await collectionRef.doc(itemId).delete();
              Alert.alert('Succès', 'Article supprimé du stock !');
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

  const resetForm = () => {
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('');
    setNewItemExpirationDate('');
    setIsAdding(false);
    setEditingItemId(null);
  };

  const getExpirationStatus = (expirationDateStr?: string) => {
    if (!expirationDateStr) return { text: 'Date inconnue', color: '#888' };
    const today = new Date();
    const expirationDate = new Date(expirationDateStr);
    expirationDate.setHours(0, 0, 0, 0); // Comparaison à la journée
    today.setHours(0, 0, 0, 0);

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Périmé', color: '#D32F2F' }; // Rouge foncé
    } else if (diffDays <= 7) {
      return { text: `Expire dans ${diffDays} j`, color: '#FF9800' }; // Orange
    } else if (diffDays <= 30) {
      return { text: `Expire dans ${diffDays} j`, color: '#FFC107' }; // Jaune
    }
    return { text: 'Valide', color: '#4CAF50' }; // Vert
  };

  const renderStockItem = ({ item }: { item: StockItem }) => {
    const status = getExpirationStatus(item.expirationDate);
    return (
      <View style={styles.stockItem}>
        <Icon name="food-apple-outline" size={30} color="#6A5ACD" style={styles.itemIcon} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQuantity}>{item.quantity} {item.unit}</Text>
          <Text style={[styles.itemExpiration, { color: status.color }]}>
            {item.expirationDate ? `Exp: ${item.expirationDate} (${status.text})` : 'Pas de date d\'expiration'}
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
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Chargement du stock...</Text>
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
          <Text style={styles.headerTitle}>Mon Stock</Text>
        </View>

        {isAdding || stockItems.length === 0 ? ( // Affiche le formulaire si ajout ou si pas d'articles
          <ScrollView contentContainerStyle={styles.formScrollView}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingItemId ? 'Modifier un article' : 'Ajouter au Stock'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom de l'ingrédient (ex: Riz, Tomates)"
                placeholderTextColor="#999"
                value={newItemName}
                onChangeText={setNewItemName}
                autoCapitalize="sentences"
              />
              <TextInput
                style={styles.input}
                placeholder="Quantité (ex: 2.5, 6)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
              />
              <TextInput
                style={styles.input}
                placeholder="Unité (ex: kg, pièces, litres)"
                placeholderTextColor="#999"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Date de péremption (AAAA-MM-JJ, ex: 2025-12-31)"
                placeholderTextColor="#999"
                value={newItemExpirationDate}
                onChangeText={setNewItemExpirationDate}
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddOrUpdateItem}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{editingItemId ? 'Sauvegarder les modifications' : 'Ajouter l\'article'}</Text>
                )}
              </TouchableOpacity>
              {(isAdding || editingItemId) && (
                <TouchableOpacity
                  style={[styles.saveButton, {backgroundColor: '#FF6F61', marginTop: 10}]}
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
              data={stockItems}
              renderItem={renderStockItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>Votre stock est vide.</Text>
                  <Text style={styles.emptyListHint}>Appuyez sur le bouton '+' pour ajouter des articles.</Text>
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
  stockItem: {
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
  itemIcon: {
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
  itemExpiration: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: 'bold',
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

export default StockManagementScreen;
