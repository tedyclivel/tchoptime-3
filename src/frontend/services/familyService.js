import { getDocument, updateDocument } from '../backend/services/firestoreService';
import { auth } from '../../backend/firebase';

/**
 * 🔥 Récupère la configuration initiale de la famille
 * @returns {Promise<Object>} - Configuration de la famille
 */
export const getFamilyConfig = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;

    const profile = await getDocument('users', userId);
    return profile?.familyConfig || {
      members: [],
      consumptionFactors: {},
      isConfigured: false,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la configuration familiale:', error);
    return null;
  }
};

/**
 * 🔥 Met à jour la configuration initiale de la famille
 * @param {Object} configData - Données de configuration à mettre à jour
 * @param {Object[]} configData.members - Liste des membres
 * @param {Object} configData.consumptionFactors - Facteurs de consommation par tranche d'âge
 * @returns {Promise<void>}
 */
export const updateFamilyConfig = async (configData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    await updateDocument('users', userId, {
      familyConfig: {
        ...configData,
        isConfigured: true,
        lastUpdated: new Date().toISOString(),
      },
    });

    console.log('✅ Configuration familiale mise à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la configuration familiale:', error);
    throw error;
  }
};

/**
 * 🔥 Calcule les facteurs de consommation par défaut
 * @param {number} age - Âge du membre
 * @returns {number} - Facteur de consommation
 */
export const calculateDefaultConsumptionFactor = (age) => {
  if (age < 2) return 0.5; // Bébé
  if (age < 6) return 0.75; // Petit enfant
  if (age < 12) return 0.9; // Enfant
  if (age < 18) return 1.1; // Adolescent
  if (age < 60) return 1.0; // Adulte
  return 0.85; // Sénior
};

/**
 * 🔥 Vérifie si la configuration familiale est complète
 * @param {Object} config - Configuration familiale
 * @returns {boolean} - True si la configuration est complète
 */
export const isFamilyConfigComplete = (config) => {
  if (!config?.isConfigured) return false;
  
  // Vérifier que tous les membres ont un facteur de consommation
  const hasAllConsumptionFactors = config.members.every(member =>
    config.consumptionFactors[member.age] !== undefined
  );

  return hasAllConsumptionFactors;
};

/**
 * 🔥 Calcule le facteur total de consommation pour la famille
 * @param {Object} config - Configuration familiale
 * @returns {number} - Facteur total de consommation
 */
export const calculateTotalConsumptionFactor = (config) => {
  if (!config?.members?.length) return 1.0;

  return config.members.reduce((total, member) => {
    const factor = config.consumptionFactors[member.age] || 
      calculateDefaultConsumptionFactor(member.age);
    return total + factor;
  }, 0);
};
