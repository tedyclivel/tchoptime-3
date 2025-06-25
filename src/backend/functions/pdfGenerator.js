const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

admin.initializeApp();

/**
 * 🔥 Génère un PDF pour une recette
 * @param {Object} data - Données de la recette
 * @param {string} data.recipeId - ID de la recette
 * @returns {Promise<Buffer>} - Buffer du PDF généré
 */
exports.generateRecipePDF = functions.https.onCall(async (data) => {
  try {
    const db = admin.firestore();
    const recipe = await db.collection('recipes').doc(data.recipeId).get();
    
    if (!recipe.exists) {
      throw new Error('Recette non trouvée');
    }

    // Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    // Ajouter le titre
    page.drawText(recipe.data().name, {
      x: 50,
      y: height - 50,
      size: 24,
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });

    // Ajouter les ingrédients
    page.drawText('Ingrédients:', {
      x: 50,
      y: height - 100,
      size: 16,
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });

    let y = height - 130;
    recipe.data().ingredients.forEach((ingredient, index) => {
      page.drawText(`${index + 1}. ${ingredient.name} - ${ingredient.quantity}${ingredient.unit}`, {
        x: 50,
        y,
        size: 12,
      });
      y -= 20;
    });

    // Ajouter les instructions
    page.drawText('Instructions:', {
      x: 50,
      y,
      size: 16,
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });

    y -= 30;
    recipe.data().instructions.forEach((step, index) => {
      page.drawText(`${index + 1}. ${step}`, {
        x: 50,
        y,
        size: 12,
      });
      y -= 20;
    });

    // Générer le PDF
    const pdfBytes = await pdfDoc.save();
    
    return pdfBytes;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 🔥 Génère un PDF pour une liste de courses
 * @param {Object} data - Données de la liste
 * @param {string[]} data.items - Liste des articles
 * @returns {Promise<Buffer>} - Buffer du PDF généré
 */
exports.generateShoppingListPDF = functions.https.onCall(async (data) => {
  try {
    // Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    // Ajouter le titre
    page.drawText('Liste de Courses', {
      x: 50,
      y: height - 50,
      size: 24,
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });

    // Ajouter les catégories
    let y = height - 100;
    const categories = {
      fruits: [],
      vegetables: [],
      meats: [],
      dairy: [],
      beverages: [],
      pantry: [],
      frozen: [],
      other: [],
    };

    // Classer les articles par catégorie
    data.items.forEach(item => {
      const category = item.category.toLowerCase();
      if (categories[category]) {
        categories[category].push(item);
      } else {
        categories.other.push(item);
      }
    });

    // Ajouter chaque catégorie au PDF
    Object.entries(categories).forEach(async ([category, items]) => {
      if (items.length === 0) return;

      page.drawText(category.charAt(0).toUpperCase() + category.slice(1), {
        x: 50,
        y: y,
        size: 16,
        font: await pdfDoc.embedFont('Helvetica-Bold'),
      });

      y -= 30;
      items.forEach((item, index) => {
        page.drawText(`${index + 1}. ${item.name} - ${item.quantity}${item.unit}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 20;
      });
      y -= 20;
    });

    // Générer le PDF
    const pdfBytes = await pdfDoc.save();
    
    return pdfBytes;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
