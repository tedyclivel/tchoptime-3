This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.





backend/
│── config/
│   ├── firebaseAdminSDK.json  # Clé privée Firebase
│   ├── cloudinaryConfig.js    # Configuration Cloudinary
│   ├── emailConfig.js         # Config SendGrid/Nodemailer
│
│── functions/
│   ├── generateMenuPDF.js     # Génération du menu en PDF
│   ├── sendWeeklyMenu.js      # Envoi du PDF par email
│   ├── aiAnalysis.js          # Analyse IA des repas et suggestions
│   ├── updateStock.js         # Mise à jour automatique du stock
│   ├── fetchNearbyMarkets.js  # Recherche des marchés proches via Google Maps
│   ├── generateShoppingList.js # Génération intelligente de la liste de courses
│   ├── textToSpeech.js        # Lecture vocale de la liste de marché
│
│── models/
│   ├── users.js               # Schéma utilisateur et gestion des préférences alimentaires
│   ├── recipes.js             # Structure des recettes et stockage des ingrédients
│   ├── stock.js               # Modèle de gestion du stock
│   ├── mealPlans.js           # Programmation des repas
│   ├── markets.js             # Gestion des marchés et prix des ingrédients
│   ├── shoppingLists.js       # Gestion et validation des listes de courses
│   ├── iaInteractions.js      # Historique des requêtes IA
│
│── services/
│   ├── firestoreService.js    # Connexion et requêtes vers Firestore
│   ├── cloudFunctionsService.js # TchopTime - Gestion des Repas Familiaux
│   ├── emailService.js        # Service d’envoi des emails
│   ├── aiService.js           # Intégration des API IA (Google AI, OpenAI)
│   ├── mapsService.js         # API Google Maps pour calculer les trajets
│   ├── textToSpeechService.js # API TTS pour lire les listes de marché
│
│── utils/
│   ├── formatDate.js          # Utilitaires de gestion de dates
│   ├── normalizeData.js       # Normalisation des données avant enregistrement
│   ├── validateInputs.js      # Validation des entrées utilisateur
│
│── tests/
│   ├── testGenerateMenuPDF.js # Tests de génération de PDF
│   ├── testUpdateStock.js     # Vérification de la gestion des stocks
│   ├── testAiAnalysis.js      # Tests de l'IA pour les repas
│
│── index.js                   # Point d'entrée du backend
│── package.json                # Dépendances et scripts NPM
│── README.md                   # Documentation du projet backend



