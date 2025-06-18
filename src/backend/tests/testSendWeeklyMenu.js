const { sendWeeklyMenu } = require("../functions/sendWeeklyMenu");

// 🔥 Simulation d'une requête HTTP valide
const mockRequest = {
  body: {
    userId: "testUser"
  }
};

// 🔥 Simulation de l'objet `res` pour tester la réponse
const mockResponse = {
  status: function (code) {
    this.statusCode = code;
    return this;
  },
  send: function (data) {
    this.data = data;
    console.log("🚀 Réponse du serveur :", data);
  }
};

// 🔥 Exécuter le test
(async () => {
  console.log("🚀 Test : Envoi du menu hebdomadaire");
  await sendWeeklyMenu(mockRequest, mockResponse);
})();
