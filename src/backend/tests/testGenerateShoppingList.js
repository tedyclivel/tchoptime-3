const { generateShoppingList } = require("../functions/generateShoppingList");

// 🔥 Simulation d'une requête HTTP valide
const mockRequest = {
  body: {
    userId: "testUser",
    weekMeals: [
      { day: "Monday", ingredients: ["tomates", "riz"] },
      { day: "Tuesday", ingredients: ["poulet", "oignons"] }
    ]
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
  console.log("🚀 Test : Génération de la liste de courses");
  await generateShoppingList(mockRequest, mockResponse);
})();
