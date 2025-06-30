// src/screens/Onboarding/OnboardingFlow.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

// Définition des types pour les props du composant
interface OnboardingFlowProps {
  onOnboardingComplete: () => void;
}

// Importez toutes vos images locales. Assurez-vous des chemins et extensions corrects.
// LES CHEMINS SONT CORRIGÉS ICI :
const onboardingImage1 = require('../../../src/assets/images/onboarding1.jpg');
const onboardingImage2 = require('../../../src/assets/images/onboarding2.jpg'); // Correction ici aussi si vous aviez mis le même chemin que onboarding1
const onboardingImage3 = require('../../../src/assets/images/onboarding3.jpg'); // Correction ici aussi si vous aviez mis le même chemin que onboarding1
//const logo = require('../src/assets/images/logo_marmiton.png'); // Logo Marmiton

const { width, height } = Dimensions.get('window'); // Pour un design réactif

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onOnboardingComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0); // Gère l'étape actuelle de l'onboarding (0, 1, 2)

  // Fonction pour passer à l'étape suivante
  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      onOnboardingComplete(); // Si c'est la dernière étape, déclenche la fonction de complétion de l'onboarding
    }
  };

  // Fonction pour revenir à l'étape précédente
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Fonction pour sauter l'onboarding entièrement
  const handleSkip = () => {
    onOnboardingComplete();
  };

  // Rendu des indicateurs de pagination (les petits points en bas)
  const renderPagination = () => (
    <View style={styles.pagination}>
      {[0, 1, 2].map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentStep ? styles.activeDot : {}]}
        />
      ))}
    </View>
  );

  // Rendu de l'en-tête (logo et bouton Passer)
  const renderHeader = () => (
    <View style={styles.header}>
      {/*<Image source={logo} style={styles.logo} resizeMode="contain" />*/}
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>
    </View>
  );

  // Rendu du pied de page (boutons Précédent/Suivant/Commencer et pagination)
  const renderFooter = () => (
    <View style={styles.footer}>
      {/* Bouton "Précédent" visible uniquement à partir du 2ème écran */}
      {currentStep > 0 ? (
        <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
          <Text style={styles.buttonText}>Précédent</Text>
        </TouchableOpacity>
      ) : (
        // Placeholder pour maintenir l'alignement quand "Précédent" est absent
        <View style={styles.navButtonPlaceholder} />
      )}

      {renderPagination()} {/* Les indicateurs de page */}

      {/* Bouton "Commencer" sur le dernier écran, sinon "Suivant" */}
      {currentStep === 2 ? (
        <TouchableOpacity style={styles.getStartedButton} onPress={handleNext}>
          <Text style={styles.getStartedButtonText}>Commencer</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.navButton} onPress={handleNext}>
          <Text style={styles.buttonText}>Suivant</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Contenu dynamique de l'écran d'onboarding en fonction de l'étape actuelle
  const renderOnboardingContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Text style={styles.title}>Gagnez du temps</Text>
            <Text style={styles.description}>
              En planifiant simplement vos repas grâce à notre outil "menu de la
              semaine" conçu pour vous aider au quotidien.
            </Text>
            <Image source={onboardingImage1} style={styles.image} resizeMode="contain" />
          </>
        );
      case 1:
        return (
          <>
            <Text style={styles.title}>Courses simplifiées, stock maîtrisé</Text>
            <Text style={styles.description}>
              Générez automatiquement vos listes de courses avec la saisie vocale et
              optimisez vos achats grâce aux prix locaux.
            </Text>
            <Image source={onboardingImage2} style={styles.image} resizeMode="contain" />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>Le plein d'idées</Text>
            <Text style={styles.description}>
              Trouvez votre bonheur avec plus de +76000 recettes pour toutes vos envies
              (et celles de votre frigo)
            </Text>
            <Image source={onboardingImage3} style={styles.image} resizeMode="contain" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.content}>
        {renderOnboardingContent()}
      </View>
      {renderFooter()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF', // Fond blanc
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 0, // Gère l'espace de la barre de statut sur Android
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logo: {
    width: 100, // Largeur du logo
    height: 40, // Hauteur du logo
  },
  skipButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#FF6F61', // Couleur rouge-orange inspirée des maquettes Marmiton
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  image: {
    width: width * 0.8, // 80% de la largeur de l'écran
    height: height * 0.4, // 40% de la hauteur de l'écran
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    position: 'absolute', // Pour que le footer reste en bas
    bottom: 0,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  navButtonPlaceholder: {
    width: 80, // Largeur approximative pour aligner les boutons quand 'Précédent' est absent
  },
  buttonText: {
    fontSize: 16,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  getStartedButton: {
    backgroundColor: '#FF6F61', // Couleur du bouton "Commencer"
    borderRadius: 25, // Coins arrondis
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  getStartedButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#FF6F61',
  },
});

export default OnboardingFlow;