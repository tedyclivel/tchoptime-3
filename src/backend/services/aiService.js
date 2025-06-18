const callCloudFunction = require("./cloudFunctionsService").callCloudFunction;

/**
 * 🔥 Analyse nutritionnelle d'un menu via IA
 * @param {Object} menuData - Données des repas
 */
const analyzeNutrition = async (menuData) => {
  const response = await callCloudFunction("aiAnalysis", { menu: menuData });
  console.log(`💡 Analyse IA :`, response.result);
  return response.result;
};

/**
 * 🔥 Génération automatique d'un tutoriel vidéo pour une recette
 * @param {string} recipeId - ID de la recette
 */
const generateRecipeVideo = async (recipeId) => {
  const response = await callCloudFunction("generateRecipeVideo", { recipeId });
  console.log(`🎥 Vidéo générée pour ${recipeId} :`, response.result);
  return response.result;
};

module.exports = { analyzeNutrition, generateRecipeVideo };
