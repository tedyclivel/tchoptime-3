import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';
import { configService } from './configService';
import { firestore } from '../../backend/firebase';
import { auth } from '../../backend/firebase';
import { mealPlanService } from './mealPlanService';
import { stockService } from './stockService';
import { shoppingListService } from './shoppingListService';
import { recipeService } from './recipeService';

/**
 * 🔔 Service de gestion des notifications
 */
export class NotificationService {
  constructor() {
    this.config = configService.getNotificationConfig();
  }

  /**
   * 🔔 Récupère les tokens de notification
   * @returns {Promise<string[]>} - Liste des tokens
   */
  async getTokens() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const tokens = await firestore()
        .collection('users')
        .doc(userId)
        .collection('notificationTokens')
        .get();

      return tokens.docs.map(doc => doc.data().token);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des tokens:', error);
      throw error;
    }
  }

  /**
   * 🔔 Enregistre un nouveau token
   * @param {string} token - Token de notification
   * @returns {Promise<void>}
   */
  async registerToken(token) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('notificationTokens')
        .add({
          token,
          platform: Platform.OS,
          registeredAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      throw error;
    }
  }

  /**
   * 🔔 Supprime un token
   * @param {string} token - Token à supprimer
   * @returns {Promise<void>}
   */
  async unregisterToken(token) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('notificationTokens')
        .where('token', '==', token)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => doc.ref.delete());
        });
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du token:', error);
      throw error;
    }
  }

  /**
   * 🔔 Génère une notification push via Firebase Cloud Messaging
   * @param {Object} notification - Notification à envoyer
   * @returns {Promise<void>}
   */
  async sendPushNotification(notification) {
    try {
      const tokens = await this.getTokens();
      if (tokens.length === 0) return;

      // Utilisation de Firebase Cloud Messaging
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          type: notification.type,
          ...notification.data,
        },
        tokens,
      };

      // TODO: Implémenter l'envoi via Firebase Cloud Messaging
      console.log('🔔 Notification push envoyée:', message);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
      throw error;
    }
  }

  /**
   * 🔔 Génère une notification locale
   * @param {Object} notification - Notification à afficher
   * @returns {Promise<void>}
   */
  async showLocalNotification(notification) {
    try {
      // Utilisation de react-native-push-notification
      const options = {
        title: notification.title,
        message: notification.body,
        playSound: true,
        soundName: 'default',
        priority: 'high',
        visibility: 'public',
        importance: 'high',
        data: notification.data,
      };

      // TODO: Implémenter l'affichage local avec react-native-push-notification
      console.log('🔔 Notification locale affichée:', options);
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de la notification:', error);
      throw error;
    }
  }

  /**
   * 🔔 Planifie une notification
   * @param {Object} notification - Notification à planifier
   * @param {Date} date - Date de la notification
   * @returns {Promise<void>}
   */
  async scheduleNotification(notification, date) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const notificationId = await firestore()
        .collection('users')
        .doc(userId)
        .collection('scheduledNotifications')
        .add({
          ...notification,
          scheduledAt: date,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      // TODO: Implémenter la planification avec react-native-push-notification
      console.log('🔔 Notification planifiée:', notificationId);
    } catch (error) {
      console.error('❌ Erreur lors de la planification:', error);
      throw error;
    }
  }

  /**
   * 🔔 Marque une notification comme lue
   * @param {string} id - ID de la notification
   * @returns {Promise<void>}
   */
  async markAsRead(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(id)
        .update({
          readAt: firestore.FieldValue.serverTimestamp(),
          status: 'read',
        });
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  /**
   * 🔔 Supprime une notification
   * @param {string} id - ID de la notification
   * @returns {Promise<void>}
   */
  async deleteNotification(id) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(id)
        .delete();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * 🔔 Active/désactive les notifications push
   * @param {boolean} enabled - True pour activer
   * @returns {Promise<void>}
   */
  async togglePushNotifications(enabled) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          pushNotificationsEnabled: enabled,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      throw error;
    }
  }

  /**
   * 🔔 Active/désactive les notifications locales
   * @param {boolean} enabled - True pour activer
   * @returns {Promise<void>}
   */
  async toggleLocalNotifications(enabled) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          localNotificationsEnabled: enabled,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      throw error;
    }
  }

  /**
   * 🔔 Vérifie si les notifications sont activées
   * @returns {Promise<boolean>} - True si les notifications sont activées
   */
  async areNotificationsEnabled() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return false;

      const user = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      return user.data()?.notificationsEnabled ?? true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      throw error;
    }
  }

  /**
   * 🔔 Génère une notification de rappel de repas
   * @param {Object} meal - Repas
   * @param {Date} date - Date du repas
   * @returns {Promise<void>}
   */
  async generateMealReminder(meal, date) {
    try {
      const notification = {
        title: 'Rappel de repas',
        body: `Il est temps de préparer : ${meal.name}`,
        mealId: meal.id,
        type: 'mealReminder',
        data: {
          meal,
          date,
        },
      };

      // Planifie la notification 1 heure avant le repas
      const reminderDate = new Date(date);
      reminderDate.setHours(reminderDate.getHours() - 1);

      await this.scheduleNotification(notification, reminderDate);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rappel:', error);
      throw error;
    }
  }

  /**
   * 🔔 Génère une notification de stock
   * @param {Object} item - Item du stock
   * @returns {Promise<void>}
   */
  async generateStockAlert(item) {
    try {
      const notification = {
        title: 'Alerte stock',
        body: `${item.name} va bientôt expirer !`,
        itemId: item.id,
        type: 'stockAlert',
        data: {
          item,
        },
      };

      await this.showLocalNotification(notification);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'alerte:', error);
      throw error;
    }
  }

  /**
   * 🔔 Génère une notification de liste de courses
   * @param {Object} list - Liste de courses
   * @returns {Promise<void>}
   */
  async generateShoppingListNotification(list) {
    try {
      const notification = {
        title: 'Nouvelle liste de courses',
        body: `Liste créée: ${list.name}`,
        listId: list.id,
        type: 'shoppingList',
        data: {
          list,
        },
      };

      await this.showLocalNotification(notification);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la notification:', error);
      throw error;
    }
  }

  /**
   * 🔔 Génère une notification de recette
   * @param {Object} recipe - Recette
   * @param {Date} date - Date de préparation
   * @returns {Promise<void>}
   */
  async generateRecipeNotification(recipe, date) {
    try {
      const notification = {
        title: 'Rappel de recette',
        body: `Préparez ${recipe.name} aujourd'hui !`,
        recipeId: recipe.id,
        type: 'recipeReminder',
        data: {
          recipe,
          date,
        },
      };

      // Planifie la notification 2 heures avant la préparation
      const reminderDate = new Date(date);
      reminderDate.setHours(reminderDate.getHours() - 2);

      await this.scheduleNotification(notification, reminderDate);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rappel:', error);
      throw error;
    }
  }
};

/**
 * 🔔 Génère une notification de stock bas
 * @param {Object} item - Item avec stock bas
 * @param {string} item.name - Nom de l'item
 * @param {number} item.quantity - Quantité actuelle
 * @param {number} item.threshold - Seuil minimum
 * @returns {Promise<void>}
 */
export const generateLowStockAlert = async (item) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const notification = {
      title: 'Stock bas',
      body: `${item.name} est presque épuisé (${item.quantity}${item.unit})`,
      type: 'alert',
      data: {
        itemId: item.id,
        itemName: item.name,
        currentQuantity: item.quantity,
      },
    };

    await generateLocalNotification(notification);
    await generatePushNotification({
      ...notification,
      token: (await getDocument('users', userId))?.notificationToken,
    });

    console.log('🔔 Alert de stock bas générée');
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'alerte de stock bas:', error);
  }
};

/**
 * 🔔 Marque une notification comme lue
 * @param {string} notificationId - ID de la notification
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const user = await getDocument('users', userId);
    const notifications = user?.notifications || [];
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );

    await updateDocument('users', userId, {
      notifications: updatedNotifications,
    });

    console.log('✅ Notification marquée comme lue');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la notification:', error);
  }
};
