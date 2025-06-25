# Documentation Technique - TchopTime

## Architecture

### Frontend (React Native)
- **Langage**: JavaScript
- **Framework**: React Native CLI
- **UI Framework**: React Native Paper
- **Navigation**: React Navigation (Stack, Tab, Drawer)
- **État Global**: Context API
- **Thème**: Palette personnalisée (#4F46E5, #818CF8, #171624)

### Backend (Firebase)
- **Authentification**: Firebase Auth
- **Base de données**: Cloud Firestore
- **Stockage**: Cloud Storage
- **Fonctions**: Cloud Functions
- **Notifications**: Firebase Cloud Messaging
- **Géolocalisation**: OpenRouteService API
- **IA**: OpenAI API

## Structure des Données

### Collections Firestore

#### Users
```typescript
{
  email: string,
  displayName: string,
  photoURL: string,
  familyMembers: Array<FamilyMember>,
  userRecipes: Array<Recipe>,
  mealPlans: Array<Meal>,
  stock: {
    foods: Array<Food>,
    ingredients: Array<Ingredient>,
  },
  shoppingLists: Array<ShoppingList>,
  notifications: Array<Notification>,
  iaInteractions: Array<IAInteraction>,
  notificationToken: string,
  lastNotificationUpdate: Timestamp,
}
```

#### Recipes
```typescript
{
  name: string,
  description: string,
  ingredients: Array<{
    name: string,
    quantity: number,
    unit: string,
  }>,
  instructions: string[],
  image: string,
  preparationTime: number,
  cookingTime: number,
  difficulty: string,
  cuisine: string,
  isGlobal: boolean,
  createdAt: Timestamp,
  generatedByAI: boolean,
}
```

#### FamilyMembers
```typescript
{
  name: string,
  alias: string,
  universe: string,
  age: number,
  gender: string,
  consumptionFactor: number,
}
```

## Services

### Frontend
- `profileService.js`: Gestion du profil utilisateur
- `familyService.js`: Gestion des membres familiaux
- `stockService.js`: Gestion du stock et des ingrédients
- `notificationService.js`: Gestion des notifications
- `testService.js`: Tests unitaires et d'intégration

### Backend
- `pdfGenerator.js`: Génération de PDF
- `emailService.js`: Envoi d'emails
- `aiService.js`: Fonctionnalités IA

## API Externes

### OpenAI
- Génération de recettes
- Critiques constructives
- Scripts de tutoriels vidéo

### OpenRouteService
- Recherche de marchés proches
- Géolocalisation

## Sécurité

### Firebase
- Authentification sécurisée
- Règles de sécurité Firestore
- Gestion des tokens de notification

### Stockage
- Chiffrement des données sensibles
- Gestion des droits d'accès

## Tests

### Unitaires
- Tests des services
- Tests des composants
- Tests d'authentification

### Intégration
- Tests de navigation
- Tests de flux utilisateur
- Tests d'API

## Déploiement

### Configuration
- Variables d'environnement
- Clés API
- Configuration Firebase

### Processus
- Build
- Tests
- Déploiement
- Monitoring

## Maintenance

### Mises à jour
- Dépendances
- Sécurité
- Performances

### Documentation
- Code
- API
- Architecture
- Sécurité
