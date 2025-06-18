const axios = require("axios");
const GOOGLE_MAPS_API_KEY = "AIzaSyDqJtH6hpF1i1ct9qHzKsqHh4wzMwZTzfw";

/**
 * 🔥 Recherche les marchés proches
 * @param {number} lat - Latitude utilisateur
 * @param {number} lng - Longitude utilisateur
 */
exports.fetchNearbyMarkets = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=store&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    res.status(200).send({ success: true, markets: response.data.results });
  } catch (error) {
    res.status(500).send({ success: false, message: "Erreur Google Maps API", error });
  }
};
