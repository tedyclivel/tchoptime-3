import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  TextInput,
  List,
  Avatar,
  Portal,
  Modal,
  Paragraph,
  Switch,
} from 'react-native-paper';
import { getFamilyConfig, updateFamilyConfig, calculateDefaultConsumptionFactor } from '../services/familyService';

const { width } = Dimensions.get('window');

const FamilyConfigScreen = () => {
  const [config, setConfig] = useState({
    members: [],
    consumptionFactors: {},
    isConfigured: false,
  });
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    alias: '',
    age: '',
    gender: '',
    consumptionFactor: '',
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    loadFamilyConfig();
  }, []);

  const loadFamilyConfig = async () => {
    try {
      const familyConfig = await getFamilyConfig();
      setConfig(familyConfig || {
        members: [],
        consumptionFactors: {},
        isConfigured: false,
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la configuration familiale:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      const age = parseInt(newMember.age);
      const defaultFactor = calculateDefaultConsumptionFactor(age);
      
      await updateFamilyConfig({
        members: [...config.members, {
          ...newMember,
          id: Date.now().toString(),
          consumptionFactor: newMember.consumptionFactor || defaultFactor,
        }],
        consumptionFactors: {
          ...config.consumptionFactors,
          [age]: newMember.consumptionFactor || defaultFactor,
        },
      });

      setNewMember({
        name: '',
        alias: '',
        age: '',
        gender: '',
        consumptionFactor: '',
      });
      setShowMemberModal(false);
      await loadFamilyConfig();
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du membre:', error);
    }
  };

  const handleUpdateConsumptionFactor = async (memberId, factor) => {
    try {
      const updatedMembers = config.members.map(member =>
        member.id === memberId
          ? { ...member, consumptionFactor: factor }
          : member
      );

      await updateFamilyConfig({
        members: updatedMembers,
        consumptionFactors: {
          ...config.consumptionFactors,
          [updatedMembers.find(m => m.id === memberId).age]: factor,
        },
      });
      await loadFamilyConfig();
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du facteur de consommation:', error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await updateFamilyConfig({
        members: config.members.filter(m => m.id !== memberId),
      });
      await loadFamilyConfig();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du membre:', error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title="Configuration Familiale"
          subtitle={`Total des facteurs de consommation: ${
            config.members.reduce(
              (total, member) => total + (member.consumptionFactor || 1),
              0
            ).toFixed(2)
          }`}
        />
        <Card.Content>
          <View style={styles.membersList}>
            {config.members.map((member) => (
              <List.Item
                key={member.id}
                title={member.name}
                description={`${member.age} ans - ${member.gender}`}
                left={(props) => (
                  <Avatar.Text
                    {...props}
                    label={member.alias || member.name[0]}
                    style={styles.avatar}
                  />
                )}
                right={(props) => (
                  <>
                    <List.Icon
                      {...props}
                      icon="delete"
                      color={theme.colors.error}
                      onPress={() => handleDeleteMember(member.id)}
                    />
                    <List.Icon
                      {...props}
                      icon="calculator"
                      color={theme.colors.primary}
                      onPress={() =>
                        setShowMemberModal(true)
                      }
                    />
                  </>
                )}
              />
            ))}
          </View>
          <Button
            mode="contained"
            onPress={() => setShowMemberModal(true)}
            style={styles.addButton}
          >
            Ajouter un membre
          </Button>
          <View style={styles.consumptionFactors}>
            <Text style={styles.sectionTitle}>Facteurs de consommation par âge</Text>
            {Object.entries(config.consumptionFactors).map(([age, factor]) => (
              <View key={age} style={styles.factorItem}>
                <Text style={styles.factorLabel}>
                  {`${age} ans: ${factor.toFixed(2)}`}
                </Text>
                <TextInput
                  value={factor.toString()}
                  onChangeText={(text) => handleUpdateConsumptionFactor(age, parseFloat(text))}
                  keyboardType="numeric"
                  style={styles.factorInput}
                  mode="outlined"
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={showMemberModal}
          onDismiss={() => setShowMemberModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <TextInput
                label="Nom"
                value={newMember.name}
                onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Surnom"
                value={newMember.alias}
                onChangeText={(text) => setNewMember({ ...newMember, alias: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Âge"
                value={newMember.age}
                onChangeText={(text) => setNewMember({ ...newMember, age: text })}
                keyboardType="numeric"
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Sexe"
                value={newMember.gender}
                onChangeText={(text) => setNewMember({ ...newMember, gender: text })}
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Facteur de consommation"
                value={newMember.consumptionFactor}
                onChangeText={(text) => setNewMember({ ...newMember, consumptionFactor: text })}
                keyboardType="numeric"
                style={styles.modalInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowMemberModal(false)}>Annuler</Button>
              <Button onPress={handleAddMember}>Ajouter</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171624',
    padding: 16,
  },
  card: {
    backgroundColor: '#2D2C3E',
  },
  membersList: {
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#4F46E5',
  },
  addButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
  },
  consumptionFactors: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E1F2',
    marginBottom: 16,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorLabel: {
    flex: 1,
    color: '#E2E1F2',
  },
  factorInput: {
    width: 80,
  },
  modalContainer: {
    backgroundColor: '#2D2C3E',
    padding: 16,
  },
  modalInput: {
    marginBottom: 16,
    width: width - 64,
  },
});

export default FamilyConfigScreen;
