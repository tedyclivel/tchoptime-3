import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
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
  Avatar,
  Paragraph,
  Badge,
} from 'react-native-paper';
import { getStock, addToStock, removeFromStock, updateStockQuantity, checkExpiredItems } from '../services/stockService';
import { getFamilyConfig } from '../services/familyService';
import { auth } from '../backend/firebase';

const { width } = Dimensions.get('window');

const StockScreen = () => {
  const [stock, setStock] = useState({
    foods: [],
    ingredients: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: '',
    expiration: '',
    type: 'food',
  });
  const [expiredItems, setExpiredItems] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    loadStock();
    checkExpired();
  }, []);

  const loadStock = async () => {
    try {
      const currentStock = await getStock();
      setStock(currentStock || {
        foods: [],
        ingredients: [],
        lastUpdated: null,
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement du stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExpired = async () => {
    try {
      const expired = await checkExpiredItems();
      setExpiredItems(expired);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des périmés:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStock();
    await checkExpired();
    setRefreshing(false);
  };

  const addItem = async () => {
    try {
      await addToStock(newItem, newItem.type);
      await loadStock();
      setNewItem({
        name: '',
        quantity: '',
        unit: '',
        category: '',
        expiration: '',
        type: 'food',
      });
      setShowAddItemModal(false);
      console.log('✅ Item ajouté au stock');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout au stock:', error);
    }
  };

  const updateItemQuantity = async (itemId, quantity, type) => {
    try {
      await updateStockQuantity(itemId, parseFloat(quantity), type);
      await loadStock();
      console.log('✅ Quantité mise à jour');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la quantité:', error);
    }
  };

  const deleteItem = async (itemId, type) => {
    try {
      await removeFromStock(itemId, type);
      await loadStock();
      console.log('✅ Item supprimé du stock');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  // Catégories de produits
  const categories = {
    foods: [
      'Fruits',
      'Légumes',
      'Viandes',
      'Poissons',
      'Produits laitiers',
      'Boissons',
      'Féculents',
      'Autres',
    ],
    ingredients: [
      'Épices',
      'Condiments',
      'Farines',
      'Huiles',
      'Sucre',
      'Autres',
    ],
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Section des aliments périmés */}
        {expiredItems.length > 0 && (
          <Card style={styles.alertCard}>
            <Card.Title
              title="⚠️ Aliments périmés"
              subtitle={`${expiredItems.length} aliments à vérifier`}
            />
            <Card.Content>
              {expiredItems.map((item) => (
                <List.Item
                  key={item.id}
                  title={item.name}
                  description={`${item.quantity}${item.unit ? ` ${item.unit}` : ''} - Périmé le ${
                    new Date(item.expiration).toLocaleDateString()
                  }`}
                  left={(props) => (
                    <Avatar.Icon
                      {...props}
                      icon="alert"
                      color={theme.colors.error}
                    />
                  )}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Section des aliments */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Mes Aliments" />
          {categories.foods.map((category) => {
            const items = stock.foods.filter(item => item.category === category);
            if (items.length === 0) return null;

            return (
              <View key={category}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((item) => (
                  <List.Item
                    key={item.id}
                    title={item.name}
                    description={`${item.quantity}${item.unit ? ` ${item.unit}` : ''} - ${
                      new Date(item.expiration).toLocaleDateString()
                    }`}
                    left={(props) => (
                      <TextInput
                        {...props}
                        label="Qty"
                        value={item.quantity.toString()}
                        onChangeText={(text) => updateItemQuantity(item.id, text, 'food')}
                        keyboardType="numeric"
                        style={styles.quantityInput}
                        mode="outlined"
                        theme={{ colors: { primary: theme.colors.primary } }}
                      />
                    )}
                    right={(props) => (
                      <List.Icon
                        {...props}
                        icon="delete"
                        color={theme.colors.error}
                        onPress={() => deleteItem(item.id, 'food')}
                      />
                    )}
                  />
                ))}
              </View>
            );
          })}
        </Card>

        {/* Section des ingrédients */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Mes Ingrédients" />
          {categories.ingredients.map((category) => {
            const items = stock.ingredients.filter(item => item.category === category);
            if (items.length === 0) return null;

            return (
              <View key={category}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((item) => (
                  <List.Item
                    key={item.id}
                    title={item.name}
                    description={`${item.quantity}${item.unit ? ` ${item.unit}` : ''} - ${
                      new Date(item.expiration).toLocaleDateString()
                    }`}
                    left={(props) => (
                      <TextInput
                        {...props}
                        label="Qty"
                        value={item.quantity.toString()}
                        onChangeText={(text) => updateItemQuantity(item.id, text, 'ingredient')}
                        keyboardType="numeric"
                        style={styles.quantityInput}
                        mode="outlined"
                        theme={{ colors: { primary: theme.colors.primary } }}
                      />
                    )}
                    right={(props) => (
                      <List.Icon
                        {...props}
                        icon="delete"
                        color={theme.colors.error}
                        onPress={() => deleteItem(item.id, 'ingredient')}
                      />
                    )}
                  />
                ))}
              </View>
            );
          })}
        </Card>
      </ScrollView>

      <Portal>
        <Modal
          visible={showAddItemModal}
          onDismiss={() => setShowAddItemModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title title="Ajouter un produit" />
            <Card.Content>
              <TextInput
                label="Nom du produit"
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
              <TextInput
                label="Date d'expiration"
                value={newItem.expiration}
                onChangeText={(text) => setNewItem({ ...newItem, expiration: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <List.Item
                title="Type"
                description={newItem.type === 'food' ? 'Aliment' : 'Ingrédient'}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={newItem.type === 'food' ? 'food' : 'flask-outline'}
                  />
                )}
                right={(props) => (
                  <List.Icon
                    {...props}
                    icon="swap-horizontal"
                    onPress={() => setNewItem({ ...newItem, type: newItem.type === 'food' ? 'ingredient' : 'food' })}
                  />
                )}
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
  alertCard: {
    backgroundColor: '#2D2C3E',
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#2D2C3E',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E1F2',
    marginBottom: 8,
    marginLeft: 16,
  },
  quantityInput: {
    width: 60,
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

export default StockScreen;
