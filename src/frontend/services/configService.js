import { Platform } from 'react-native';

/**
 * 🔧 Service de configuration de l'application
 */
export class ConfigService {
  constructor() {
    this.config = {
      // API Keys
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
      },
      openrouteservice: {
        apiKey: process.env.OPENROUTESERVICE_API_KEY,
      },

      // Configuration de l'application
      app: {
        name: 'TchopTime',
        version: '1.0.0',
        theme: {
          primary: '#4F46E5',
          secondary: '#818CF8',
          background: '#171624',
          text: '#E2E1F2',
        },
        urls: {
          privacyPolicy: 'https://tchoptime.com/privacy',
          termsOfService: 'https://tchoptime.com/terms',
          support: 'https://tchoptime.com/support',
        },
      },

      // Configuration des notifications
      notifications: {
        dailyReminderTime: '18:00',
        weeklySummaryDay: 'Sunday',
        shoppingListThreshold: 2, // jours avant expiration
        stockAlertThreshold: 7, // jours avant péremption
      },

      // Configuration des recettes
      recipes: {
        maxIngredients: 50,
        maxSteps: 20,
        defaultPreparationTime: 30, // minutes
        defaultDifficulty: 'moyen',
        defaultServings: 4,
        maxServings: 10,
        minServings: 1,
      },

      // Configuration des plans de repas
      mealPlan: {
        defaultWeeks: 1,
        maxWeeks: 4,
        defaultDailyMeals: 3,
        maxDailyMeals: 5,
      },

      // Configuration de l'IA
      ai: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.7,
        maxRecipeSuggestions: 5,
        maxShoppingListSuggestions: 10,
      },

      // Configuration des performances
      performance: {
        maxCacheSize: 5000000, // 5MB
        cacheExpiration: 86400000, // 24 heures
        maxNetworkRetries: 3,
        retryDelay: 1000, // 1 seconde
      },
    };
  }

  /**
   * 🔍 Récupère une configuration spécifique
   * @param {string[]} path - Chemin de la configuration
   * @returns {*} - Valeur de la configuration
   */
  get(...path) {
    return path.reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * 🔍 Vérifie si une configuration existe
   * @param {string[]} path - Chemin de la configuration
   * @returns {boolean} - True si la configuration existe
   */
  has(...path) {
    const value = this.get(...path);
    return value !== undefined;
  }

  /**
   * 🔍 Récupère la configuration complète
   * @returns {Object} - Configuration complète
   */
  getAll() {
    return this.config;
  }

  /**
   * 🔍 Récupère la configuration de l'application
   * @returns {Object} - Configuration de l'application
   */
  getAppConfig() {
    return this.get('app');
  }

  /**
   * 🔍 Récupère la configuration des notifications
   * @returns {Object} - Configuration des notifications
   */
  getNotificationConfig() {
    return this.get('notifications');
  }

  /**
   * 🔍 Récupère la configuration des recettes
   * @returns {Object} - Configuration des recettes
   */
  getRecipeConfig() {
    return this.get('recipes');
  }

  /**
   * 🔍 Récupère la configuration du stock
   * @returns {Object} - Configuration du stock
   */
  getStockConfig() {
    return this.get('stock');
  }

  /**
   * 🔍 Récupère la configuration de la géolocalisation
   * @returns {Object} - Configuration de la géolocalisation
   */
  getGeolocationConfig() {
    return this.get('location');
  }

  /**
   * 🔍 Récupère la configuration des performances
   * @returns {Object} - Configuration des performances
   */
  getPerformanceConfig() {
    return this.get('performance');
  }

  /**
   * 🔍 Récupère les API Keys
   * @returns {Object} - API Keys
   */
  getApiKeys() {
    return {
      firebase: this.get('firebase'),
      openai: this.get('openai'),
      openrouteservice: this.get('openrouteservice'),
    };
  }

  /**
   * 🔍 Vérifie la configuration
   * @returns {Object} - Rapport de vérification
   */
  validateConfig() {
    const report = {
      firebase: this.has('firebase', 'apiKey'),
      openai: this.has('openai', 'apiKey'),
      openrouteservice: this.has('openrouteservice', 'apiKey'),
      platform: Platform.OS === 'android' || Platform.OS === 'ios',
    };

    return report;
  }
}

// Export singleton
export const configService = new ConfigService();
