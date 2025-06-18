const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "noxcipher1@gmail.com",
    pass: "eganhkr3.0"
  }
});

module.exports = transporter;
