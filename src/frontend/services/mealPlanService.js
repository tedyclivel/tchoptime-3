import { Platform } from 'react-native';
import { configService } from './configService';
import { firestore } from '../../backend/firebase';
import { auth } from '../../backend/firebase';
import { recipeService } from './recipeService';
import { stockService } from './stockService';
import { aiService } from './aiService';
import { notificationService } from './notificationService';

/**
 * 📅 Service de planification des repas
 */
export class MealPlanService {
  constructor() {
    this.config = configService.getMealPlanConfig();
  }

  /**
   * 📅 Récupère les plans de repas de l'utilisateur
   * @returns {Promise<Object[]>} - Liste des plans de repas
   */
  async getMealPlans() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const plans = await firestore()
        .collection('users')
        .doc(userId)
        .collection('mealPlans')
        .orderBy('startDate', 'desc')
        .get();

      return plans.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des plans:', error);
      throw error;
    }
  }

  /**
   * 📅 Récupère un plan de repas spécifique
   * @param {string} id - ID du plan
   * @returns {Promise<Object>} - Plan de repas
   */
  async getMealPlan(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const plan = await firestore()
        .collection('users')
        .doc(userId)
        .collection('mealPlans')
        .doc(id)
        .get();

      return plan.exists ? {
        id: plan.id,
        ...plan.data(),
      } : null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du plan:', error);
      throw error;
    }
  }

  /**
   * 📅 Crée un nouveau plan de repas
   * @param {Object} plan - Plan à créer
   * @returns {Promise<Object>} - Plan créé
   */
  async createMealPlan(plan) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const newPlan = {
        ...plan,
        startDate: new Date(plan.startDate),
        endDate: new Date(plan.endDate),
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastUpdated: firestore.FieldValue.serverTimestamp(),
        userId,
      };

      const docRef = await firestore()
        .collection('users')
        .doc(userId)
        .collection('mealPlans')
        .add(newPlan);

      return {
        id: docRef.id,
        ...newPlan,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création du plan:', error);
      throw error;
    }
  }

  /**
   * 📅 Met à jour un plan de repas
   * @param {string} id - ID du plan
   * @param {Object} updates - Mises à jour à appliquer
   * @returns {Promise<void>}
   */
  async updateMealPlan(id, updates) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('mealPlans')
        .doc(id)
        .update({
          ...updates,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du plan:', error);
      throw error;
    }
  }

  /**
   * 📅 Supprime un plan de repas
   * @param {string} id - ID du plan
   * @returns {Promise<void>}
   */
  async deleteMealPlan(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('mealPlans')
        .doc(id)
        .delete();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du plan:', error);
      throw error;
    }
  }

  /**
   * 📅 Génère un plan de repas hebdomadaire
   * @param {Object} preferences - Préférences pour le plan
   * @returns {Promise<Object>} - Plan de repas généré
   */
  async generateWeeklyPlan(preferences) {
    try {
      const plan = await aiService.generateWeeklyMealPlan(preferences);
      
      // Vérifie la faisabilité de chaque repas
      const feasibility = await Promise.all(
        plan.map(async (day) => ({
          ...day,
          meals: await Promise.all(day.meals.map(async (meal) => ({
            ...meal,
            feasibility: await recipeService.checkRecipeFeasibility(meal),
          }))),
        }))
      );

      return this.createMealPlan({
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        days: feasibility,
        generatedByAI: true,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la génération du plan:', error);
      throw error;
    }
  }

  /**
   * 📅 Génère une liste de courses pour un plan
   * @param {Object} plan - Plan de repas
   * @returns {Promise<Object[]>} - Liste de courses optimisée
   */
  async generateShoppingListForPlan(plan) {
    try {
      // Récupère tous les ingrédients des repas du plan
      const allIngredients = plan.days.flatMap(day =>
        day.meals.flatMap(meal => meal.ingredients)
      );

      // Génère une liste optimisée avec l'IA
      const optimizedList = await aiService.generateOptimizedShoppingList(allIngredients);
      
      return optimizedList.items;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste:', error);
      throw error;
    }
  }

  /**
   * 📅 Génère des rappels pour un plan
   * @param {Object} plan - Plan de repas
   * @returns {Promise<void>}
   */
  async generateReminders(plan) {
    try {
      const today = new Date();
      const reminders = [];

      // Génère un rappel pour chaque repas
      plan.days.forEach((day) => {
        day.meals.forEach((meal) => {
          if (new Date(day.date) >= today) {
            reminders.push({
              date: new Date(day.date),
              meal: meal,
              type: 'repas',
              message: `Rappel: ${meal.type} aujourd'hui - ${meal.name}`,
            });
          }
        });
      });

      // Sauvegarde les rappels
      await notificationService.scheduleReminders(reminders);
    } catch (error) {
      console.error('❌ Erreur lors de la génération des rappels:', error);
      throw error;
    }
  }

  /**
   * 📅 Calcule le coût estimé d'un plan
   * @param {Object} plan - Plan de repas
   * @returns {number} - Coût estimé
   */
  calculateEstimatedCost(plan) {
    return plan.days.reduce((total, day) => {
      return total + day.meals.reduce((mealTotal, meal) => {
        return mealTotal + meal.ingredients.reduce((ingredientTotal, ingredient) => {
          // Prix moyen par unité (à ajuster selon les données réelles)
          const pricePerUnit = this.config.averagePrices[ingredient.name] || 2;
          return ingredientTotal + (ingredient.quantity * pricePerUnit);
        }, 0);
      }, 0);
    }, 0);
  }

  /**
   * 📅 Vérifie la disponibilité des ingrédients pour un plan
   * @param {Object} plan - Plan de repas
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async checkIngredientAvailabilityForPlan(plan) {
    try {
      const availability = {};

      // Vérifie chaque ingrédient de chaque repas
      await Promise.all(
        plan.days.map(async (day) => {
          await Promise.all(
            day.meals.map(async (meal) => {
              await Promise.all(
                meal.ingredients.map(async (ingredient) => {
                  const available = await stockService.checkIngredientAvailability(
                    ingredient.name,
                    ingredient.quantity
                  );
                  availability[ingredient.name] = {
                    available,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit,
                  };
                })
              );
            })
          );
        })
      );

      return availability;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la disponibilité:', error);
      throw error;
    }
  }

  /**
   * 📅 Génère un résumé du plan
   * @param {Object} plan - Plan de repas
   * @returns {Object} - Résumé du plan
   */
  generatePlanSummary(plan) {
    return {
      totalMeals: plan.days.reduce((total, day) => total + day.meals.length, 0),
      uniqueIngredients: new Set(
        plan.days.flatMap(day =>
          day.meals.flatMap(meal =>
            meal.ingredients.map(ingredient => ingredient.name)
          )
        )
      ).size,
      estimatedCost: this.calculateEstimatedCost(plan),
      preparationTime: plan.days.reduce((total, day) => {
        return total + day.meals.reduce((mealTotal, meal) => {
          return mealTotal + recipeService.calculateEstimatedTime(meal);
        }, 0);
      }, 0),
    };
  }

  /**
   * 📅 Formate un jour du plan
   * @param {Object} day - Jour du plan
   * @returns {string} - Jour formaté
   */
  formatDay(day) {
    return new Date(day.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  /**
   * 📅 Formate un repas
   * @param {Object} meal - Repas
   * @returns {string} - Repas formaté
   */
  formatMeal(meal) {
    return `${meal.type}: ${meal.name}`;
  }
}

// Export singleton
export const mealPlanService = new MealPlanService();
