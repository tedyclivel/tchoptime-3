// src/screens/Recipes/RecipesScreen.tsx (MIS À JOUR - Amélioration UI/UX IA avec prévisualisation)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecipesStackParamList } from '../../navigation/RecipesStackNavigator';
import { useAuth } from '../../context/AuthContext';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

interface Recipe {
  id: string;
  name: string;
  image: any; // Peut être un require() pour local ou une URI pour Firebase Storage
  description?: string;
  time: string; // Ex: "30 min"
  difficulty: string; // Ex: "Facile", "Moyenne", "Difficile"
  rating: number; // Ex: 4.5
  ingredients: string[]; // Simplifié pour le moment
  steps: string[]; // Simplifié pour le moment
  category?: string;
  prepTime?: string; // Temps de préparation (estimé par IA ou manuel)
  cookTime?: string; // Temps de cuisson (estimé par IA ou manuel)
  isUserRecipe?: boolean; // Pour distinguer des DUMMY_RECIPES
  isAIGenerated?: boolean; // Si la recette a été générée par IA
  userId?: string; // UID de l'utilisateur qui a ajouté/généré la recette
  createdAt?: FirebaseFirestoreTypes.FieldValue;
  updatedAt?: FirebaseFirestoreTypes.FieldValue;
}

export const DUMMY_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Poulet Yassa Express',
    image: require('../../assets/images/top_recipe1.jpg'),
    time: '30 min',
    difficulty: 'Facile',
    rating: 4.5,
    ingredients: ['1 poulet', '2 oignons', 'Moutarde', 'Citron', 'Ail', 'Riz'],
    steps: ['Couper le poulet', 'Mariner', 'Cuire les oignons', 'Ajouter le poulet', 'Servir avec du riz'],
  },
  {
    id: '2',
    name: 'Mafé Végétarien',
    image: require('../../assets/images/top_recipe2.jpg'),
    time: '45 min',
    difficulty: 'Moyenne',
    rating: 4.2,
    ingredients: ['Pâte d\'arachide', 'Légumes variés', 'Tomates', 'Concentré de tomates', 'Riz'],
    steps: ['Préparer la sauce', 'Ajouter les légumes', 'Laisser mijoter', 'Servir chaud'],
  },
  {
    id: '3',
    name: 'Beignets de Banane Plantain',
    image: require('../../assets/images/top_recipe3.jpg'),
    time: '20 min',
    difficulty: 'Facile',
    rating: 4.7,
    ingredients: ['Bananes plantains mûres', 'Farine', 'Sucre', 'Levure', 'Huile de friture'],
    steps: ['Écraser les bananes', 'Mélanger les ingrédients', 'Frire jusqu\'à dorer', 'Égoutter'],
  },
  {
    id: '4',
    name: 'Poisson Braisé Camerounais',
    image: require('../../assets/images/recipe_of_the_day.jpg'),
    time: '60 min',
    difficulty: 'Difficile',
    rating: 4.9,
    ingredients: ['Poisson frais', 'Épices camerounaises', 'Oignons', 'Tomates', 'Piment', 'Plantain/Manioc'],
    steps: ['Préparer la marinade', 'Badigeonner le poisson', 'Braiser au charbon', 'Servir avec accompagnement'],
  },
];

const CATEGORIES = [
  'Africaines', 'Européennes', 'Asiatiques', 'Desserts', 'Boissons', 'Véganes', 'Sans gluten', 'Rapides', 'Budget',
];

type RecipesScreenProps = NativeStackScreenProps<RecipesStackParamList, 'RecipesList'>;

