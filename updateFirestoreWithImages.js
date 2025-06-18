const admin = require("firebase-admin");
const serviceAccount = require("./tchoptime-2-firebase-adminsdk-fbsvc-bf4998b68b.json");

// 🔹 Initialisation Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tchoptime.firebaseio.com"
});

const db = admin.firestore();

// 🔹 Fonction pour normaliser les codes d'images
const normalizeCode = (fileName) => {
  if (!fileName || typeof fileName !== "string") {
    console.log(`⚠️ Code invalide détecté :`, fileName);
    return null;
  }
  return fileName.replace(/[^a-zA-Z0-9_-]/g, ""); // Supprime les caractères spéciaux
};

const updateFirestoreWithImages = async () => {
  // 🔹 Détection automatique des collections existantes
  const collections = await db.listCollections();
  const collectionNames = collections.map(col => col.id);
  console.log("📂 Collections détectées :", collectionNames);

  for (const collection of collectionNames) {
    const snapshot = await db.collection(collection).get();

    if (snapshot.empty) {
      console.log(`⚠️ Aucun document trouvé dans ${collection}.`);
      continue;
    }

    snapshot.forEach(async (doc) => {
      const code = doc.data().code;

      if (!code || typeof code !== "string") {
        console.log(`⚠️ Document ${doc.id} ne contient pas de code valide.`);
        return; // Ignore ce document et passe au suivant
      }

      const imageCode = normalizeCode(code);
      const imageUrl = doc.data().photo;

      if (imageUrl && imageUrl.startsWith("https://res.cloudinary.com/")) {
        console.log(`✅ Déjà mis à jour : ${doc.id} -> ${imageUrl}`);
      } else {
        console.log(`🔄 Mise à jour en cours pour ${doc.id}...`);
        
        // 🔹 Génère une URL Cloudinary basée sur le code de l'image
        const newImageUrl = `https://res.cloudinary.com/dvznrkhu4/image/upload/v1750028383/${imageCode}.jpg`;
        
        await doc.ref.update({ photo: newImageUrl });
        console.log(`✅ Mise à jour réussie : ${doc.id} -> ${newImageUrl}`);
      }
    });
  }
};

// 🔥 Exécuter la mise à jour Firestore
updateFirestoreWithImages();
