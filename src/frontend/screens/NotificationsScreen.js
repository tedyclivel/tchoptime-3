import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  List,
  Avatar,
  Badge,
  Switch,
} from 'react-native-paper';
import { getDocument, updateDocument } from '../backend/services/firestoreService';
import { auth } from '../backend/firebase';
import { initializeMessaging } from '../services/notificationService';

const { width } = Dimensions.get('window');

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    loadNotifications();
    initializeMessaging();
    checkPushNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const user = await getDocument('users', userId);
      setNotifications(user?.notifications || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushNotifications = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const user = await getDocument('users', userId);
      setPushNotificationsEnabled(!!user?.notificationToken);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des notifications push:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await checkPushNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const user = await getDocument('users', userId);
      const updatedNotifications = user.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );

      await updateDocument('users', userId, {
        notifications: updatedNotifications,
      });

      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la notification:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const user = await getDocument('users', userId);
      const updatedNotifications = user.notifications.filter(
        notification => notification.id !== notificationId
      );

      await updateDocument('users', userId, {
        notifications: updatedNotifications,
      });

      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la notification:', error);
    }
  };

  const togglePushNotifications = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      if (!pushNotificationsEnabled) {
        // Si les notifications push sont désactivées, les activer
        await initializeMessaging();
      }

      setPushNotificationsEnabled(!pushNotificationsEnabled);
    } catch (error) {
      console.error('❌ Erreur lors du changement des notifications push:', error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  // Grouper les notifications par type
  const groupedNotifications = {
    reminders: notifications.filter(n => n.type === 'reminder'),
    alerts: notifications.filter(n => n.type === 'alert'),
    updates: notifications.filter(n => n.type === 'update'),
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Section des paramètres */}
        <Card style={styles.settingsCard}>
          <Card.Title title="Paramètres des notifications" />
          <Card.Content>
            <List.Item
              title="Notifications push"
              description="Recevoir des notifications même lorsque l'application est fermée"
              right={(props) => (
                <Switch
                  {...props}
                  value={pushNotificationsEnabled}
                  onValueChange={togglePushNotifications}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Section des rappels */}
        {groupedNotifications.reminders.length > 0 && (
          <Card style={styles.notificationsCard}>
            <Card.Title title="Rappels" />
            {groupedNotifications.reminders.map((notification) => (
              <List.Item
                key={notification.id}
                title={notification.title}
                description={notification.body}
                left={(props) => (
                  <Avatar.Icon
                    {...props}
                    icon="bell"
                    color={notification.read ? theme.colors.onSurface : theme.colors.primary}
                  />
                )}
                right={(props) => (
                  <Badge
                    {...props}
                    visible={!notification.read}
                    onPress={() => markAsRead(notification.id)}
                  >
                    {notification.read ? 'Lu' : 'Non lu'}
                  </Badge>
                )}
                onPress={() => deleteNotification(notification.id)}
              />
            ))}
          </Card>
        )}

        {/* Section des alertes */}
        {groupedNotifications.alerts.length > 0 && (
          <Card style={styles.notificationsCard}>
            <Card.Title title="Alertes" />
            {groupedNotifications.alerts.map((notification) => (
              <List.Item
                key={notification.id}
                title={notification.title}
                description={notification.body}
                left={(props) => (
                  <Avatar.Icon
                    {...props}
                    icon="alert"
                    color={notification.read ? theme.colors.onSurface : theme.colors.error}
                  />
                )}
                right={(props) => (
                  <Badge
                    {...props}
                    visible={!notification.read}
                    onPress={() => markAsRead(notification.id)}
                  >
                    {notification.read ? 'Lu' : 'Non lu'}
                  </Badge>
                )}
                onPress={() => deleteNotification(notification.id)}
              />
            ))}
          </Card>
        )}

        {/* Section des mises à jour */}
        {groupedNotifications.updates.length > 0 && (
          <Card style={styles.notificationsCard}>
            <Card.Title title="Mises à jour" />
            {groupedNotifications.updates.map((notification) => (
              <List.Item
                key={notification.id}
                title={notification.title}
                description={notification.body}
                left={(props) => (
                  <Avatar.Icon
                    {...props}
                    icon="update"
                    color={notification.read ? theme.colors.onSurface : theme.colors.primary}
                  />
                )}
                right={(props) => (
                  <Badge
                    {...props}
                    visible={!notification.read}
                    onPress={() => markAsRead(notification.id)}
                  >
                    {notification.read ? 'Lu' : 'Non lu'}
                  </Badge>
                )}
                onPress={() => deleteNotification(notification.id)}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
  },
  settingsCard: {
    backgroundColor: '#2D2C3E',
    margin: 16,
  },
  notificationsCard: {
    backgroundColor: '#2D2C3E',
    marginHorizontal: 16,
    marginBottom: 16,
  },
});

export default NotificationsScreen;
