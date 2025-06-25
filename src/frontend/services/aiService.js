import { OpenAI } from 'openai';
import { configService } from './configService';
import { firestore } from '../../backend/firebase';
import { auth } from '../../backend/firebase';

/**
 * 🤖 Service d'Intelligence Artificielle
 */
export class AIService {
  constructor() {
    this.config = configService.getAll();
    this.openai = new OpenAI({
      apiKey: this.config.openai.apiKey,
    });
  }

  /**
   * 🤖 Génère une nouvelle recette
   * @param {Object} preferences - Préférences de l'utilisateur
   * @returns {Promise<Object>} - Recette générée
   */
  async generateRecipe(preferences) {
    try {
      const prompt = `
        Génère une recette originale avec les ingrédients suivants: ${preferences.ingredients.join(', ')}. 
        Style de cuisine: ${preferences.cuisine}.
        Préférences: ${preferences.dietaryPreferences.join(', ')}. 
        Difficulté: ${preferences.difficulty}.
        
        Format: {name: string, description: string, ingredients: [{name: string, quantity: number, unit: string}], instructions: string[]}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      const recipe = JSON.parse(completion.choices[0].message.content);
      
      // Sauvegarder dans Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        await firestore().collection('recipes').add({
          ...recipe,
          userId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          generatedByAI: true,
        });
      }

      return recipe;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la recette:', error);
      throw error;
    }
  }

  /**
   * 🤖 Génère une critique constructive
   * @param {Object} recipe - Recette à analyser
   * @param {number} rating - Note donnée
   * @returns {Promise<Object>} - Critique générée
   */
  async generateReview(recipe, rating) {
    try {
      const prompt = `
        Analyse la recette suivante et donne une critique constructive basée sur la note ${rating}/5:
        ${JSON.stringify(recipe)}
        
        Format: {positives: string[], negatives: string[], suggestions: string[]}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      const review = JSON.parse(completion.choices[0].message.content);
      
      // Sauvegarder dans Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        await firestore().collection('reviews').add({
          ...review,
          recipeId: recipe.id,
          userId,
          rating,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      return review;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la critique:', error);
      throw error;
    }
  }

  /**
   * 🤖 Génère un script de tutoriel vidéo
   * @param {Object} recipe - Recette pour le tutoriel
   * @returns {Promise<Object>} - Script du tutoriel
   */
  async generateTutorial(recipe) {
    try {
      const prompt = `
        Crée un script pour un tutoriel vidéo de la recette suivante:
        ${JSON.stringify(recipe)}
        
        Format: {title: string, introduction: string, steps: string[], conclusion: string}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      const tutorial = JSON.parse(completion.choices[0].message.content);
      
      // Sauvegarder dans Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        await firestore().collection('tutorials').add({
          ...tutorial,
          recipeId: recipe.id,
          userId,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      return tutorial;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du tutoriel:', error);
      throw error;
    }
  }

  /**
   * 🤖 Analyse une liste de courses
   * @param {Object[]} items - Liste des articles
   * @returns {Promise<Object>} - Analyse de la liste
   */
  async analyzeShoppingList(items) {
    try {
      const prompt = `
        Analyse cette liste de courses et donne des suggestions d'optimisation:
        ${JSON.stringify(items)}
        
        Format: {groupedByCategory: Object, suggestions: string[], costOptimization: number[]}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse de la liste:', error);
      throw error;
    }
  }

  /**
   * 🤖 Suggère des alternatives plus saines
   * @param {Object[]} items - Liste des articles
   * @returns {Promise<Object[]>} - Suggestions d'alternatives
   */
  async suggestHealthierAlternatives(items) {
    try {
      const prompt = `
        Pour chaque ingrédient suivant, suggère une alternative plus saine:
        ${JSON.stringify(items)}
        
        Format: [{name: string, alternative: string, benefits: string[]}]
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('❌ Erreur lors de la suggestion d\'alternatives:', error);
      throw error;
    }
  }

  /**
   * 🤖 Génère un plan de repas hebdomadaire
   * @param {Object} preferences - Préférences alimentaires
   * @returns {Promise<Object[]>} - Plan de repas
   */
  async generateWeeklyMealPlan(preferences) {
    try {
      const prompt = `
        Génère un plan de repas hebdomadaire basé sur les préférences suivantes:
        ${JSON.stringify(preferences)}
        
        Format: [{day: string, meals: [{name: string, type: string, ingredients: string[]}]}]
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du plan:', error);
      throw error;
    }
  }

  /**
   * 🤖 Génère une liste de courses optimisée
   * @param {Object[]} meals - Liste des repas
   * @returns {Promise<Object>} - Liste optimisée
   */
  async generateOptimizedShoppingList(meals) {
    try {
      const prompt = `
        Génère une liste de courses optimisée pour ces repas:
        ${JSON.stringify(meals)}
        
        Format: {items: [{name: string, quantity: number, unit: string, category: string}]}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste:', error);
      throw error;
    }
  }

  /**
   * 🤖 Génère une recette basée sur le stock
   * @param {Object[]} stock - Liste des ingrédients disponibles
   * @returns {Promise<Object>} - Recette générée
   */
  async generateRecipeFromStock(stock) {
    try {
      const prompt = `
        Crée une recette originale avec les ingrédients disponibles:
        ${JSON.stringify(stock)}
        
        Format: {name: string, description: string, ingredients: [{name: string, quantity: number, unit: string}], instructions: string[]}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la recette:', error);
      throw error;
    }
  }

  /**
   * 🤖 Vérifie la disponibilité de l'IA
   * @returns {Promise<boolean>} - True si l'IA est disponible
   */
  async isAIAvailable() {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Ping" }],
      });
      return response.choices[0].message.content === "Pong";
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'IA:', error);
      return false;
    }
  }

  /**
   * 🤖 Sauvegarde une interaction avec l'IA
   * @param {Object} interaction - Détails de l'interaction
   * @returns {Promise<void>}
   */
  async saveInteraction(interaction) {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await firestore().collection('aiInteractions').add({
          ...interaction,
          userId,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'interaction:', error);
      throw error;
    }
  }

  /**
   * 🤖 Récupère l'historique des interactions
   * @returns {Promise<Object[]>} - Historique des interactions
   */
  async getInteractionHistory() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const interactions = await firestore()
        .collection('aiInteractions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return interactions.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }
}

// Export singleton
export const aiService = new AIService();
