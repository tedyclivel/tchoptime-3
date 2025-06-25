import { getDocument, updateDocument } from '../backend/services/firestoreService';
import { auth } from '../../backend/firebase';

/**
 * 🔥 Récupère le profil utilisateur actuel
 * @returns {Promise<Object>} - Données du profil utilisateur
 */
export const getUserProfile = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;
    
    const profile = await getDocument('users', userId);
    return profile || {};
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    return null;
  }
};

/**
 * 🔥 Met à jour le profil utilisateur
 * @param {Object} profileData - Données du profil à mettre à jour
 * @param {string} profileData.displayName - Nom d'affichage
 * @param {string} profileData.photoURL - URL de la photo de profil
 * @param {Object} profileData.familyMembers - Membres de la famille
 * @returns {Promise<void>}
 */
export const updateProfile = async (profileData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    await updateDocument('users', userId, {
      ...profileData,
      updatedAt: new Date().toISOString(),
    });

    // Mettre à jour le displayName dans Firebase Auth
    if (profileData.displayName) {
      await auth.currentUser?.updateProfile({ displayName: profileData.displayName });
    }

    console.log('✅ Profil mis à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};

/**
 * 🔥 Ajoute ou met à jour un membre de la famille
 * @param {Object} memberData - Données du membre
 * @param {string} memberData.name - Nom du membre
 * @param {string} memberData.alias - Surnom
 * @param {string} memberData.universe - Préférences alimentaires
 * @param {number} memberData.age - Âge
 * @param {string} memberData.gender - Sexe
 * @param {number} memberData.consumptionFactor - Facteur de consommation
 * @returns {Promise<void>}
 */
export const updateFamilyMember = async (memberData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const profile = await getUserProfile();
    const members = profile?.familyMembers || [];
    const existingMember = members.find(m => m.id === memberData.id);

    const updatedMembers = existingMember
      ? members.map(m => (m.id === memberData.id ? memberData : m))
      : [...members, { ...memberData, id: memberData.id || Date.now().toString() }];

    await updateDocument('users', userId, {
      familyMembers: updatedMembers,
    });

    console.log('✅ Membre de la famille mis à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du membre:', error);
    throw error;
  }
};

/**
 * 🔥 Supprime un membre de la famille
 * @param {string} memberId - ID du membre à supprimer
 * @returns {Promise<void>}
 */
export const deleteFamilyMember = async (memberId) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const profile = await getUserProfile();
    const members = profile?.familyMembers || [];
    const updatedMembers = members.filter(m => m.id !== memberId);

    await updateDocument('users', userId, {
      familyMembers: updatedMembers,
    });

    console.log('✅ Membre de la famille supprimé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du membre:', error);
    throw error;
  }
};
