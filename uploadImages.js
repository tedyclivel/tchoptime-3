const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require("./tchoptime-2-firebase-adminsdk-fbsvc-bf4998b68b.json");

// 🔹 Initialisation Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tchoptime.firebaseio.com"
});

const db = admin.firestore();

// 🔹 Configuration Cloudinary
cloudinary.config({
  cloud_name: "dvznrkhu4",
  api_key: "321815658398541",
  api_secret: "_hWxBO0vJQGAeEYQtEF2HeuwzVA"
});

// 🔹 Dossiers des images
const baseFolder = "./IMAGE/";
const subFolders = ["Plats", "Ingredients"]; // 📂 Deux dossiers à traiter

const uploadImagesAndUpdateFirestore = async () => {
  for (const folder of subFolders) {
    const fullPath = path.join(baseFolder, folder);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Le dossier ${fullPath} n'existe pas.`);
      continue;
    }

    const files = fs.readdirSync(fullPath);
    if (files.length === 0) {
      console.log(`⚠️ Le dossier ${folder} est vide, aucune image à uploader.`);
      continue;
    }

    for (const file of files) {
      const imagePath = path.join(fullPath, file);
      const imageName = path.basename(file, path.extname(file)); // Récupère le nom sans extension

      try {
        const result = await cloudinary.uploader.upload(imagePath);
        console.log(`✅ Image uploadée : ${file} -> ${result.secure_url}`);

        // 🔹 Met à jour Firestore avec l’URL de l’image en recherchant le champ `code`
        const collectionName = folder === "Plats" ? "plats" : "ingredients";
        const querySnapshot = await db.collection(collectionName).where("code", "==", imageName).get();

        if (!querySnapshot.empty) {
          querySnapshot.forEach(async (doc) => {
            await doc.ref.update({ photo: result.secure_url });
            console.log(`🔄 Firestore mis à jour : ${imageName} -> ${result.secure_url} dans ${collectionName}`);
          });
        } else {
          console.log(`⚠️ Aucun document trouvé pour ${imageName} dans ${collectionName}.`);
        }

      } catch (error) {
        console.error(`❌ Échec de l'upload pour ${file} :`, error);
      }
    }
  }
};

// 🔥 Lancer l'upload et la mise à jour Firestore
uploadImagesAndUpdateFirestore();
