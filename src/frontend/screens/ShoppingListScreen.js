import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  FAB,
  Portal,
  Modal,
  TextInput,
  List,
  Checkbox,
  Avatar,
  Paragraph,
} from 'react-native-paper';
import { getUserProfile, updateProfile } from '../services/profileService';
import { auth } from '../backend/firebase';

const { width } = Dimensions.get('window');

const ShoppingListScreen = () => {
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: '',
    checked: false,
  });
  const theme = useTheme();

  useEffect(() => {
    loadShoppingList();
  }, []);

  const loadShoppingList = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const profile = await getUserProfile();
      setShoppingList(profile?.shoppingList || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la liste de courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const newItemId = Date.now().toString();
      const updatedList = [...shoppingList, {
        ...newItem,
        id: newItemId,
      }];

      await updateProfile({
        shoppingList: updatedList,
      });

      setShoppingList(updatedList);
      setNewItem({
        name: '',
        quantity: '',
        unit: '',
        category: '',
        checked: false,
      });
      setShowAddItemModal(false);

      console.log('✅ Article ajouté à la liste');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'article:', error);
    }
  };

  const toggleItem = async (itemId, checked) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const updatedList = shoppingList.map(item =>
        item.id === itemId ? { ...item, checked } : item
      );

      await updateProfile({
        shoppingList: updatedList,
      });

      setShoppingList(updatedList);
      console.log('✅ État de l\'article mis à jour');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'article:', error);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const updatedList = shoppingList.filter(item => item.id !== itemId);
      await updateProfile({
        shoppingList: updatedList,
      });

      setShoppingList(updatedList);
      console.log('✅ Article supprimé de la liste');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'article:', error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  // Catégories de produits
  const categories = [
    'Fruits et légumes',
    'Viandes et poissons',
    'Produits laitiers',
    'Boissons',
    'Epicerie',
    'Féculents',
    'Produits surgelés',
    'Autres',
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Ma Liste de Courses</Text>
          <Text style={styles.listStats}>
            {shoppingList.filter(item => !item.checked).length} articles à acheter
          </Text>
        </View>

        {categories.map((category) => {
          const items = shoppingList.filter(item => item.category === category);
          if (items.length === 0) return null;

          return (
            <Card key={category} style={styles.categoryCard}>
              <Card.Title title={category} />
              <Card.Content>
                {items.map((item) => (
                  <List.Item
                    key={item.id}
                    title={`${item.name} - ${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}
                    left={(props) => (
                      <Checkbox
                        {...props}
                        status={item.checked ? 'checked' : 'unchecked'}
                        onPress={() => toggleItem(item.id, !item.checked)}
                      />
                    )}
                    right={(props) => (
                      <List.Icon
                        {...props}
                        icon="delete"
                        color={theme.colors.error}
                        onPress={() => deleteItem(item.id)}
                      />
                    )}
                  />
                ))}
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      <Portal>
        <Modal
          visible={showAddItemModal}
          onDismiss={() => setShowAddItemModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title title="Ajouter un article" />
            <Card.Content>
              <TextInput
                label="Nom de l'article"
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Quantité"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                keyboardType="numeric"
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Unité"
                value={newItem.unit}
                onChangeText={(text) => setNewItem({ ...newItem, unit: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Catégorie"
                value={newItem.category}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowAddItemModal(false)}>Annuler</Button>
              <Button onPress={addItem}>Ajouter</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddItemModal(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
  },
  listHeader: {
    padding: 16,
    backgroundColor: '#2D2C3E',
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E1F2',
    marginBottom: 8,
  },
  listStats: {
    color: '#E2E1F2',
  },
  categoryCard: {
    marginVertical: 8,
    backgroundColor: '#2D2C3E',
  },
  modalContainer: {
    backgroundColor: '#2D2C3E',
    padding: 16,
  },
  modalInput: {
    marginBottom: 16,
    width: width - 64,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
  },
});

export default ShoppingListScreen;
