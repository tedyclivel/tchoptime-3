import { Platform } from 'react-native';
import { configService } from './configService';
import Geolocation from '@react-native-community/geolocation';
import { firestore } from '../../backend/firebase';
import { auth } from '../../backend/firebase';
import { shoppingListService } from './shoppingListService';
import { stockService } from './stockService';

/**
 * 📍 Service de géolocalisation
 */
export class LocationService {
  constructor() {
    this.config = configService.getLocationConfig();
  }

  /**
   * 📍 Demande la permission de géolocalisation
   * @returns {Promise<boolean>} - True si la permission est accordée
   */
  async requestPermission() {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Geolocation.requestAuthorization('whenInUse');
        return status === 'granted';
      }
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permission:', error);
      throw error;
    }
  }

  /**
   * 📍 Récupère la position actuelle
   * @returns {Promise<{latitude: number, longitude: number}>} - Coordonnées
   */
  async getCurrentPosition() {
    try {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          error => reject(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la position:', error);
      throw error;
    }
  }

  /**
   * 📍 Sauvegarde la position dans Firestore
   * @param {Object} position - Coordonnées
   * @returns {Promise<void>}
   */
  async savePosition(position) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          lastKnownPosition: position,
          positionUpdatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la position:', error);
      throw error;
    }
  }

  /**
   * 📍 Recherche les marchés proches
   * @param {Object} position - Coordonnées
   * @param {number} radius - Rayon de recherche en mètres
   * @returns {Promise<Object[]>} - Liste des marchés
   */
  async searchNearbyMarkets(position, radius = 5000) {
    try {
      const markets = await firestore()
        .collection('markets')
        .where('location', 'near', position, radius)
        .get();

      return markets.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la recherche des marchés:', error);
      throw error;
    }
  }

  /**
   * 📍 Calcule la distance entre deux points
   * @param {Object} point1 - Point 1
   * @param {Object} point2 - Point 2
   * @returns {number} - Distance en mètres
   */
  calculateDistance(point1, point2) {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 📍 Optimise l'itinéraire pour une liste de courses
   * @param {Object[]} markets - Liste des marchés
   * @param {Object} items - Liste des items à acheter
   * @returns {Promise<{route: Object[], totalDistance: number}>} - Itinéraire optimisé
   */
  async optimizeShoppingRoute(markets, items) {
    try {
      // Algorithme d'optimisation basé sur la distance et la disponibilité des items
      const optimizedRoute = [];
      let currentMarket = null;
      let totalDistance = 0;
      const remainingItems = [...items];

      while (remainingItems.length > 0) {
        let bestMarket = null;
        let minDistance = Infinity;

        for (const market of markets) {
          // Calculer la distance depuis le marché actuel ou depuis la position initiale
          const from = currentMarket ? currentMarket.location : this.config.homeLocation;
          const distance = this.calculateDistance(from, market.location);

          // Vérifier si ce marché est le meilleur choix pour les items restants
          const availableItems = market.items.filter(item => 
            remainingItems.some(ri => ri.name === item.name)
          );

          if (availableItems.length > 0 && distance < minDistance) {
            minDistance = distance;
            bestMarket = market;
          }
        }

        if (bestMarket) {
          // Ajouter le marché à l'itinéraire
          optimizedRoute.push(bestMarket);
          totalDistance += minDistance;
          
          // Retirer les items disponibles dans ce marché
          remainingItems = remainingItems.filter(item => 
            !bestMarket.items.some(marketItem => marketItem.name === item.name)
          );
          
          // Mettre à jour le marché actuel
          currentMarket = bestMarket;
        }
      }

      return {
        route: optimizedRoute,
        totalDistance: totalDistance
      };
    } catch (error) {
      console.error('Erreur lors de l\'optimisation de l\'itinéraire:', error);
      throw error;
    }
  }

  /**
   * 📍 Vérifie si la géolocalisation est activée
   * @returns {Promise<boolean>} - True si la géolocalisation est activée
   */
  async isLocationEnabled() {
    try {
      const position = await this.getCurrentPosition();
      return position !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 📍 Formate les coordonnées en adresse
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<string>} - Adresse formatée
   */
  async formatCoordinates(latitude, longitude) {
    try {
      const apiKey = configService.get('openrouteservice', 'apiKey');
      
      const response = await fetch(
        `https://api.openrouteservice.org/v2/geocode/reverse?api_key=${apiKey}&lat=${latitude}&lon=${longitude}`
      );

      const data = await response.json();
      return data.features[0].properties.label;
    } catch (error) {
      console.error('❌ Erreur lors du formatage des coordonnées:', error);
      throw error;
    }
  }

  /**
   * 📍 Génère une liste de courses optimisée
   * @param {Object[]} items - Liste des articles à acheter
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<{markets: Object[], optimizedList: Object[]}>} - Liste optimisée
   */
  async generateOptimizedShoppingList(items, latitude, longitude) {
    try {
      // Recherche des marchés proches
      const markets = await this.findNearbyMarkets(latitude, longitude);

      // Groupe les articles par catégorie
      const categories = {};
      items.forEach(item => {
        const category = item.category.toLowerCase();
        if (!categories[category]) categories[category] = [];
        categories[category].push(item);
      });

      // Calcule le marché le plus proche pour chaque catégorie
      const optimizedList = Object.entries(categories).map(([category, items]) => {
        const market = markets.find(m => m.categories.includes(category));
        return {
          category,
          items,
          market: market || markets[0],
          distance: this.calculateDistance({ latitude, longitude }, { latitude: market.coordinates[1], longitude: market.coordinates[0] }),
        };
      });

      // Trie la liste par distance
      optimizedList.sort((a, b) => a.distance - b.distance);

      return { markets, optimizedList };
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la liste optimisée:', error);
      throw error;
    }
  }
}

// Export singleton
export const locationService = new LocationService();
