const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 🔥 Récupère une recette
 * @param {string} recipeId - ID de la recette
 */
const getRecipe = async (recipeId) => {
  const recipeDoc = await db.collection("globalRecipes").doc(recipeId).get();
  return recipeDoc.exists ? recipeDoc.data() : null;
};

/**
 * 🔥 Ajoute ou met à jour une recette
 * @param {string} recipeId - ID de la recette
 * @param {Object} recipeData - Données de la recette
 */
const updateRecipe = async (recipeId, recipeData) => {
  await db.collection("globalRecipes").doc(recipeId).set(recipeData, { merge: true });
  console.log(`✅ Recette mise à jour : ${recipeId}`);
};

module.exports = { getRecipe, updateRecipe };
