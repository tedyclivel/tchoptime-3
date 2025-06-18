const admin = require("firebase-admin");
const db = admin.firestore();
const PDFDocument = require("pdfkit");
const fs = require("fs");

/**
 * 🔥 Génère un menu hebdomadaire en PDF
 * @param {string} userId - ID Firebase de l'utilisateur
 */
exports.generateMenuPDF = async (req, res) => {
  try {
    const { userId } = req.body;
    const mealPlanRef = db.collection("users").doc(userId).collection("mealPlans");
    const snapshot = await mealPlanRef.get();
    if (snapshot.empty) return res.status(404).send({ success: false, message: "Aucun menu trouvé" });

    const doc = new PDFDocument();
    const pdfPath = `./menus/menu_${userId}.pdf`;
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(18).text("Menu Hebdomadaire", { align: "center" });
    snapshot.forEach(doc => {
      const meal = doc.data();
      doc.fontSize(14).text(`📅 ${meal.date}: ${meal.recipeId}`);
    });

    doc.end();
    stream.on("finish", () => res.status(200).send({ success: true, message: "PDF généré", path: pdfPath }));
  } catch (error) {
    res.status(500).send({ success: false, message: "Erreur génération PDF", error });
  }
};
