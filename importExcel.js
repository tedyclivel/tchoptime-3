const admin = require("firebase-admin");
const xlsx = require("xlsx");
const serviceAccount = require("./tchoptime-2-firebase-adminsdk-fbsvc-bf4998b68b.json");

// 🔹 Initialisation Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ton-projet.firebaseio.com"
});

const db = admin.firestore();
const workbook = xlsx.readFile("./B1 REPAS FINAL.xlsm"); // 🔥 Remplace avec le vrai chemin
const sheetNames = workbook.SheetNames; // Liste des feuilles Excel

// 🔹 Parcours des feuilles et insertion des données
sheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`📖 Lecture de la feuille : ${sheetName}`);
  if (data.length === 0) {
    console.log(`⚠️ La feuille ${sheetName} est vide, elle sera ignorée.`);
    return;
  }

  data.forEach(async (row) => {
    // 🔹 Vérifier que l'entrée est valide (éviter les champs vides)
    if (!row.code || row.code === "EMPTY") {
      console.log(`⏭️ Ignoré : Document sans code valide dans ${sheetName}`);
      return;
    }

    // 🔹 Vérifier et remplacer les chemins d’images
    if (row.photo && !row.photo.startsWith("http")) {
      row.photo = `https://cloudgenerate.com/path/${row.photo}`;
    }

    try {
      const docRef = db.collection(sheetName).doc(row.code.toString());
      await docRef.set(row);
      console.log(`✅ Ajouté : ${sheetName} -> ${row.code}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout de ${row.code} :`, error);
    }
  });
});