const RecipesScreen: React.FC<RecipesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(true);

  // États pour la modal d'ajout de recette
  const [showAddRecipeModal, setShowAddRecipeModal] = useState<boolean>(false);
  const [newRecipeName, setNewRecipeName] = useState<string>('');
  const [newRecipeDescription, setNewRecipeDescription] = useState<string>('');
  const [newRecipeIngredients, setNewRecipeIngredients] = useState<string>('');
  const [newRecipeSteps, setNewRecipeSteps] = useState<string>('');
  const [newRecipeTime, setNewRecipeTime] = useState<string>('');
  const [newRecipeDifficulty, setNewRecipeDifficulty] = useState<string>('');
  const [newRecipeCategory, setNewRecipeCategory] = useState<string>('');
  const [newRecipeImageUri, setNewRecipeImageUri] = useState<string | undefined>(undefined);
  const [isSavingRecipe, setIsSavingRecipe] = useState<boolean>(false);
  const [isAIGenerated, setIsAIGenerated] = useState<boolean>(false);
  const [simulatedAIPrompt, setSimulatedAIPrompt] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  // ⭐ Nouveaux états pour la prévisualisation IA ⭐
  const [showAIGeneratedRecipeModal, setShowAIGeneratedRecipeModal] = useState<boolean>(false);
  const [aiGeneratedRecipeData, setAIGeneratedRecipeData] = useState<Recipe | null>(null);


  // Références Firestore et Storage
  const getUserRecipesCollectionRef = () => {
    if (!user?.uid) {
      console.error("User not authenticated to access user recipes collection.");
      return null;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return firestore().collection(`artifacts/${appId}/users/${user.uid}/userRecipes`);
  };

  const getRecipeImageStorageRef = (userId: string, recipeId: string, fileName: string) => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return storage().ref(`artifacts/${appId}/users/${userId}/userRecipes/${recipeId}/${fileName}`);
  };

  // Charger les recettes de l'utilisateur depuis Firestore
  useEffect(() => {
    if (!user?.uid) {
      setIsLoadingRecipes(false);
      setUserRecipes([]);
      return;
    }

    const collectionRef = getUserRecipesCollectionRef();
    if (!collectionRef) return;

    const unsubscribe = collectionRef
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const recipes: Recipe[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Omit<Recipe, 'id'>;
            recipes.push({
              id: doc.id,
              ...data,
              image: typeof data.image === 'string' ? { uri: data.image } : data.image,
              isUserRecipe: true,
            });
          });
          setUserRecipes(recipes);
          setIsLoadingRecipes(false);
        },
        (error) => {
          console.error("Error fetching user recipes: ", error);
          setIsLoadingRecipes(false);
          Alert.alert("Erreur", "Impossible de charger vos recettes personnalisées.");
        }
      );

    return () => unsubscribe();
  }, [user]);

  // Combinaison des DUMMY_RECIPES et des recettes de l'utilisateur
  const allRecipes = [...DUMMY_RECIPES, ...userRecipes];

  const filteredRecipes = allRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Toutes' ||
                            (recipe.category && recipe.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
                            recipe.difficulty.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleChoosePhoto = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Permission de la Galerie Photo',
            message: 'TchopTime a besoin d\'accéder à votre galerie pour choisir une photo de recette.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission refusée', 'L\'accès à la galerie est nécessaire pour choisir une photo.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) {
        console.log('Sélection de photo annulée');
      } else if (response.errorCode) {
        console.log('Erreur ImagePicker: ', response.errorCode);
        Alert.alert('Erreur de Galerie', 'Impossible de choisir une photo. Code: ' + response.errorCode);
      } else if (response.assets && response.assets.length > 0) {
        setNewRecipeImageUri(response.assets[0].uri);
      }
    });
  };

  const handleSimulateAIGeneration = async () => {
    if (simulatedAIPrompt.trim().length === 0) {
      Alert.alert('Erreur', 'Veuillez décrire le type de recette que vous souhaitez générer par IA.');
      return;
    }

    setIsGeneratingAI(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Logique de simulation améliorée
    const prompt = simulatedAIPrompt.toLowerCase();
    let generatedName = "Recette IA Générique";
    let generatedDescription = `Cette recette a été générée par l'IA en fonction de votre demande : "${simulatedAIPrompt}". Elle est prête à être découverte et cuisinée !`;
    let generatedIngredients = ["Ingrédient IA 1 (quantité, unité)", "Ingrédient IA 2 (quantité, unité)", "Ingrédient IA 3 (quantité, unité)"];
    let generatedSteps = ["Étape IA 1: Préparez tous les ustensiles et ingrédients nécessaires.", "Étape IA 2: Suivez les instructions attentivement pour un résultat optimal.", "Étape IA 3: Servez chaud et dégustez !"];
    let generatedTime = "30 min";
    let generatedDifficulty = "Facile";
    let generatedCategory = "IA";

    if (prompt.includes('africain') || prompt.includes('camerounais')) {
      generatedName = `Poulet D.G. revisité IA`;
      generatedDescription = `Une version créative et savoureuse du Poulet D.G. proposée par l'IA, parfaite pour un repas convivial.`;
      generatedIngredients = ["1 poulet (morceaux)", "2 plantains mûrs", "1 oignon", "2 gousses d'ail", "1 morceau de gingembre", "Piment (facultatif)", "Huile végétale", "Sel, poivre"];
      generatedSteps = ["1. Faites frire les morceaux de poulet jusqu'à ce qu'ils soient dorés.", "2. Dans la même huile, faites frire les plantains coupés en rondelles.", "3. Préparez la sauce en mixant oignon, ail, gingembre et piment.", "4. Faites revenir la sauce, ajoutez le poulet et les plantains, laissez mijoter.", "5. Servez chaud, accompagné de riz ou de légumes vapeur."];
      generatedTime = "45 min";
      generatedDifficulty = "Moyenne";
      generatedCategory = "Africaines";
    } else if (prompt.includes('végétarien') || prompt.includes('vegan')) {
      generatedName = `Curry de Lentilles Corail aux Épinards IA`;
      generatedDescription = `Un curry végétarien riche et nutritif, idéal pour un repas équilibré et plein de saveurs, généré par l'IA.`;
      generatedIngredients = ["200g lentilles corail", "400ml lait de coco", "200g épinards frais", "1 oignon", "2 tomates", "1 cuillère à café de curry en poudre", "Huile d'olive", "Sel, coriandre fraîche"];
      generatedSteps = ["1. Faites revenir l'oignon haché dans l'huile.", "2. Ajoutez les tomates concassées, le curry, puis les lentilles et le lait de coco.", "3. Laissez mijoter 15-20 min jusqu'à ce que les lentilles soient tendres.", "4. Incorporez les épinards en fin de cuisson. Salez, et garnissez de coriandre."];
      generatedTime = "35 min";
      generatedDifficulty = "Facile";
      generatedCategory = "Véganes";
    } else if (prompt.includes('rapide')) {
      generatedName = "Salade Composée Express IA";
      generatedDescription = "Une salade fraîche et rapide, parfaite pour un déjeuner léger, concoctée par l'IA en un clin d'œil.";
      generatedIngredients = ["Laitue", "Tomates cerises", "Concombre", "Feta", "Olives", "Vinaigrette"];
      generatedSteps = ["1. Lavez et coupez tous les légumes.", "2. Émiettez la feta et ajoutez les olives.", "3. Assemblez tous les ingrédients dans un grand saladier.", "4. Arrosez de vinaigrette juste avant de servir."];
      generatedTime = "15 min";
      generatedDifficulty = "Très Facile";
      generatedCategory = "Rapides";
    } else if (prompt.includes('dessert')) {
      generatedName = "Mousse au Chocolat Express IA";
      generatedDescription = "Un dessert rapide et gourmand, parfait pour les envies subites de chocolat, généré par l'IA.";
      generatedIngredients = ["200g chocolat noir", "4 œufs", "50g sucre", "Une pincée de sel"];
      generatedSteps = ["1. Faites fondre le chocolat au bain-marie ou au micro-ondes.", "2. Séparez les blancs des jaunes d'œufs. Mélangez les jaunes avec le sucre.", "3. Incorporez le chocolat fondu au mélange jaunes-sucre.", "4. Montez les blancs en neige avec une pincée de sel et incorporez-les délicatement à la préparation au chocolat.", "5. Réfrigérez pendant au moins 2 heures avant de servir."];
      generatedTime = "20 min";
      generatedDifficulty = "Facile";
      generatedCategory = "Desserts";
    }

    const aiRecipe: Recipe = {
      id: 'ai-temp-' + Date.now(), // ID temporaire
      name: generatedName,
      description: generatedDescription,
      ingredients: generatedIngredients,
      steps: generatedSteps,
      time: generatedTime,
      difficulty: generatedDifficulty,
      category: generatedCategory,
      prepTime: generatedTime,
      cookTime: generatedTime,
      rating: 0,
      image: null, // Pas d'image générée par IA pour l'instant
      isUserRecipe: false, // Sera true après confirmation
      isAIGenerated: true,
      userId: user?.uid,
    };
    setAIGeneratedRecipeData(aiRecipe);
    setIsGeneratingAI(false);
    setShowAIGeneratedRecipeModal(true); // Ouvre la modal de prévisualisation
    // Ne réinitialise pas le formulaire principal ici, l'utilisateur peut encore l'utiliser si il annule l'IA
  };

  const handleSaveRecipe = async (recipeToSave?: Recipe) => {
    if (!user?.uid) {
      Alert.alert('Erreur', 'Vous devez être connecté pour ajouter une recette.');
      return;
    }

    // Utilise les données de la modal IA si fournies, sinon les états du formulaire manuel
    const finalRecipeData = recipeToSave || {
      name: newRecipeName.trim(),
      description: newRecipeDescription.trim() || undefined,
      ingredients: newRecipeIngredients.split('\n').map(s => s.trim()).filter(s => s.length > 0),
      steps: newRecipeSteps.split('\n').map(s => s.trim()).filter(s => s.length > 0),
      time: newRecipeTime.trim() || 'N/A',
      difficulty: newRecipeDifficulty.trim() || 'N/A',
      category: newRecipeCategory.trim() || undefined,
      prepTime: newRecipeTime.trim() || undefined,
      cookTime: newRecipeTime.trim() || undefined,
      rating: 0,
      image: newRecipeImageUri || null,
      isUserRecipe: true,
      isAIGenerated: isAIGenerated,
      userId: user.uid,
    };

    if (finalRecipeData.name.trim().length === 0 || finalRecipeData.ingredients.length === 0 || finalRecipeData.steps.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le nom, les ingrédients et les étapes.');
      return;
    }

    setIsSavingRecipe(true);
    let imageUrl: string | null = null;
    let newRecipeDocRef: FirebaseFirestoreTypes.DocumentReference | null = null;

    try {
      const collectionRef = getUserRecipesCollectionRef();
      if (!collectionRef) throw new Error("Collection reference not available.");
      newRecipeDocRef = await collectionRef.doc();

      // Si c'est une recette manuelle avec image ou une recette IA où on ajoute une image après
      if (newRecipeImageUri) {
        const fileName = `recipe_image.jpg`;
        const storageRef = getRecipeImageStorageRef(user.uid, newRecipeDocRef.id, fileName);
        const task = storageRef.putFile(newRecipeImageUri);
        await task;
        imageUrl = await storageRef.getDownloadURL();
        console.log("Image de recette téléchargée, URL:", imageUrl);
      } else if (finalRecipeData.image && typeof finalRecipeData.image === 'string' && finalRecipeData.image.startsWith('http')) {
        // Cas où l'IA aurait pu générer une URL d'image (futur) ou image existe déjà
        imageUrl = finalRecipeData.image;
      }


      await newRecipeDocRef.set({
        ...finalRecipeData, // Copie toutes les propriétés de la recette
        image: imageUrl || null, // Surcharge l'image avec l'URL de Storage
        isUserRecipe: true, // S'assure que c'est une recette utilisateur
        userId: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert('Succès', 'Recette sauvegardée avec succès !');
      setShowAddRecipeModal(false); // Ferme la modal principale
      setShowAIGeneratedRecipeModal(false); // Ferme la modal de prévisualisation IA si ouverte
      resetAddRecipeForm(); // Réinitialise le formulaire
      setAIGeneratedRecipeData(null); // Réinitialise les données IA
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recette:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la recette.');
    } finally {
      setIsSavingRecipe(false);
    }
  };

  // ⭐ Fonctions pour la modal de prévisualisation IA ⭐
  const handleConfirmAddAIGeneratedRecipe = async () => {
    if (aiGeneratedRecipeData) {
      // Assurez-vous que l'image pour la recette IA est nulle ici, car nous n'avons pas d'image IA réelle
      await handleSaveRecipe({ ...aiGeneratedRecipeData, image: null });
    }
  };

  const handleCancelAIGeneratedRecipe = () => {
    setAIGeneratedRecipeData(null);
    setShowAIGeneratedRecipeModal(false);
    // La modal d'ajout manuelle reste ouverte pour permettre à l'utilisateur de continuer
    // ou de générer une autre IA.
  };
  // ⭐ Fin des fonctions pour la modal de prévisualisation IA ⭐


  const resetAddRecipeForm = () => {
    setNewRecipeName('');
    setNewRecipeDescription('');
    setNewRecipeIngredients('');
    setNewRecipeSteps('');
    setNewRecipeTime('');
    setNewRecipeDifficulty('');
    setNewRecipeCategory('');
    setNewRecipeImageUri(undefined);
    setIsAIGenerated(false);
    setSimulatedAIPrompt(''); // Réinitialise le prompt IA
  };

  const renderCategoryPill = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategory === item ? styles.selectedCategoryPill : {},
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryPillText,
          selectedCategory === item ? styles.selectedCategoryPillText : {},
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', item)}
    >
      {item.image ? (
        typeof item.image === 'object' && item.image.uri
          ? <Image source={{ uri: item.image.uri }} style={styles.recipeImage} />
          : <Image source={item.image} style={styles.recipeImage} />
      ) : (
        <View style={styles.noImageIcon}>
          <Icon name="image-off" size={60} color="#AAA" />
          <Text style={styles.noImageText}>Pas d'image</Text>
        </View>
      )}
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.recipeDetails}>{item.time} • {item.difficulty}</Text>
        <Text style={styles.recipeRating}>⭐️ {item.rating}</Text>
        {item.isAIGenerated && <Text style={styles.aiTag}>Généré par IA</Text>}
      </View>
    </TouchableOpacity>
  );

  if (isLoadingRecipes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Chargement des recettes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recettes</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une recette..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter-variant" size={24} color="#FF6F61" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === 'Toutes' ? styles.selectedCategoryPill : {},
            ]}
            onPress={() => setSelectedCategory('Toutes')}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === 'Toutes' ? styles.selectedCategoryPillText : {},
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryPill}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </ScrollView>
      </View>

      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.recipesList}
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Aucune recette trouvée pour cette recherche.</Text>
          </View>
        )}
      />

      {/* Bouton FAB pour ajouter une nouvelle recette */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddRecipeModal(true)}
      >
        <Icon name="plus" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Modal d'ajout/génération de recette */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddRecipeModal}
        onRequestClose={() => setShowAddRecipeModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.modalScrollViewContent}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Ajouter ou Générer une Recette</Text>

              {/* Section Génération IA */}
              <View style={styles.aiGenerationSection}>
                <Text style={styles.inputLabel}>Générer une recette par IA:</Text>
                <TextInput
                  style={styles.textInputAI}
                  placeholder="Ex: plat africain végétarien rapide pour le dîner"
                  placeholderTextColor="#BBB"
                  value={simulatedAIPrompt}
                  onChangeText={setSimulatedAIPrompt}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity
                  style={styles.generateAIButton}
                  onPress={handleSimulateAIGeneration}
                  disabled={isGeneratingAI || isSavingRecipe}
                >
                  {isGeneratingAI ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Icon name="robot" size={20} color="#FFF" style={styles.buttonIcon} />
                      <Text style={styles.generateAIButtonText}>Générer avec l'IA</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.aiHintText}>
                  Décrivez le plat souhaité (ingrédients, type de cuisine, contraintes).
                </Text>
              </View>

              <Text style={styles.orText}>--- OU SAISIR MANUELLEMENT ---</Text>

              {/* Formulaire de saisie manuelle */}
              <Text style={styles.inputLabel}>Nom de la recette:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Poulet D.G. Authentique"
                placeholderTextColor="#999"
                value={newRecipeName}
                onChangeText={setNewRecipeName}
              />

              <Text style={styles.inputLabel}>Description:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Une description rapide de la recette..."
                placeholderTextColor="#999"
                value={newRecipeDescription}
                onChangeText={setNewRecipeDescription}
                multiline
              />

              <Text style={styles.inputLabel}>Ingrédients (un ingrédient par ligne):</Text>
              <TextInput
                style={styles.textInputMultiline}
                placeholder="Ex:\n- 1 poulet\n- 2 oignons\n- Sel, poivre"
                placeholderTextColor="#999"
                value={newRecipeIngredients}
                onChangeText={setNewRecipeIngredients}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Étapes de préparation (une étape par ligne):</Text>
              <TextInput
                style={styles.textInputMultiline}
                placeholder="Ex:\n1. Couper le poulet en morceaux.\n2. Mariner avec sel et poivre."
                placeholderTextColor="#999"
                value={newRecipeSteps}
                onChangeText={setNewRecipeSteps}
                multiline
                numberOfLines={6}
              />

              <Text style={styles.inputLabel}>Temps de préparation (ex: 30 min):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 30 min"
                placeholderTextColor="#999"
                value={newRecipeTime}
                onChangeText={setNewRecipeTime}
              />

              <Text style={styles.inputLabel}>Difficulté (Facile, Moyenne, Difficile):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Facile"
                placeholderTextColor="#999"
                value={newRecipeDifficulty}
                onChangeText={setNewRecipeDifficulty}
              />

              <Text style={styles.inputLabel}>Catégorie (ex: Africaines, Desserts):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Africaines"
                placeholderTextColor="#999"
                value={newRecipeCategory}
                onChangeText={setNewRecipeCategory}
              />

              <Text style={styles.inputLabel}>Photo de la recette:</Text>
              <TouchableOpacity style={styles.selectPhotoButton} onPress={handleChoosePhoto}>
                <Icon name="image-plus" size={24} color="#FFF" />
                <Text style={styles.selectPhotoButtonText}>Choisir une photo</Text>
              </TouchableOpacity>
              {newRecipeImageUri && (
                <Image source={{ uri: newRecipeImageUri }} style={styles.selectedRecipeImage} />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddRecipeModal(false);
                    resetAddRecipeForm();
                  }}
                  disabled={isSavingRecipe}
                >
                  <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveRecipeButton]}
                  onPress={() => handleSaveRecipe()} // Appel sans paramètre, prend les états du formulaire
                  disabled={isSavingRecipe || isLoadingRecipes}
                >
                  {isSavingRecipe ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Sauvegarder Recette</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ⭐ Nouvelle Modal de Prévisualisation de Recette IA ⭐ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAIGeneratedRecipeModal}
        onRequestClose={handleCancelAIGeneratedRecipe}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.aiPreviewModalContainer}>
            <Text style={styles.aiPreviewTitle}>Recette Générée par l'IA</Text>

            {aiGeneratedRecipeData && (
              <ScrollView style={styles.aiPreviewScrollView}>
                <Text style={styles.aiPreviewRecipeName}>{aiGeneratedRecipeData.name}</Text>
                <Text style={styles.aiPreviewDescription}>{aiGeneratedRecipeData.description}</Text>

                <View style={styles.aiPreviewDetailsRow}>
                  <View style={styles.aiPreviewDetailItem}>
                    <Icon name="clock-outline" size={20} color="#555" />
                    <Text style={styles.aiPreviewDetailText}>Temps: {aiGeneratedRecipeData.time}</Text>
                  </View>
                  <View style={styles.aiPreviewDetailItem}>
                    <Icon name="medal-outline" size={20} color="#555" />
                    <Text style={styles.aiPreviewDetailText}>Difficulté: {aiGeneratedRecipeData.difficulty}</Text>
                  </View>
                </View>

                <Text style={styles.aiPreviewSubtitle}>Ingrédients:</Text>
                {aiGeneratedRecipeData.ingredients.map((item, index) => (
                  <Text key={index} style={styles.aiPreviewListItem}>- {item}</Text>
                ))}

                <Text style={styles.aiPreviewSubtitle}>Étapes:</Text>
                {aiGeneratedRecipeData.steps.map((item, index) => (
                  <Text key={index} style={styles.aiPreviewListItem}>{index + 1}. {item}</Text>
                ))}
              </ScrollView>
            )}

            <View style={styles.aiPreviewButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelAIGeneratedRecipe}
                disabled={isSavingRecipe}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveRecipeButton]}
                onPress={handleConfirmAddAIGeneratedRecipe}
                disabled={isSavingRecipe}
              >
                {isSavingRecipe ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Ajouter à mes recettes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
    paddingBottom: 10,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  categoryPill: {
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 5,
  },
  selectedCategoryPill: {
    backgroundColor: '#FF6F61',
  },
  categoryPillText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedCategoryPillText: {
    color: '#FFF',
  },
  recipesList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    overflow: 'hidden',
    width: (width / 2) - 30,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recipeImage: {
    width: '100%',
    height: (width / 2) * 0.8,
    resizeMode: 'cover',
  },
  noImageIcon: {
    width: '100%',
    height: (width / 2) * 0.8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#888',
    marginTop: 5,
  },
  recipeInfo: {
    padding: 10,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recipeDetails: {
    fontSize: 12,
    color: '#666',
  },
  recipeRating: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 5,
  },
  aiTag: {
    fontSize: 10,
    color: '#6A5ACD',
    fontWeight: 'bold',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6F61',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  // Styles pour la Modal d'ajout de recette
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    maxHeight: '95%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    marginTop: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  textInputMultiline: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    backgroundColor: '#F9F9F9',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectPhotoButton: {
    flexDirection: 'row',
    backgroundColor: '#6A5ACD',
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  selectPhotoButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  selectedRecipeImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    resizeMode: 'cover',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CCC',
  },

  aiGenerationSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textInputAI: {
    borderWidth: 1,
    borderColor: '#9CCC65',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    backgroundColor: '#F1F8E9',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  generateAIButton: {
    flexDirection: 'row',
    backgroundColor: '#388E3C',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
  },
  generateAIButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 5,
  },
  aiHintText: {
    fontSize: 12,
    color: '#66BB6A',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },

  orText: {
    textAlign: 'center',
    marginVertical: 15,
    color: '#777',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  saveRecipeButton: {
    backgroundColor: '#FF6F61',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ⭐⭐ Nouveaux Styles pour la Modal de Prévisualisation IA ⭐⭐
  aiPreviewModalContainer: {
    width: '95%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    maxHeight: '90%',
  },
  aiPreviewTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#388E3C', // Vert foncé
    marginBottom: 15,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#A5D6A7',
    paddingBottom: 10,
  },
  aiPreviewScrollView: {
    maxHeight: '75%', // Limite la hauteur de la zone de défilement
  },
  aiPreviewRecipeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  aiPreviewDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  aiPreviewDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  aiPreviewDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  aiPreviewDetailText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#388E3C',
    fontWeight: 'bold',
  },
  aiPreviewSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 5,
  },
  aiPreviewListItem: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5,
    paddingLeft: 10,
  },
  aiPreviewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
  },
  // ⭐⭐ Fin des Nouveaux Styles ⭐⭐
});

export default RecipesScreen;
