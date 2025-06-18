const admin = require("firebase-admin");

// 🔥 Initialisation Firebase uniquement si nécessaire
if (!admin.apps.length) {
  const serviceAccount = require("../config/firebaseAdminSDK.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tchoptime-2.firebaseio.com"
  });
}

const db = admin.firestore();

// 🔍 Vérification d'un utilisateur
async function fetchUserData(userId) {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    console.log("❌ Utilisateur introuvable :", userId);
    return;
  }
  console.log("✅ Données utilisateur :", userDoc.data());
}

fetchUserData("testUser"); // 🔥 Remplace "testUser" par un utilisateur existant
