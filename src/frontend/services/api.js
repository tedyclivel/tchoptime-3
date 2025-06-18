import axios from 'axios';

const API_BASE_URL = "http://localhost:8081"; // 🔥 Mets l’URL du backend si déployé

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const getUserPreferences = async (userId) => {
  try {
    const response = await api.get(`/userPreferences/${userId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Erreur API :", error);
    return null;
  }
};
export const getRecipeImages = async () => {
  try {
    const response = await api.get("/getRecipeImages"); // 🔥 Endpoint à implémenter dans le backend
    return response.data; // Retourne une liste d'URLs d'images
  } catch (error) {
    console.error("❌ Erreur API :", error);
    return [];
  }
};
