import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { configService } from './configService';
import { storage } from '../../backend/firebase';

/**
 * 📸 Service de gestion des images
 */
export class ImageService {
  constructor() {
    this.config = configService.getAll();
  }

  /**
   * 📸 Vérifie les permissions pour l'accès à la galerie
   * @returns {Promise<boolean>} - True si les permissions sont accordées
   */
  async checkPermissions() {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  }

  /**
   * 📸 Demande les permissions pour l'accès à la galerie
   * @returns {Promise<boolean>} - True si les permissions sont accordées
   */
  async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  }

  /**
   * 📸 Ouvre la galerie pour sélectionner une image
   * @returns {Promise<Object>} - Informations sur l'image sélectionnée
   */
  async pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        return {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la sélection de l\'image:', error);
      throw error;
    }
  }

  /**
   * 📸 Ouvre l'appareil photo
   * @returns {Promise<Object>} - Informations sur l'image prise
   */
  async takePhoto() {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        return {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la prise de photo:', error);
      throw error;
    }
  }

  /**
   * 📸 Upload une image vers Firebase Storage
   * @param {string} uri - URI de l'image
   * @param {string} type - Type d'image (profile, recipe, etc.)
   * @param {string} id - ID de l'utilisateur ou de la recette
   * @returns {Promise<string>} - URL de l'image uploadée
   */
  async uploadImage(uri, type, id) {
    try {
      // Génère un nom unique pour l'image
      const filename = `${type}_${id}_${Date.now()}.jpg`;
      const ref = storage.ref(`images/${type}/${filename}`);

      // Upload l'image
      const response = await fetch(uri);
      const blob = await response.blob();
      await ref.put(blob);

      // Récupère l'URL de l'image
      const url = await ref.getDownloadURL();

      return url;
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload de l\'image:', error);
      throw error;
    }
  }

  /**
   * 📸 Supprime une image de Firebase Storage
   * @param {string} url - URL de l'image
   * @returns {Promise<void>}
   */
  async deleteImage(url) {
    try {
      const ref = storage.refFromURL(url);
      await ref.delete();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'image:', error);
      throw error;
    }
  }

  /**
   * 📸 Récupère l'image de profil d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} - URL de l'image de profil
   */
  async getProfileImage(userId) {
    try {
      const ref = storage.ref(`images/profile/${userId}_profile.jpg`);
      return await ref.getDownloadURL();
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'image de profil:', error);
      return null;
    }
  }

  /**
   * 📸 Récupère l'image d'une recette
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<string>} - URL de l'image de la recette
   */
  async getRecipeImage(recipeId) {
    try {
      const ref = storage.ref(`images/recipes/${recipeId}_recipe.jpg`);
      return await ref.getDownloadURL();
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'image de recette:', error);
      return null;
    }
  }

  /**
   * 📸 Génère une miniature d'une image
   * @param {string} uri - URI de l'image
   * @param {number} width - Largeur de la miniature
   * @param {number} height - Hauteur de la miniature
   * @returns {Promise<string>} - URI de la miniature
   */
  async generateThumbnail(uri, width = 100, height = 100) {
    try {
      const result = await ImagePicker.compressImageAsync({
        uri,
        width,
        height,
        quality: 0.5,
      });

      return result.uri;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la miniature:', error);
      throw error;
    }
  }

  /**
   * 📸 Convertit une image en base64
   * @param {string} uri - URI de l'image
   * @returns {Promise<string>} - Image en base64
   */
  async convertToBase64(uri) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Erreur lors de la conversion en base64:', error);
      throw error;
    }
  }

  /**
   * 📸 Valide une image
   * @param {Object} image - Informations sur l'image
   * @returns {boolean} - True si l'image est valide
   */
  validateImage(image) {
    const maxSize = this.config.performance.maxCacheSize * 1024 * 1024; // MB to bytes
    const maxWidth = 2000;
    const maxHeight = 2000;

    if (!image || !image.uri) return false;

    const size = image.size || 0;
    const width = image.width || 0;
    const height = image.height || 0;

    return size <= maxSize && width <= maxWidth && height <= maxHeight;
  }

  /**
   * 📸 Formate l'URL d'une image
   * @param {string} url - URL de l'image
   * @returns {string} - URL formatée
   */
  formatImageUrl(url) {
    return url?.replace(/\?.*/, ''); // Supprime les paramètres de l'URL
  }
}

// Export singleton
export const imageService = new ImageService();
