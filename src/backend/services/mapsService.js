const axios = require("axios");

const GOOGLE_MAPS_API_KEY = "AIzaSyDqJtH6hpF1i1ct9qHzKsqHh4wzMwZTzfw";

/**
 * 🔥 Recherche les marchés les plus proches d'un utilisateur
 * @param {number} lat - Latitude de l'utilisateur
 * @param {number} lng - Longitude de l'utilisateur
 * @returns {Array} - Liste des marchés les plus proches
 */
const getNearbyMarkets = async (lat, lng) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=store&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    return response.data.results.map(market => ({
      name: market.name,
      location: market.geometry.location
    }));
  } catch (error) {
    console.error("❌ Erreur API Google Maps :", error);
    return [];
  }
};

module.exports = getNearbyMarkets;
