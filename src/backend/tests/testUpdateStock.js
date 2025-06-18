const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { isValidString, isValidObject, isValidNumber } = require("../utils/validateInputs");

// 🔥 Charger les identifiants Firebase
const serviceAccount = require("../config/firebaseAdminSDK.json");

// ✅ Initialisation Firebase avec clé de service
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tchoptime-2.firebaseio.com"
  });
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
console.log("✅ Test terminé : Mise à jour du stock validée !");
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
      if (!isValidNumber(quantity)) continue;

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
