/**
 * 🔥 Normalise les chaînes de caractères (retire espaces et caractères spéciaux)
 * @param {string} str - Texte à nettoyer
 * @returns {string} - Texte normalisé
 */
const normalizeString = (str) => {
  return str.trim().replace(/[^a-zA-Z0-9]/g, "_");
};

/**
 * 🔥 Transforme un nombre en décimal limité à 2 chiffres après la virgule
 * @param {number} num - Nombre à arrondir
 * @returns {number} - Nombre arrondi
 */
const normalizePrice = (num) => {
  return parseFloat(num.toFixed(2));
};

module.exports = { normalizeString, normalizePrice };
