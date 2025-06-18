const gtts = require("gtts");

/**
 * 🔥 Génère un fichier audio à partir d'un texte
 * @param {string} text - Texte à lire
 * @param {string} outputPath - Chemin du fichier de sortie
 */
const generateSpeech = (text, outputPath) => {
  return new Promise((resolve, reject) => {
    const speech = new gtts(text, "fr");
    speech.save(outputPath, (err) => {
      if (err) reject(err);
      else resolve(outputPath);
    });
  });
};

module.exports = generateSpeech;
