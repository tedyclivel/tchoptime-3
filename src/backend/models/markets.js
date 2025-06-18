const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 🔥 Récupère la liste des marchés disponibles
 */
const getMarkets = async () => {
  const marketsRef = db.collection("markets");
  const snapshot = await marketsRef.get();
  const marketList = [];
  snapshot.forEach(doc => marketList.push(doc.data()));
  return marketList;
};

/**
 * 🔥 Ajoute un nouveau marché
 * @param {Object} marketData - Informations du marché (nom, localisation, prix)
 */
const addMarket = async (marketData) => {
  const marketRef = db.collection("markets").doc();
  await marketRef.set(marketData);
  console.log(`✅ Marché ajouté : ${marketData.name}`);
};

module.exports = { getMarkets, addMarket };
