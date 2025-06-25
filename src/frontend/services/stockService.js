import { getDocument, updateDocument } from '../backend/services/firestoreService';
import { auth } from '../../backend/firebase';
import { firestore } from '../../backend/firebase';
import { configService } from './configService';
import { aiService } from './aiService';

/**
 * 🔥 Récupère le stock actuel de l'utilisateur
 * @returns {Promise<Object>} - Stock avec aliments et ingrédients
 */
export const getStock = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;

    const profile = await getDocument('users', userId);
    return profile?.stock || {
      foods: [],
      ingredients: [],
      lastUpdated: null,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du stock:', error);
    return null;
  }
};

/**
 * 🔥 Ajoute un aliment ou ingrédient au stock
 * @param {Object} item - Item à ajouter
 * @param {string} item.name - Nom de l'item
 * @param {number} item.quantity - Quantité
 * @param {string} item.unit - Unité (kg, g, l, ml, etc.)
 * @param {string} item.category - Catégorie (fruits, légumes, etc.)
 * @param {Date} item.expiration - Date d'expiration
 * @param {string} type - Type (food ou ingredient)
 * @returns {Promise<void>}
 */
export const addToStock = async (item, type = 'food') => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const currentStock = await getStock();
    const items = currentStock[type + 's'];
    const existingItem = items.find(i => i.name === item.name);

    if (existingItem) {
      // Mise à jour de la quantité existante
      existingItem.quantity += item.quantity;
    } else {
      // Ajout d'un nouvel item
      items.push({
        ...item,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
      });
    }

    await updateDocument('users', userId, {
      stock: {
        ...currentStock,
        [type + 's']: items,
        lastUpdated: new Date().toISOString(),
      },
    });

    console.log('✅ Item ajouté au stock');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout au stock:', error);
    throw error;
  }
};

/**
 * 🔥 Supprime un item du stock
 * @param {string} itemId - ID de l'item à supprimer
 * @param {string} type - Type (food ou ingredient)
 * @returns {Promise<void>}
 */
export const removeFromStock = async (itemId, type = 'food') => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const currentStock = await getStock();
    const items = currentStock[type + 's'];
    const updatedItems = items.filter(item => item.id !== itemId);

    await updateDocument('users', userId, {
      stock: {
        ...currentStock,
        [type + 's']: updatedItems,
        lastUpdated: new Date().toISOString(),
      },
    });

    console.log('✅ Item supprimé du stock');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du stock:', error);
    throw error;
  }
};

/**
 * 🔥 Met à jour la quantité d'un item
 * @param {string} itemId - ID de l'item à mettre à jour
 * @param {number} quantity - Nouvelle quantité
 * @param {string} type - Type (food ou ingredient)
 * @returns {Promise<void>}
 */
export const updateStockQuantity = async (itemId, quantity, type = 'food') => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const currentStock = await getStock();
    const items = currentStock[type + 's'];
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );

    await updateDocument('users', userId, {
      stock: {
        ...currentStock,
        [type + 's']: updatedItems,
        lastUpdated: new Date().toISOString(),
      },
    });

    console.log('✅ Quantité mise à jour dans le stock');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du stock:', error);
    throw error;
  }
};

/**
 * 🔥 Génère une liste de courses basée sur les recettes et le stock
 * @param {Object[]} recipes - Recettes à préparer
 * @returns {Promise<Object[]>} - Liste d'ingrédients à acheter
 */
export const generateShoppingList = async (recipes) => {
  try {
    const stock = await getStock();
    const shoppingList = [];

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        // Vérifier si l'ingrédient est déjà dans le stock
        const inStock = stock.ingredients.find(
          i => i.name.toLowerCase() === ingredient.name.toLowerCase()
        );

        if (inStock) {
          // Calculer la quantité manquante
          const quantityNeeded = ingredient.quantity * recipe.quantity;
          const quantityMissing = quantityNeeded - inStock.quantity;

          if (quantityMissing > 0) {
            shoppingList.push({
              ...ingredient,
              quantity: quantityMissing,
              source: 'stock',
            });
          }
        } else {
          // Ajouter l'ingrédient à la liste
          shoppingList.push({
            ...ingredient,
            source: 'recipe',
          });
        }
      });
    });

    return shoppingList;
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la liste:', error);
    throw error;
  }
};

