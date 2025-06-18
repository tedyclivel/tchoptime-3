const admin = require("firebase-admin");
const serviceAccount = require("../config/firebaseAdminSDK.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tchoptime.firebaseio.com"
});

const db = admin.firestore();

/**
 * 🔹 Mise à jour automatique du stock des ingrédients dans Firestore
 * - Ajout d'ingrédients après un achat validé
 * - Réduction des quantités après consommation d'un repas
 * - Gestion des stocks faibles avec alerte
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} stockChanges - {ingredientId: {quantity, isPurchase}}
 */
const updateStock = async (userId, stockChanges) => {
  try {
    const stockRef = db.collection("users").doc(userId).collection("stock");

    for (const [ingredientId, { quantity, isPurchase }] of Object.entries(stockChanges)) {
      const ingredientRef = stockRef.doc(ingredientId);
      const docSnapshot = await ingredientRef.get();

      if (!docSnapshot.exists) {
        if (isPurchase) {
          await ingredientRef.set({ quantityAvailable: quantity, unit: "default" });
          console.log(`✅ Stock initialisé : ${ingredientId} -> ${quantity}`);
        } else {
          console.log(`⚠️ Stock insuffisant pour ${ingredientId}, ne peut pas être consommé.`);
        }
      } else {
        const currentQuantity = docSnapshot.data().quantityAvailable;
        const newQuantity = isPurchase ? currentQuantity + quantity : currentQuantity - quantity;

        if (newQuantity <= 0) {
          console.log(`⚠️ Stock épuisé pour ${ingredientId} !`);
        }

        await ingredientRef.update({ quantityAvailable: Math.max(newQuantity, 0) });
        console.log(`🔄 Stock mis à jour : ${ingredientId} -> ${newQuantity}`);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du stock :", error);
  }
};

module.exports = updateStock;
