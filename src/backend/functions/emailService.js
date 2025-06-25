const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * 🔥 Envoie un email de confirmation de commande
 * @param {Object} data - Données de la commande
 * @param {string} data.userId - ID de l'utilisateur
 * @param {Object[]} data.items - Liste des articles
 * @returns {Promise<void>}
 */
exports.sendOrderConfirmation = functions.https.onCall(async (data) => {
  try {
    const db = admin.firestore();
    const user = await db.collection('users').doc(data.userId).get();

    if (!user.exists) {
      throw new Error('Utilisateur non trouvé');
    }

    const userEmail = user.data().email;
    const userName = user.data().displayName || 'Utilisateur';

    // Créer le contenu HTML de l'email
    const htmlContent = `
      <h2>Bonjour ${userName},</h2>
      <p>Merci pour votre commande !</p>
      <h3>Votre commande contient :</h3>
      <ul>
        ${data.items.map(item => 
          `<li>${item.name} - ${item.quantity}${item.unit}</li>`
        ).join('')}
      </ul>
      <p>Bonne préparation !</p>
    `;

    // Envoyer l'email
    await transporter.sendMail({
      from: 'noreply@tchoptime.com',
      to: userEmail,
      subject: 'Confirmation de votre commande TchopTime',
      html: htmlContent,
    });

    console.log('✅ Email de confirmation envoyé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 🔥 Envoie un email de rappel de repas
 * @param {Object} data - Données du repas
 * @param {string} data.userId - ID de l'utilisateur
 * @param {string} data.mealName - Nom du repas
 * @param {string} data.mealDate - Date du repas
 * @returns {Promise<void>}
 */
exports.sendMealReminder = functions.https.onCall(async (data) => {
  try {
    const db = admin.firestore();
    const user = await db.collection('users').doc(data.userId).get();

    if (!user.exists) {
      throw new Error('Utilisateur non trouvé');
    }

    const userEmail = user.data().email;
    const userName = user.data().displayName || 'Utilisateur';

    // Créer le contenu HTML de l'email
    const htmlContent = `
      <h2>Bonjour ${userName},</h2>
      <p>C\'est l\'heure de préparer ${data.mealName} !</p>
      <p>La préparation devrait commencer maintenant.</p>
      <p>Bonne cuisine !</p>
    `;

    // Envoyer l'email
    await transporter.sendMail({
      from: 'noreply@tchoptime.com',
      to: userEmail,
      subject: `Rappel : Préparation de ${data.mealName}`,
      html: htmlContent,
    });

    console.log('✅ Email de rappel envoyé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 🔔 Envoie une notification push pour un repas
 * @param {Object} data - Données du repas
 * @param {string} data.userId - ID de l'utilisateur
 * @param {string} data.mealName - Nom du repas
 * @param {string} data.mealDate - Date du repas
 * @returns {Promise<void>}
 */
exports.sendMealNotification = functions.https.onCall(async (data) => {
  try {
    const db = admin.firestore();
    const user = await db.collection('users').doc(data.userId).get();

    if (!user.exists) {
      throw new Error('Utilisateur non trouvé');
    }

    const messaging = admin.messaging();
    const token = user.data().notificationToken;

    if (!token) {
      throw new Error('Pas de token de notification');
    }

    // Envoyer la notification
    await messaging.send({
      token,
      notification: {
        title: 'Rappel de repas',
        body: `C\'est l\'heure de préparer ${data.mealName} !`,
      },
      data: {
        type: 'meal_reminder',
        mealId: data.mealId,
        mealName: data.mealName,
        mealDate: data.mealDate,
      },
    });

    console.log('🔔 Notification push envoyée');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
