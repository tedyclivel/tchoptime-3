const admin = require("firebase-admin");
const functions = require("firebase-functions");
const transporter = require("../services/emailService");
const validateInputs = require("../utils/validateInputs"); // ✅ Correction importation

// ✅ Vérification : Initialisation Firebase uniquement si nécessaire
if (!admin.apps.length) {
  const serviceAccount = require("../config/firebaseAdminSDK.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tchoptime-2.firebaseio.com"
  });
}

const db = admin.firestore();

/**
 * 🔹 Envoi du menu hebdomadaire par email
 */
exports.sendWeeklyMenu = async (req, res) => {
  try {
    console.log("🔍 Données reçues :", req.body);

    const { userId } = req.body;

    // ✅ Vérification des entrées utilisateur
    if (!validateInputs.isValidString(userId)) {
      console.error("❌ Paramètre invalide :", userId);
      return res.status(400).send({ success: false, message: "Paramètre invalide" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.error("❌ Utilisateur introuvable :", userId);
      return res.status(404).send({ success: false, message: "Utilisateur introuvable" });
    }

    const userEmail = userDoc.data().email;
    const pdfPath = `./menus/menu_${userId}.pdf`;

    // ✅ Vérification de l'email avant l'envoi
    if (!validateInputs.isValidString(userEmail)) {
      console.error("❌ Email invalide :", userEmail);
      return res.status(400).send({ success: false, message: "Email utilisateur invalide" });
    }

    const mailOptions = {
      from: "noxcipher1@gmail.com",
      to: userEmail,
      subject: "📅 Votre Menu Hebdomadaire",
      text: "Voici votre menu pour la semaine !",
      attachments: [{ path: pdfPath }]
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé avec succès :", userEmail);

    res.status(200).send({ success: true, message: "Menu envoyé par email" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
    res.status(500).send({ success: false, message: "Erreur envoi email", error });
  }
};
