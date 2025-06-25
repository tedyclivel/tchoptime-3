import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileService } from './profileService';
import { FamilyService } from './familyService';
import { StockService } from './stockService';
import { NotificationService } from './notificationService';

// Configuration du thème pour les tests
const theme = {
  colors: {
    primary: '#4F46E5',
    background: '#171624',
    surface: '#2D2C3E',
    text: '#E2E1F2',
  },
};

describe('Services Tests', () => {
  // Configuration avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Nettoyage après chaque test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests pour le service de profil
  describe('ProfileService', () => {
    it('should create a new profile', async () => {
      const profileService = new ProfileService();
      const profile = await profileService.createProfile({
        displayName: 'Test User',
        photoURL: 'test.jpg',
      });

      expect(profile.displayName).toBe('Test User');
      expect(profile.photoURL).toBe('test.jpg');
    });

    it('should update profile successfully', async () => {
      const profileService = new ProfileService();
      const result = await profileService.updateProfile({
        displayName: 'Updated User',
      });

      expect(result).toBe(true);
    });
  });

  // Tests pour le service familial
  describe('FamilyService', () => {
    it('should add family member', async () => {
      const familyService = new FamilyService();
      const member = await familyService.addMember({
        name: 'Test Member',
        age: 30,
      });

      expect(member.name).toBe('Test Member');
      expect(member.age).toBe(30);
    });

    it('should calculate consumption factor', () => {
      const familyService = new FamilyService();
      const factor = familyService.calculateConsumptionFactor(10);

      expect(factor).toBeCloseTo(0.9, 1);
    });
  });

  // Tests pour le service de stock
  describe('StockService', () => {
    it('should add item to stock', async () => {
      const stockService = new StockService();
      const item = await stockService.addItem({
        name: 'Apple',
        quantity: 5,
        unit: 'kg',
      });

      expect(item.name).toBe('Apple');
      expect(item.quantity).toBe(5);
    });

    it('should update item quantity', async () => {
      const stockService = new StockService();
      const result = await stockService.updateQuantity('123', 10);

      expect(result).toBe(true);
    });
  });

  // Tests pour le service de notifications
  describe('NotificationService', () => {
    it('should send push notification', async () => {
      const notificationService = new NotificationService();
      const result = await notificationService.sendPushNotification({
        title: 'Test',
        body: 'Test notification',
      });

      expect(result).toBe(true);
    });

    it('should generate local notification', async () => {
      const notificationService = new NotificationService();
      const result = await notificationService.generateLocalNotification({
        title: 'Test',
        body: 'Test notification',
      });

      expect(result).toBe(true);
    });
  });
});

// Tests d'intégration
describe('Integration Tests', () => {
  it('should navigate between screens', async () => {
    const { getByText } = render(
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AuthProvider>
            {/* Composants de navigation */}
          </AuthProvider>
        </NavigationContainer>
      </PaperProvider>
    );

    fireEvent.press(getByText('Planning'));
    fireEvent.press(getByText('Shopping List'));
    fireEvent.press(getByText('Recipes'));

    expect(screen.getByText('Planning')).toBeTruthy();
    expect(screen.getByText('Shopping List')).toBeTruthy();
    expect(screen.getByText('Recipes')).toBeTruthy();
  });

  it('should handle authentication flow', async () => {
    const { getByText } = render(
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AuthProvider>
            {/* Composants d'authentification */}
          </AuthProvider>
        </NavigationContainer>
      </PaperProvider>
    );

    fireEvent.press(getByText('Sign In'));
    fireEvent.press(getByText('Sign Up'));

    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Sign Up')).toBeTruthy();
  });
});
