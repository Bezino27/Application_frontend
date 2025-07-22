import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TreningyScreen() {
  return (
      <View style={styles.container}>
        <Text style={styles.text}>🚧 Stránka je dočasne nedostupná</Text>
        <Text style={styles.subtext}>Skúšame testovanie stabilnej verzie aplikácie.</Text>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});