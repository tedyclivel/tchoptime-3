const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 🔥 Récupère les informations d'un utilisateur
 * @param {string} userId - ID Firebase de l'utilisateur
 */
const getUserProfile = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.exists ? userDoc.data() : null;
};

/**
 * 🔥 Ajoute ou met à jour un utilisateur
 * @param {string} userId - ID Firebase de l'utilisateur
 * @param {Object} profileData - Données du profil utilisateur
 */
const updateUserProfile = async (userId, profileData) => {
  await db.collection("users").doc(userId).set(profileData, { merge: true });
  console.log(`✅ Profil utilisateur mis à jour : ${userId}`);
};

module.exports = { getUserProfile, updateUserProfile };
