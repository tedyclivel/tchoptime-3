const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 🔥 Récupère toutes les listes de courses d'un utilisateur
 * @param {string} userId - ID Firebase de l'utilisateur
 * @returns {Array} - Liste des achats programmés
 */
const getShoppingLists = async (userId) => {
  const listRef = db.collection("users").doc(userId).collection("shoppingLists");
  const snapshot = await listRef.get();
  const shoppingLists = [];
  snapshot.forEach(doc => shoppingLists.push(doc.data()));
  return shoppingLists;
};

/**
 * 🔥 Ajoute une nouvelle liste de courses
 * @param {string} userId - ID Firebase de l'utilisateur
 * @param {Object} listData - Données de la liste (date, ingrédients, estimation coût)
 */
const addShoppingList = async (userId, listData) => {
  const listRef = db.collection("users").doc(userId).collection("shoppingLists").doc();
  await listRef.set(listData);
  console.log(`✅ Liste de courses ajoutée pour ${userId}`);
};

/**
 * 🔥 Valide une liste de courses et met à jour le stock
 * @param {string} userId - ID Firebase de l'utilisateur
 * @param {string} listId - ID de la liste validée
 */
const validateShoppingList = async (userId, listId) => {
  const listRef = db.collection("users").doc(userId).collection("shoppingLists").doc(listId);
  const listSnapshot = await listRef.get();

  if (!listSnapshot.exists) {
    console.log(`⚠️ Liste introuvable : ${listId}`);
    return;
  }

  const listData = listSnapshot.data();
  const stockRef = db.collection("users").doc(userId).collection("stock");

  for (const item of listData.items) {
    const ingredientRef = stockRef.doc(item.ingredientId);
    const docSnapshot = await ingredientRef.get();
    const currentQuantity = docSnapshot.exists ? docSnapshot.data().quantityAvailable : 0;
    await ingredientRef.set({ quantityAvailable: currentQuantity + item.requestedQuantity }, { merge: true });
    console.log(`🔄 Stock mis à jour : ${item.ingredientId}`);
  }

  await listRef.update({ status: "purchased" });
  console.log(`✅ Liste de courses validée : ${listId}`);
};

module.exports = { getShoppingLists, addShoppingList, validateShoppingList };
