import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  FAB,
  useTheme,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { firestore } from '../../backend/firebase';
import { auth } from '../../backend/firebase';

const FamilyMembersScreen = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(firestore, 'familyMembers'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      setMembers(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })));
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMembers();
    setRefreshing(false);
  }, []);

  const handleAddMember = () => {
    // TODO: Implement member addition logic
    navigation.navigate('AddMember');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddMember}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <List.Section>
          {members.map((member) => (
            <List.Item
              key={member.id}
              title={member.name}
              description={member.alias}
              left={props => <List.Icon {...props} icon="account" />}
              right={props => (
                <List.Icon
                  {...props}
                  icon="dots-vertical"
                  onPress={() => handleMemberOptions(member)}
                />
              )}
            />
          ))}
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
  },
  scrollView: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171624',
  },
});

export default FamilyMembersScreen;
