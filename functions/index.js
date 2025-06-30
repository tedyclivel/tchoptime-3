const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

exports.sendShoppingListEmail = functions.https.onRequest(async (req, res) => {
  // Configuration du transport
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.pass,
    },
  });

  // Options de l'email
  const mailOptions = {
    from: "tchoptime <noxcipher1@gmail.com>",
    to: "destinataire@example.com",
    subject: "Votre liste de courses",
    text: "Voici votre liste de courses.",
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Email envoyé !");
  } catch (error) {
    console.error("Erreur envoi mail :", error);
    res.status(500).send("Erreur lors de l'envoi de l'email");
  }
});
