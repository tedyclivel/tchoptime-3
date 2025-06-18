const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { isValidString, isValidArrayOfObjects } = require("../utils/validateInputs");

// 🔥 Vérification : Initialisation Firebase uniquement si nécessaire
if (!admin.apps.length) {
 const serviceAccount = require("../config/firebaseAdminSDK.json");


  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tchoptime-2.firebaseio.com"
  });
}

const db = admin.firestore();

/**
 * 🔹 Génère une liste de courses en fonction des repas hebdomadaires
 */
exports.generateShoppingList = functions.https.onRequest(async (req, res) => {
  try {
    console.log("🔍 Données reçues :", req.body);

    const { userId, weekMeals } = req.body;

    // ✅ Vérification des entrées utilisateur
    if (!isValidString(userId) || !isValidArrayOfObjects(weekMeals)) {
      console.error("❌ Paramètres invalides :", { userId, weekMeals });
      return res.status(400).send({ success: false, message: "Paramètres invalides" });
    }

    const shoppingList = {};
    weekMeals.forEach(({ day, ingredients }) => {
      ingredients.forEach(ingredient => {
        shoppingList[ingredient] = (shoppingList[ingredient] || 0) + 1;
      });
    });

    await db.collection("users").doc(userId).set({ shoppingList }, { merge: true });

    console.log("✅ Liste de courses générée :", shoppingList);
    res.status(200).send({ success: true, message: "Liste de courses générée avec succès", shoppingList });
  } catch (error) {
    console.error("❌ Erreur génération liste de courses :", error);
    res.status(500).send({ success: false, message: "Erreur serveur", error });
  }
});
