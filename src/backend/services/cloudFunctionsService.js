const { getDocument, updateDocument } = require("./firestoreService");

/**
 * 🔥 Fonction pour appeler une Cloud Function
 * @param {string} functionName - Nom de la Cloud Function
 * @param {Object} params - Paramètres envoyés à la fonction
 */
const callCloudFunction = async (functionName, params) => {
  // Simuler une API Firebase Function
  console.log(`🔄 Appel de Cloud Function : ${functionName}`, params);
  return { status: "success", result: "Données traitées" };
};

/**
 * 🔥 Exemple d'utilisation : Génération de menu PDF
 */
const generateMenuPDF = async (userId) => {
  const userData = await getDocument("users", userId);
  if (!userData) return console.log(`⚠️ Utilisateur introuvable : ${userId}`);

  const response = await callCloudFunction("generateMenuPDF", { user: userData });
  if (response.status === "success") {
    await updateDocument("users", userId, { lastPDFGenerated: new Date() });
  }
};

module.exports = { callCloudFunction, generateMenuPDF };
