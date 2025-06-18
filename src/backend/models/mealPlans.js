const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 🔥 Récupère le calendrier des repas d'un utilisateur
 * @param {string} userId - ID Firebase de l'utilisateur
 */
const getMealPlan = async (userId) => {
  const mealPlanRef = db.collection("users").doc(userId).collection("mealPlans");
  const snapshot = await mealPlanRef.get();
  const mealPlanData = [];
  snapshot.forEach(doc => mealPlanData.push(doc.data()));
  return mealPlanData;
};

/**
 * 🔥 Ajoute un repas au calendrier d'un utilisateur
 * @param {string} userId - ID Firebase de l'utilisateur
 * @param {Object} mealData - Données du repas (date, plat, quantité)
 */
const addMealPlan = async (userId, mealData) => {
  const mealRef = db.collection("users").doc(userId).collection("mealPlans").doc();
  await mealRef.set(mealData);
  console.log(`✅ Repas ajouté au plan : ${mealData.recipeId}`);
};

module.exports = { getMealPlan, addMealPlan };
