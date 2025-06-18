/**
 * 🔥 Convertit une date en format Firestore (YYYY-MM-DD)
 * @param {Date} date - Date à formater
 * @returns {string} - Date formatée
 */
const formatDate = (date) => {
  return date.toISOString().split("T")[0]; // Ex : "2025-06-16"
};

/**
 * 🔥 Convertit un timestamp Firestore en format lisible
 * @param {number} timestamp - Timestamp en millisecondes
 * @returns {string} - Date formatée
 */
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString("fr-FR", { timeZone: "Africa/Douala" });
};

module.exports = { formatDate, formatTimestamp };
