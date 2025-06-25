import { Platform } from 'react-native';
import { configService } from './configService';
import { firestore } from '../../backend/firebase';
import { auth } from '../../backend/firebase';
import { aiService } from './aiService';
import { imageService } from './imageService';
import { stockService } from './stockService';
import { shoppingListService } from './shoppingListService';
import { mealPlanService } from './mealPlanService';
import { notificationService } from './notificationService';

/**
 * 📝 Service de gestion des recettes
 */
export class RecipeService {
  constructor() {
    this.config = configService.getRecipeConfig();
  }

  /**
   * 📝 Récupère une recette par ID
   * @param {string} id - ID de la recette
   * @returns {Promise<Object>} - Recette
   */
  async getRecipe(id) {
    try {
      const recipe = await firestore()
        .collection('recipes')
        .doc(id)
        .get();

      if (!recipe.exists) {
        throw new Error('Recette non trouvée');
      }

      return {
        id: recipe.id,
        ...recipe.data(),
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la recette:', error);
      throw error;
    }
  }

  /**
   * 📝 Récupère les recettes utilisateur
   * @returns {Promise<Object[]>} - Liste des recettes
   */
  async getUserRecipes() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const recipes = await firestore()
        .collection('users')
        .doc(userId)
        .collection('recipes')
        .get();

      return recipes.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des recettes utilisateur:', error);
      throw error;
    }
  }

  /**
   * 📝 Récupère les recettes globales
   * @param {Object} filters - Filtres de recherche
   * @returns {Promise<Object[]>} - Liste des recettes
   */
  async getGlobalRecipes(filters = {}) {
    try {
      let query = firestore().collection('recipes');

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      if (filters.difficulty) {
        query = query.where('difficulty', '==', filters.difficulty);
      }

      if (filters.time) {
        query = query.where('prepTime', '<=', filters.time);
      }

      const recipes = await query.get();
      return recipes.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des recettes globales:', error);
      throw error;
    }
  }

  /**
   * 📝 Crée une nouvelle recette
   * @param {Object} recipe - Recette à créer
   * @returns {Promise<Object>} - Recette créée
   */
  async createRecipe(recipe) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Validation des données
      this.validateRecipe(recipe);

      // Générer une image si nécessaire
      if (!recipe.image) {
        recipe.image = await imageService.generateRecipeImage(recipe);
      }

      // Sauvegarder la recette
      const recipeRef = await firestore()
        .collection('users')
        .doc(userId)
        .collection('recipes')
        .add({
          ...recipe,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Générer une notification
      await notificationService.generateLocalNotification({
        title: 'Nouvelle recette',
        body: `Recette ${recipe.name} créée avec succès !`,
        type: 'recipeCreated',
        data: {
          recipeId: recipeRef.id,
          recipeName: recipe.name,
        },
      });

      return {
        id: recipeRef.id,
        ...recipe,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création de la recette:', error);
      throw error;
    }
  }

  /**
   * 📝 Met à jour une recette
   * @param {string} id - ID de la recette
   * @param {Object} updates - Mises à jour
   * @returns {Promise<Object>} - Recette mise à jour
   */
  async updateRecipe(id, updates) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Validation des données
      this.validateRecipe(updates);

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('recipes')
        .doc(id)
        .update({
          ...updates,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Générer une notification
      await notificationService.generateLocalNotification({
        title: 'Recette mise à jour',
        body: `Recette mise à jour avec succès !`,
        type: 'recipeUpdated',
        data: {
          recipeId: id,
          updates,
        },
      });

      return await this.getRecipe(id);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la recette:', error);
      throw error;
    }
  }

  /**
   * 📝 Supprime une recette
   * @param {string} id - ID de la recette
   * @returns {Promise<void>}
   */
  async deleteRecipe(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Supprimer l'image associée
      const recipe = await this.getRecipe(id);
      if (recipe.image) {
        await imageService.deleteImage(recipe.image);
      }

      // Supprimer les références dans les listes de courses
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('shoppingLists')
        .where('recipeId', '==', id)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => doc.ref.delete());
        });

      // Supprimer les références dans les plans de repas
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('mealPlans')
        .where('recipeId', '==', id)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => doc.ref.delete());
        });

      // Supprimer la recette
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('recipes')
        .doc(id)
        .delete();

      // Générer une notification
      await notificationService.generateLocalNotification({
        title: 'Recette supprimée',
        body: `Recette ${recipe.name} supprimée avec succès !`,
        type: 'recipeDeleted',
        data: {
          recipeId: id,
          recipeName: recipe.name,
        },
      });
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la recette:', error);
      throw error;
    }
  }

  /**
   * 📝 Génère une recette via IA
   * @param {Object} params - Paramètres de génération
   * @returns {Promise<Object>} - Recette générée
   */
  async generateRecipeWithAI(params) {
    try {
      const recipe = await aiService.generateRecipe(params);
      return await this.createRecipe(recipe);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la recette via IA:', error);
      throw error;
    }
  }

  /**
   * 📝 Génère une liste de courses pour une recette
   * @param {Object} recipe - Recette
   * @returns {Promise<Object>} - Liste de courses
   */
  async generateShoppingList(recipe) {
    try {
      const list = await shoppingListService.createList({
        name: `Liste pour ${recipe.name}`,
        items: recipe.ingredients.map(ingredient => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        })),
        recipeId: recipe.id,
      });

      // Générer une notification
      await notificationService.generateLocalNotification({
        title: 'Liste de courses générée',
        body: `Liste pour ${recipe.name} créée avec succès !`,
        type: 'shoppingListGenerated',
        data: {
          listId: list.id,
          recipeId: recipe.id,
        },
      });

      return list;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste de courses:', error);
      throw error;
    }
  }

  /**
   * 📝 Vérifie la faisabilité d'une recette
   * @param {Object} recipe - Recette
   * @returns {Promise<{missing: Object[], available: Object[]}>} - Résultat de la vérification
   */
  async checkRecipeFeasibility(recipe) {
    try {
      const stock = await stockService.getUserStock();
      const missing = [];
      const available = [];

      for (const ingredient of recipe.ingredients) {
        const stockItem = stock.find(item => 
          item.name.toLowerCase() === ingredient.name.toLowerCase()
        );

        if (!stockItem || stockItem.quantity < ingredient.quantity) {
          missing.push({
            ...ingredient,
            inStock: stockItem?.quantity || 0,
          });
        } else {
          available.push({
            ...ingredient,
            inStock: stockItem.quantity,
          });
        }
      }

      // Générer une notification si des ingrédients manquent
      if (missing.length > 0) {
        await notificationService.generateLocalNotification({
          title: 'Ingrédients manquants',
          body: `Il manque ${missing.length} ingrédients pour ${recipe.name}`,
          type: 'missingIngredients',
          data: {
            recipeId: recipe.id,
            missingIngredients: missing,
          },
        });
      }

      return { missing, available };
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la faisabilité:', error);
      throw error;
    }
  }

  /**
   * 📝 Ajoute une recette à un plan de repas
   * @param {string} mealPlanId - ID du plan de repas
   * @param {Object} recipe - Recette
   * @param {Date} date - Date du repas
   * @returns {Promise<void>}
   */
  async addRecipeToMealPlan(mealPlanId, recipe, date) {
    try {
      await mealPlanService.addMeal(mealPlanId, {
        recipeId: recipe.id,
        name: recipe.name,
        date,
      });

      // Générer une notification
      await notificationService.generateLocalNotification({
        title: 'Repas ajouté',
        body: `${recipe.name} ajouté au plan de repas !`,
        type: 'recipeAddedToMealPlan',
        data: {
          mealPlanId,
          recipeId: recipe.id,
          date,
        },
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la recette au plan de repas:', error);
      throw error;
    }
  }

  /**
   * 📝 Vérifie si une recette est disponible
   * @param {Object} recipe - Recette
   * @returns {Promise<boolean>} - True si disponible
   */
  async isRecipeAvailable(recipe) {
    try {
      const { missing } = await this.checkRecipeFeasibility(recipe);
      return missing.length === 0;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la disponibilité:', error);
      throw error;
    }
  }

  /**
   * 📝 Vérifie si une recette est préparable
   * @param {Object} recipe - Recette
   * @returns {Promise<boolean>} - True si préparable
   */
  async isRecipePreparable(recipe) {
    try {
      const { missing } = await this.checkRecipeFeasibility(recipe);
      return missing.length === 0;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la préparabilité:', error);
      throw error;
    }
  }

  /**
   * 📝 Vérifie si une recette est favorite
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<boolean>} - True si favorite
   */
  async isFavorite(recipeId) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return false;

      const user = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      return user.data()?.favoriteRecipes?.includes(recipeId) ?? false;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des favoris:', error);
      throw error;
    }
  }

  /**
   * 📝 Ajoute une recette aux favoris
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<void>}
   */
  async addToFavorites(recipeId) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          favoriteRecipes: firestore.FieldValue.arrayUnion(recipeId),
        });

      // Générer une notification
      const recipe = await this.getRecipe(recipeId);
      await notificationService.generateLocalNotification({
        title: 'Recette ajoutée aux favoris',
        body: `${recipe.name} ajouté aux favoris !`,
        type: 'recipeAddedToFavorites',
        data: {
          recipeId,
          recipeName: recipe.name,
        },
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout aux favoris:', error);
      throw error;
    }
  }

  /**
   * 📝 Supprime une recette des favoris
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<void>}
   */
  async removeFromFavorites(recipeId) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          favoriteRecipes: firestore.FieldValue.arrayRemove(recipeId),
        });

      // Générer une notification
      const recipe = await this.getRecipe(recipeId);
      await notificationService.generateLocalNotification({
        title: 'Recette retirée des favoris',
        body: `${recipe.name} retiré des favoris`,
        type: 'recipeRemovedFromFavorites',
        data: {
          recipeId,
          recipeName: recipe.name,
        },
      });
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des favoris:', error);
      throw error;
    }
  }

  /**
   * 📝 Récupère les recettes favorites
   * @returns {Promise<Object[]>} - Liste des recettes favorites
   */
  async getFavorites() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const user = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      const favoriteRecipes = user.data()?.favoriteRecipes || [];
      const recipes = await Promise.all(
        favoriteRecipes.map(id => this.getRecipe(id))
      );

      return recipes;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des favoris:', error);
      throw error;
    }
  }

  /**
   * 📝 Vérifie la validité d'une recette
   * @param {Object} recipe - Recette à valider
   * @returns {boolean} - True si valide
   */
  validateRecipe(recipe) {
    if (!recipe.name) throw new Error('Le nom est requis');
    if (!recipe.ingredients) throw new Error('Les ingrédients sont requis');
    if (!recipe.steps) throw new Error('Les étapes sont requises');
    if (recipe.prepTime < 0) throw new Error('Le temps de préparation doit être positif');
    if (recipe.difficulty < 1 || recipe.difficulty > 5) throw new Error('Le niveau de difficulté doit être entre 1 et 5');
    if (recipe.servings < 1) throw new Error('Le nombre de personnes doit être supérieur à 0');
    if (!recipe.category) throw new Error('La catégorie est requise');
    if (!recipe.description) throw new Error('La description est requise');
  }
}

// Export singleton
export const recipeService = new RecipeService();
