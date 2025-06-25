const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');

admin.initializeApp();

// Configuration OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * 🔥 Génère une nouvelle recette basée sur les préférences
 * @param {Object} data - Données de génération
 * @param {string[]} data.ingredients - Ingrédients disponibles
 * @param {string[]} data.preferences - Préférences alimentaires
 * @param {string} data.cuisine - Cuisine souhaitée
 * @returns {Promise<Object>} - Recette générée
 */
exports.generateRecipe = functions.https.onCall(async (data) => {
  try {
    const prompt = `Crée une recette originale avec les ingrédients suivants: ${data.ingredients.join(', ')}. 
    Style de cuisine: ${data.cuisine}. Préférences: ${data.preferences.join(', ')}. 
    Format: {name: string, description: string, ingredients: [{name: string, quantity: number, unit: string}], instructions: string[]}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const recipe = JSON.parse(completion.data.choices[0].message.content);
    
    // Sauvegarder la recette dans Firestore
    const db = admin.firestore();
    const newRecipe = await db.collection('recipes').add({
      ...recipe,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedByAI: true,
    });

    return { recipeId: newRecipe.id, ...recipe };
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la recette:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 🔥 Génère une critique constructive pour une recette
 * @param {Object} data - Données de la recette
 * @param {string} data.recipeId - ID de la recette
 * @param {number} data.rating - Note de la recette
 * @returns {Promise<string>} - Critique générée
 */
exports.generateRecipeReview = functions.https.onCall(async (data) => {
  try {
    const db = admin.firestore();
    const recipe = await db.collection('recipes').doc(data.recipeId).get();

    if (!recipe.exists) {
      throw new Error('Recette non trouvée');
    }

    const prompt = `Analyse la recette suivante et donne une critique constructive basée sur la note ${data.rating}/5:
    ${JSON.stringify(recipe.data())}
    Format: {positives: string[], negatives: string[], suggestions: string[]}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const review = JSON.parse(completion.data.choices[0].message.content);
    
    // Sauvegarder la critique
    await db.collection('reviews').add({
      ...review,
      recipeId: data.recipeId,
      rating: data.rating,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return review;
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la critique:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 🔥 Génère un script pour un tutoriel vidéo
 * @param {Object} data - Données de la recette
 * @param {string} data.recipeId - ID de la recette
 * @returns {Promise<string>} - Script du tutoriel
 */
exports.generateVideoTutorial = functions.https.onCall(async (data) => {
  try {
    const db = admin.firestore();
    const recipe = await db.collection('recipes').doc(data.recipeId).get();

    if (!recipe.exists) {
      throw new Error('Recette non trouvée');
    }

    const prompt = `Crée un script pour un tutoriel vidéo de la recette suivante:
    ${JSON.stringify(recipe.data())}
    Format: {title: string, introduction: string, steps: string[], conclusion: string}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const tutorial = JSON.parse(completion.data.choices[0].message.content);
    
    // Sauvegarder le script
    await db.collection('tutorials').add({
      ...tutorial,
      recipeId: data.recipeId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return tutorial;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du tutoriel:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 🔎 Recherche les marchés les plus proches
 * @param {Object} data - Données de localisation
 * @param {number} data.latitude - Latitude
 * @param {number} data.longitude - Longitude
 * @returns {Promise<Object[]>} - Liste des marchés proches
 */
exports.findNearbyMarkets = functions.https.onCall(async (data) => {
  try {
    const response = await axios.get('https://api.openrouteservice.org/v2/places', {
      params: {
        api_key: process.env.OPENROUTESERVICE_API_KEY,
        request: 'pois',
        radius: 5000,
        lat: data.latitude,
        lon: data.longitude,
        categories: 'market,supermarket,convenience',
      },
    });

    const markets = response.data.features.map(feature => ({
      name: feature.properties.name,
      address: feature.properties.address,
      distance: feature.properties.distance,
      opening_hours: feature.properties.opening_hours,
      coordinates: feature.geometry.coordinates,
    }));

    return markets;
  } catch (error) {
    console.error('❌ Erreur lors de la recherche des marchés:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
