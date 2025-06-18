const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { isValidString, isValidObject, isValidNumber } = require("../utils/validateInputs");

// 🔥 Vérifier que Firebase n'est pas initialisé plusieurs fois
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ✅ Fonction pour normaliser `stockChanges`
 * - Si `stockChanges` est un **tableau**, le convertir en **objet**
 */
const normalizeStockChanges = (stockChanges) => {
  if (Array.isArray(stockChanges)) {
    return stockChanges.reduce((acc, item) => {
      acc[item.ingredientId] = { quantity: item.quantity, isPurchase: item.isPurchase };
      return acc;
    }, {});
  }
  return stockChanges; // Garder le format original si déjà correct
};

exports.updateStock = functions.https.onRequest(async (req, res) => {
  try {
    console.log("🔍 Données reçues :", req.body);

    const { userId, stockChanges } = req.body;
    const normalizedStockChanges = normalizeStockChanges(stockChanges);

    // ✅ Vérification des entrées utilisateur
    if (!isValidString(userId) || !isValidObject(normalizedStockChanges)) {
      console.error("❌ Paramètres invalides :", { userId, stockChanges });
      return res.status(400).send({ success: false, message: "Paramètres invalides" });
    }

    const stockRef = db.collection("users").doc(userId).collection("stock");

    for (const [ingredientId, { quantity, isPurchase }] of Object.entries(normalizedStockChanges)) {
      if (!isValidNumber(quantity)) continue; // ✅ Correction

      const ingredientRef = stockRef.doc(ingredientId);
      const docSnapshot = await ingredientRef.get();
      const currentQuantity = docSnapshot.exists ? docSnapshot.data().quantityAvailable : 0;
      const newQuantity = isPurchase ? currentQuantity + quantity : currentQuantity - quantity;

      await ingredientRef.set({ quantityAvailable: Math.max(newQuantity, 0) }, { merge: true });
      console.log(`✅ Stock mis à jour : ${ingredientId} → ${Math.max(newQuantity, 0)}`);
    }

    res.status(200).send({ success: true, message: "Stock mis à jour automatiquement" });
  } catch (error) {
    console.error("❌ Erreur mise à jour stock :", error);
    res.status(500).send({ success: false, message: "Erreur serveur", error });
  }
});
