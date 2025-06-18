const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Peut être remplacé par SendGrid, Mailgun, etc.
  auth: {
    user: "noxcipher1@gmail.com",
    pass: "eganhkr3.0"
  }
});

/**
 * 🔥 Envoi d'un email avec pièce jointe (ex : menu PDF)
 * @param {string} to - Email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} text - Message
 * @param {string} attachmentPath - Chemin du fichier PDF
 */
const sendEmail = async (to, subject, text, attachmentPath) => {
  try {
    const mailOptions = {
      from: "noxcipher1@gmail.com",
      to,
      subject,
      text,
      attachments: [{ path: attachmentPath }]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${to}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
  }
};

module.exports = sendEmail;
