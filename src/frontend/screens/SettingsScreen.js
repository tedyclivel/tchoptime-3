import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Switch,
  List,
  useTheme,
  Divider,
  Button,
  TextInput,
} from 'react-native-paper';
import { auth } from '../../backend/firebase';

const SettingsScreen = () => {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [units, setUnits] = useState('metric');
  const [currency, setCurrency] = useState('EUR');

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // TODO: Navigate to auth screen
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <List.Section>
            <List.Subheader>Notifications</List.Subheader>
            <List.Item
              title="Activer les notifications"
              right={props => (
                <Switch
                  {...props}
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
          </List.Section>

          <Divider style={styles.divider} />

          <List.Section>
            <List.Subheader>Unités</List.Subheader>
            <List.Item
              title="Système d'unités"
              description={units === 'metric' ? 'Système métrique' : 'Système impérial'}
              right={props => (
                <List.Icon
                  {...props}
                  icon="chevron-right"
                  onPress={() => handleUnitsChange()}
                />
              )}
            />
          </List.Section>

          <Divider style={styles.divider} />

          <List.Section>
            <List.Subheader>Monnaie</List.Subheader>
            <List.Item
              title="Devise"
              description={currency}
              right={props => (
                <List.Icon
                  {...props}
                  icon="chevron-right"
                  onPress={() => handleCurrencyChange()}
                />
              )}
            />
          </List.Section>

          <Divider style={styles.divider} />

          <List.Section>
            <List.Item
              title="À propos"
              description="Version 1.0.0"
              right={props => <List.Icon {...props} icon="info" />}
            />
          </List.Section>

          <Button
            mode="outlined"
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            Se déconnecter
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
  },
  card: {
    margin: 16,
  },
  divider: {
    marginVertical: 8,
  },
  signOutButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
});

export default SettingsScreen;
