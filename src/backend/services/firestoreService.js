const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 🔥 Récupère un document Firestore
 * @param {string} collection - Nom de la collection
 * @param {string} docId - ID du document
 * @returns {Object} - Données du document
 */
const getDocument = async (collection, docId) => {
  const docRef = db.collection(collection).doc(docId);
  const docSnapshot = await docRef.get();
  return docSnapshot.exists ? docSnapshot.data() : null;
};

/**
 * 🔥 Ajoute ou met à jour un document dans Firestore
 * @param {string} collection - Nom de la collection
 * @param {string} docId - ID du document
 * @param {Object} data - Données à insérer
 */
const updateDocument = async (collection, docId, data) => {
  await db.collection(collection).doc(docId).set(data, { merge: true });
  console.log(`✅ Document mis à jour : ${collection}/${docId}`);
};

module.exports = { getDocument, updateDocument };
