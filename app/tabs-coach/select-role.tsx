import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';

export default function SelectRoleScreen() {
  const { userRoles } = useContext(AuthContext);
  const router = useRouter();

  if (!userRoles || userRoles.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Nemáte priradené žiadne roly.</Text>
      </View>
    );
  }

  const handleSelect = (role: string) => {
    if (role === 'admin') {
      router.replace('/tabs-admin');
    } else if (role === 'coach') {
      router.replace('/tabs-coach');
    } else if (role === 'player') {
      router.replace('/tabs-player');
    } else {
      Alert.alert('Nepodporovaná rola', role);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Vyber si rolu</Text>
      {userRoles.map((role: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => handleSelect(role)}
        >
          <Text style={styles.buttonText}>{role.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4c68d7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});