/**
 * 🔥 Vérifie les aliments périmés
 * @returns {Promise<Object[]>} - Liste des aliments périmés
 */
export const checkExpiredItems = async () => {
  try {
    const stock = await getStock();
    const today = new Date();

    return [...stock.foods, ...stock.ingredients]
      .filter(item => {
        const expiration = new Date(item.expiration);
        return expiration < today;
      });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des périmés:', error);
    return [];
  }
};

/**
 * 🔥 Calcule la quantité recommandée à acheter
 * @param {Object} item - Item à acheter
 * @param {number} consumptionFactor - Facteur de consommation familiale
 * @returns {number} - Quantité recommandée
 */
export const calculateRecommendedQuantity = (item, consumptionFactor) => {
  // Par défaut, multiplier par le facteur de consommation
  return item.quantity * consumptionFactor;
};

/**
 * 📦 Service de gestion du stock
 */
export class StockService {
  constructor() {
    this.config = configService.getStockConfig();
  }

  /**
   * 📦 Récupère le stock de l'utilisateur
   * @returns {Promise<Object[]>} - Liste des items du stock
   */
  async getStock() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const stock = await firestore()
        .collection('users')
        .doc(userId)
        .collection('stock')
        .orderBy('expiryDate', 'asc')
        .get();

      return stock.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du stock:', error);
      throw error;
    }
  }

  /**
   * 📦 Ajoute un item au stock
   * @param {Object} item - Item à ajouter
   * @returns {Promise<Object>} - Item ajouté
   */
  async addItem(item) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const newItem = {
        ...item,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      };

      // Suggère des alternatives plus saines
      const alternatives = await aiService.suggestHealthierAlternatives([item]);
      newItem.alternatives = alternatives;

      const docRef = await firestore()
        .collection('users')
        .doc(userId)
        .collection('stock')
        .add(newItem);

      return {
        id: docRef.id,
        ...newItem,
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout d\'un item:', error);
      throw error;
    }
  }

  /**
   * 📦 Met à jour un item du stock
   * @param {string} id - ID de l'item
   * @param {Object} updates - Mises à jour à appliquer
   * @returns {Promise<void>}
   */
  async updateItem(id, updates) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('stock')
        .doc(id)
        .update({
          ...updates,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour d\'un item:', error);
      throw error;
    }
  }

  /**
   * 📦 Supprime un item du stock
   * @param {string} id - ID de l'item
   * @returns {Promise<void>}
   */
  async deleteItem(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('stock')
        .doc(id)
        .delete();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression d\'un item:', error);
      throw error;
    }
  }

  /**
   * 📦 Vérifie les items périmés
   * @returns {Promise<Object[]>} - Liste des items périmés
   */
  async checkExpiredItems() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const today = new Date();
      const threshold = new Date(today);
      threshold.setDate(today.getDate() + this.config.stockAlertThreshold);

      const items = await firestore()
        .collection('users')
        .doc(userId)
        .collection('stock')
        .where('expiryDate', '<=', threshold)
        .get();

      return items.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des périmés:', error);
      throw error;
    }
  }

  /**
   * 📦 Calcule la quantité disponible d'un ingrédient
   * @param {string} ingredient - Nom de l'ingrédient
   * @returns {Promise<number>} - Quantité totale disponible
   */
  async calculateAvailableQuantity(ingredient) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return 0;

      const items = await firestore()
        .collection('users')
        .doc(userId)
        .collection('stock')
        .where('name', '==', ingredient)
        .where('expiryDate', '>', new Date())
        .get();

      return items.docs.reduce((total, doc) => {
        const data = doc.data();
        return total + (data.quantity || 0);
      }, 0);
    } catch (error) {
      console.error('❌ Erreur lors du calcul de la quantité:', error);
      throw error;
    }
  }

  /**
   * 📦 Génère une liste de courses basée sur le stock
   * @param {Object[]} recipes - Liste des recettes
   * @returns {Promise<Object[]>} - Liste de courses optimisée
   */
  async generateShoppingList(recipes) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      // Récupère le stock actuel
      const stock = await this.getStock();
      const stockMap = new Map(stock.map(item => [item.name, item]));

      // Calcule les ingrédients manquants
      const missingIngredients = recipes.flatMap(recipe => {
        return recipe.ingredients.filter(ingredient => {
          const stockItem = stockMap.get(ingredient.name);
          if (!stockItem) return true;
          
          const available = stockItem.quantity || 0;
          return available < ingredient.quantity;
        });
      });

      // Analyse la liste avec l'IA
      const analysis = await aiService.analyzeShoppingList(missingIngredients);

      // Groupe par catégorie
      const categories = this.config.categories.reduce((acc, category) => {
        acc[category] = [];
        return acc;
      }, {});

      missingIngredients.forEach(ingredient => {
        const category = ingredient.category || 'other';
        categories[category].push(ingredient);
      });

      return Object.entries(categories).map(([category, items]) => ({
        category,
        items,
        analysis: analysis.groupedByCategory[category] || {},
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste:', error);
      throw error;
    }
  }

  /**
   * 📦 Génère une recette basée sur le stock
   * @returns {Promise<Object>} - Recette générée
   */
  async generateRecipeFromStock() {
    try {
      const stock = await this.getStock();
      const availableIngredients = stock
        .filter(item => {
          const today = new Date();
          const expiry = new Date(item.expiryDate);
          return expiry > today;
        })
        .map(item => item.name);

      const recipe = await aiService.generateRecipeFromStock(availableIngredients);
      return recipe;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la recette:', error);
      throw error;
    }
  }

  /**
   * 📦 Vérifie la disponibilité d'un ingrédient
   * @param {string} ingredient - Nom de l'ingrédient
   * @param {number} quantity - Quantité requise
   * @returns {Promise<boolean>} - True si disponible
   */
  async checkIngredientAvailability(ingredient, quantity) {
    try {
      const available = await this.calculateAvailableQuantity(ingredient);
      return available >= quantity;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la disponibilité:', error);
      throw error;
    }
  }

  /**
   * 📦 Récupère les statistiques du stock
   * @returns {Promise<Object>} - Statistiques du stock
   */
  async getStockStats() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return {};

      const stock = await this.getStock();
      
      return {
        totalItems: stock.length,
        categories: stock.reduce((acc, item) => {
          const category = item.category || 'other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        expiringSoon: stock.filter(item => {
          const today = new Date();
          const expiry = new Date(item.expiryDate);
          return expiry <= today;
        }).length,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats:', error);
      throw error;
    }
  }

  /**
   * 📦 Vérifie la validité d'un item
   * @param {Object} item - Item à valider
   * @returns {boolean} - True si valide
   */
  validateItem(item) {
    const requiredFields = ['name', 'quantity', 'unit', 'expiryDate'];
    return requiredFields.every(field => item[field] !== undefined);
  }

  /**
   * 📦 Formate la date d'expiration
   * @param {Date} date - Date à formater
   * @returns {string} - Date formatée
   */
  formatExpiryDate(date) {
    return new Date(date).toLocaleDateString();
  }

  /**
   * 📦 Génère une alerte pour les items périmés
   * @returns {Promise<void>}
   */
  async generateExpiryAlerts() {
    try {
      const expiredItems = await this.checkExpiredItems();
      if (expiredItems.length > 0) {
        const message = `Les items suivants vont bientôt expirer : ${expiredItems.map(item => item.name).join(', ')}`;
        await notificationService.generateStockAlert({
          message,
          items: expiredItems,
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération des alertes:', error);
      throw error;
    }
  }

  /**
   * 📦 Récupère les suggestions d'alternatives pour un ingrédient
   * @param {string} ingredient - Nom de l'ingrédient
   * @returns {Promise<Object[]>} - Suggestions d'alternatives
   */
  async getSuggestionsForIngredient(ingredient) {
    try {
      const suggestions = await aiService.suggestHealthierAlternatives([{ name: ingredient }]);
      return suggestions[0]?.alternatives || [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des suggestions:', error);
      throw error;
    }
  }
}

// Export singleton
export const stockService = new StockService();
