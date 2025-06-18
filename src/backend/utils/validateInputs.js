/**
 * 🔹 Vérifie si une valeur est un nombre valide
 */
const isValidNumber = (value) => {
  return typeof value === "number" && !isNaN(value);
};

/**
 * 🔹 Vérifie si un texte est une chaîne de caractères valide
 */
const isValidString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

/**
 * 🔹 Vérifie si une liste contient uniquement des objets valides
 */
const isValidArrayOfObjects = (list) => {
  return Array.isArray(list) && list.every(item => typeof item === "object" && item !== null);
};

/**
 * 🔹 Vérifie si une valeur est un objet JSON valide
 */
const isValidObject = (value) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

module.exports = { isValidNumber, isValidString, isValidArrayOfObjects, isValidObject };
