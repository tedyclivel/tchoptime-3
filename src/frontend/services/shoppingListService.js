import { Platform } from 'react-native';
import { configService } from './configService';
import { firestore } from '../../backend/firebase';
import { auth } from '../../backend/firebase';
import { aiService } from './aiService';
import { stockService } from './stockService';
import { notificationService } from './notificationService';

/**
 * 🛒 Service de gestion des listes de courses
 */
export class ShoppingListService {
  constructor() {
    this.config = configService.getShoppingListConfig();
  }

  /**
   * 🛒 Récupère les listes de courses de l'utilisateur
   * @returns {Promise<Object[]>} - Liste des listes de courses
   */
  async getShoppingLists() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const lists = await firestore()
        .collection('users')
        .doc(userId)
        .collection('shoppingLists')
        .orderBy('createdAt', 'desc')
        .get();

      return lists.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des listes:', error);
      throw error;
    }
  }

  /**
   * 🛒 Récupère une liste de courses spécifique
   * @param {string} id - ID de la liste
   * @returns {Promise<Object>} - Liste de courses
   */
  async getShoppingList(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const list = await firestore()
        .collection('users')
        .doc(userId)
        .collection('shoppingLists')
        .doc(id)
        .get();

      return list.exists ? {
        id: list.id,
        ...list.data(),
      } : null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la liste:', error);
      throw error;
    }
  }

  /**
   * 🛒 Crée une nouvelle liste de courses
   * @param {Object} list - Liste à créer
   * @returns {Promise<Object>} - Liste créée
   */
  async createShoppingList(list) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const newList = {
        ...list,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastUpdated: firestore.FieldValue.serverTimestamp(),
        userId,
        items: list.items.map(item => ({
          ...item,
          checked: false,
        })),
      };

      const docRef = await firestore()
        .collection('users')
        .doc(userId)
        .collection('shoppingLists')
        .add(newList);

      // Génère une notification
      await notificationService.generateShoppingListNotification({
        title: 'Nouvelle liste de courses',
        message: `Liste créée: ${list.name}`,
        listId: docRef.id,
      });

      return {
        id: docRef.id,
        ...newList,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création de la liste:', error);
      throw error;
    }
  }

  /**
   * 🛒 Met à jour une liste de courses
   * @param {string} id - ID de la liste
   * @param {Object} updates - Mises à jour à appliquer
   * @returns {Promise<void>}
   */
  async updateShoppingList(id, updates) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('shoppingLists')
        .doc(id)
        .update({
          ...updates,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la liste:', error);
      throw error;
    }
  }

  /**
   * 🛒 Supprime une liste de courses
   * @param {string} id - ID de la liste
   * @returns {Promise<void>}
   */
  async deleteShoppingList(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('shoppingLists')
        .doc(id)
        .delete();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la liste:', error);
      throw error;
    }
  }

  /**
   * 🛒 Génère une liste de courses optimisée
   * @param {Object[]} items - Liste des items
   * @returns {Promise<Object[]>} - Liste optimisée
   */
  async generateOptimizedList(items) {
    try {
      const optimizedList = await aiService.generateOptimizedShoppingList(items);
      return optimizedList.items;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste:', error);
      throw error;
    }
  }

  /**
   * 🛒 Génère une liste de courses basée sur le stock
   * @returns {Promise<Object[]>} - Liste basée sur le stock
   */
  async generateStockBasedList() {
    try {
      const stock = await stockService.getStock();
      const items = stock.filter(item => {
        const today = new Date();
        const expiry = new Date(item.expiryDate);
        return expiry <= today;
      });

      return items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste:', error);
      throw error;
    }
  }

  /**
   * 🛒 Vérifie la disponibilité des items dans le stock
   * @param {Object[]} items - Liste des items
   * @returns {Promise<Object[]>} - Résultat de la vérification
   */
  async checkItemAvailability(items) {
    try {
      const availability = [];

      for (const item of items) {
        const available = await stockService.calculateAvailableQuantity(item.name);
        availability.push({
          ...item,
          availableQuantity: available,
          inStock: available >= item.quantity,
        });
      }

      return availability;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la disponibilité:', error);
      throw error;
    }
  }

  /**
   * 🛒 Calcule le coût estimé de la liste
   * @param {Object[]} items - Liste des items
   * @returns {number} - Coût estimé
   */
  calculateEstimatedCost(items) {
    return items.reduce((total, item) => {
      // Prix moyen par unité (à ajuster selon les données réelles)
      const pricePerUnit = this.config.averagePrices[item.name] || 2;
      return total + (item.quantity * pricePerUnit);
    }, 0);
  }

  /**
   * 🛒 Génère une alerte pour les items manquants
   * @param {Object[]} items - Liste des items
   * @returns {Promise<void>}
   */
  async generateMissingItemsAlert(items) {
    try {
      const availability = await this.checkItemAvailability(items);
      const missingItems = availability.filter(item => !item.inStock);

      if (missingItems.length > 0) {
        const message = `Les items suivants manquent dans votre stock : ${missingItems.map(item => item.name).join(', ')}`;
        await notificationService.generateStockAlert({
          message,
          items: missingItems,
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération des alertes:', error);
      throw error;
    }
  }

  /**
   * 🛒 Génère un résumé de la liste
   * @param {Object[]} items - Liste des items
   * @returns {Object} - Résumé de la liste
   */
  generateListSummary(items) {
    return {
      totalItems: items.length,
      uniqueCategories: new Set(items.map(item => item.category)).size,
      estimatedCost: this.calculateEstimatedCost(items),
      itemsByCategory: items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  /**
   * 🛒 Formate un item de la liste
   * @param {Object} item - Item de la liste
   * @returns {string} - Item formaté
   */
  formatListItem(item) {
    return `${item.quantity} ${item.unit} ${item.name} (${item.category})`;
  }

  /**
   * 🛒 Formate la liste complète
   * @param {Object[]} items - Liste des items
   * @returns {string} - Liste formatée
   */
  formatShoppingList(items) {
    return items.map(item => this.formatListItem(item)).join('\n');
  }

  /**
   * 🛒 Génère une liste de courses pour une recette
   * @param {Object} recipe - Recette
   * @returns {Promise<Object[]>} - Liste de courses optimisée
   */
  async generateListForRecipe(recipe) {
    try {
      const feasibility = await stockService.checkRecipeFeasibility(recipe);
      const missingIngredients = feasibility.missing.map(ingredient => ({
        ...ingredient,
        category: this.config.categories.find(c => c.includes(ingredient.name)) || 'other',
      }));

      return this.generateOptimizedList(missingIngredients);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste:', error);
      throw error;
    }
  }

  /**
   * 🛒 Génère une liste de courses pour un plan de repas
   * @param {Object} plan - Plan de repas
   * @returns {Promise<Object[]>} - Liste de courses optimisée
   */
  async generateListForMealPlan(plan) {
    try {
      const allIngredients = [];
      
      // Récupère tous les ingrédients du plan
      for (const day of plan.days) {
        for (const meal of day.meals) {
          allIngredients.push(...meal.ingredients);
        }
      }

      // Génère une liste optimisée
      return this.generateOptimizedList(allIngredients);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste:', error);
      throw error;
    }
  }
}

// Export singleton
export const shoppingListService = new ShoppingListService();
