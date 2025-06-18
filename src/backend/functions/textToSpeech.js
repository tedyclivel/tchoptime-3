const gtts = require("gtts");

/**
 * 🔥 Génère un fichier audio pour lire la liste de courses
 * @param {string} text - Texte à lire
 */
exports.textToSpeech = (req, res) => {
  const { text } = req.body;
  const speech = new gtts(text, "fr");
  const filePath = `./audios/shopping_list.mp3`;

  speech.save(filePath, (err) => {
    if (err) res.status(500).send({ success: false, message: "Erreur TTS", error: err });
    else res.status(200).send({ success: true, message: "Audio généré", path: filePath });
  });
};
