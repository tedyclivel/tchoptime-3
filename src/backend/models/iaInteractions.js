const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 🔥 Enregistre une interaction IA
 * @param {string} userId - ID Firebase de l'utilisateur
 * @param {string} type - Type d'interaction ('recipe_critique', 'plan_critique', 'video_generation')
 * @param {Object} data - Contenu de l'interaction
 */
const saveIAInteraction = async (userId, type, data) => {
  const interactionRef = db.collection("users").doc(userId).collection("iaInteractions").doc();
  await interactionRef.set({ type, data, timestamp: new Date() });
  console.log(`✅ Interaction IA enregistrée : ${type}`);
};

/**
 * 🔥 Récupère l'historique des interactions IA d'un utilisateur
 * @param {string} userId - ID Firebase de l'utilisateur
 */
const getIAInteractions = async (userId) => {
  const interactionsRef = db.collection("users").doc(userId).collection("iaInteractions");
  const snapshot = await interactionsRef.get();
  const interactionsList = [];
  snapshot.forEach(doc => interactionsList.push(doc.data()));
  return interactionsList;
};

module.exports = { saveIAInteraction, getIAInteractions };
